const Booking = require('../models/Booking')
const Payment = require('../models/Payment')
const nestpay = require('../services/nestpayService')
const emailService = require('../services/emailService')

/**
 * createBktPayment
 * - Create local Payment record (if not existing) and return a form payload
 *   that the frontend should submit to BKT's 3D_PAY_HOSTING endpoint.
 */
const createBktPayment = async (req, res) => {
  try {
    const { bookingId } = req.body
    if (!bookingId) return res.status(400).json({ message: 'bookingId is required' })

    const booking = await Booking.findById(bookingId)
    if (!booking) return res.status(404).json({ message: 'Booking not found' })

    // Create a Payment record locally for tracking
    const payment = await Payment.create({
      booking: booking._id,
      provider: 'BKT',
      amount: booking.pricing.totalAmount,
      currency: booking.pricing.currency || 'EUR',
      status: 'pending'
    })

    const form = nestpay.create3DPayHostingFields({ booking, payment })

    return res.json({
      message: 'BKT NestPay payment form created.',
      form: {
        action: form.action,
        method: 'POST',
        fields: form.fields
      }
    })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

/**
 * handleBktCallback
 * - Accepts raw callback payload and safely verifies hash if provided.
 * - Does NOT update payment/booking records unless verifyHashV3 returns true
 */
const handleBktCallback = async (req, res) => {
  try {
    const payload = req.body || {}
    console.log('BKT callback received')

    const receivedHash = payload.HASH || payload.hash
    if (!receivedHash) {
      return res.status(400).json({ message: 'Missing NestPay HASH. Payment not updated.' })
    }

    const verified = nestpay.verifyHashV3(payload, receivedHash, process.env.BKT_STORE_KEY)
    if (!verified) {
      return res.status(400).json({ message: 'Invalid NestPay hash. Payment not updated.' })
    }

    // Extract order id (oid) from possible fields
    const oid = payload.oid || payload.OID || payload.OrderId || payload.orderId
    if (!oid) {
      return res.status(400).json({ message: 'Missing order id (oid). Payment not updated.' })
    }

    const booking = await Booking.findOne({ bookingNumber: oid }).populate('room')
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found for oid. Payment not updated.' })
    }

    // Find latest payment for booking
    let payment = await Payment.findOne({ booking: booking._id }).sort({ createdAt: -1 })
    if (!payment) {
      // If no payment exists, create a payment record to attach response to
      payment = await Payment.create({ booking: booking._id, provider: 'BKT', amount: booking.pricing.totalAmount, currency: booking.pricing.currency || 'EUR', status: 'pending' })
    }

    // Save raw response
    payment.rawResponse = payload

    // Determine status
    const p = payload
    let status = 'failed'
    if ((p.Response && String(p.Response) === 'Approved') || (p.response && String(p.response) === 'Approved')) {
      status = 'paid'
    } else if (p.ProcReturnCode && String(p.ProcReturnCode) === '00') {
      status = 'paid'
    } else {
      // fallback to mapNestpayStatus
      status = nestpay.mapNestpayStatus(payload) || 'failed'
      if (status !== 'paid') status = 'failed'
    }

    if (status === 'paid') {
      payment.status = 'paid'
      booking.paymentStatus = 'paid'
      booking.status = 'paid'
    } else {
      payment.status = 'failed'
      booking.paymentStatus = 'failed'
      booking.status = 'failed'
    }

    await payment.save()
    await booking.save()

    // Send notification emails (do not let email failures affect callback response)
    try {
      if (payment.status === 'paid') {
        try { await emailService.sendBookingPaidCustomerEmail(booking) } catch (e) { console.log('Email send error (customer paid):', e && e.message ? e.message : e) }
        try {
          const ok = await emailService.sendBookingPaidAdminEmail(booking, payment)
          if (!ok) console.log('Admin paid email not sent or failed (see logs)')
        } catch (e) { console.log('Admin email failed', e && e.message ? e.message : e) }
      } else {
        try { await emailService.sendBookingFailedCustomerEmail(booking) } catch (e) { console.log('Email send error (customer failed):', e && e.message ? e.message : e) }
        try {
          const ok = await emailService.sendBookingFailedAdminEmail(booking, payment)
          if (!ok) console.log('Admin failed email not sent or failed (see logs)')
        } catch (e) { console.log('Admin email failed', e && e.message ? e.message : e) }
      }
    } catch (e) {
      // Ensure we never fail the callback due to email errors
      console.log('Email notifications encountered an unexpected error:', e && e.message ? e.message : e)
    }

    return res.json({ message: 'BKT callback processed.', paymentStatus: payment.status, bookingStatus: booking.status })
  } catch (error) {
    console.error('Error in BKT callback handler:', error)
    return res.status(500).json({ message: error.message })
  }
}

module.exports = {
  createBktPayment,
  handleBktCallback
}
