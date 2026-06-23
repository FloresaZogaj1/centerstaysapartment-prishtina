const Booking = require('../models/Booking')
const Payment = require('../models/Payment')
const bankartService = require('../services/bankartService')

const createBankartPayment = async (req, res) => {
  try {
    const { bookingId } = req.body
    if (!bookingId) return res.status(400).json({ message: 'bookingId is required' })

    const booking = await Booking.findById(bookingId)
    if (!booking) return res.status(404).json({ message: 'Booking not found' })

    const paymentData = {
      booking: booking._id,
      provider: 'nlb_bankart',
      amount: booking.pricing.totalAmount,
      currency: 'EUR',
      status: 'pending',
    }

    const payment = await Payment.create(paymentData)

    // Update booking paymentStatus
    booking.paymentStatus = 'pending'
    await booking.save()

    // Build Bankart session/form metadata
    const urls = {
      successUrl: process.env.BKT_SUCCESS_URL || `${process.env.FRONTEND_URL}/payment/success`,
      failUrl: process.env.BKT_FAIL_URL || `${process.env.FRONTEND_URL}/payment/fail`,
      callbackUrl: process.env.BKT_CALLBACK_URL || `${process.env.FRONTEND_URL}/api/payments/bankart/callback`
    }

    // Create session with guard: service may return { error } if not configured
    const session = await bankartService.createBankartPaymentSession({ booking, payment, urls })

    if (session && session.error) {
      // Sanitize: only log the high-level reason, avoid logging secrets/headers/body
      console.log('[createBankartPayment] bankart session disabled or not configured:', String(session.error).slice(0, 200))
      return res.status(503).json({ message: 'Bankart provider not available', reason: session.error })
    }

    // Allowed log fields: provider, bookingId, paymentId, amount, currency, merchantOrderId
    console.log('[createBankartPayment] provider=nlb_bankart bookingId=%s paymentId=%s amount=%s currency=%s merchantOrderId=%s',
      String(booking._id), String(payment._id), String(payment.amount), payment.currency || 'EUR', String(payment._id))

    return res.json({ message: 'Bankart payment created (server-side).', payment, session })
  } catch (error) {
    console.error('[createBankartPayment] error:', error)
    return res.status(500).json({ message: error.message })
  }
}

module.exports = {
  createBankartPayment,
}

// Placeholder handler for Bankart callback/webhook
const bankartCallback = async (req, res) => {
  try {
    const payload = req.body
    console.log('[Bankart Callback] received payload keys:', Object.keys(payload || {}))

    // Use rawBody captured by express.json verify option for exact signature verification
    const rawBody = req.rawBody || null
    const requestPath = req.originalUrl || req.url || req.path || '/'
    const method = req.method || 'POST'
    const verification = bankartService.verifyBankartCallback(req.headers || {}, payload, rawBody, requestPath, method)

    if (!verification || !verification.valid) {
      // Sanitize verification failure logs
      console.log('[Bankart Callback] verification failed:', String(verification && verification.reason || '').slice(0,200))
      return res.status(400).send('Invalid signature')
    }

    // Map provider status to normalized status
  const normalized = bankartService.mapBankartStatus(payload.status || payload.result || '')

    // Find payment by merchantTransactionId or merchantOrderId if provided
    const merchantOrderId = payload.merchantTransactionId || payload.merchantOrderId || payload.orderId || payload.merchantOrder || null
    if (!merchantOrderId) {
      console.log('[Bankart Callback] no merchantTransactionId found in payload')
      return res.status(400).json({ message: 'No merchantTransactionId in payload' })
    }

    const payment = await Payment.findById(merchantOrderId)
    if (!payment) {
      console.log('[Bankart Callback] payment not found for id:', String(merchantOrderId).slice(0,200))
      return res.status(404).json({ message: 'Payment not found' })
    }

    // Update payment and associated booking
    payment.status = normalized
    payment.providerResponse = payload
    payment.updatedAt = new Date()
    await payment.save()

    if (payment.booking) {
      const booking = await Booking.findById(payment.booking)
      if (booking) {
        booking.paymentStatus = normalized
        await booking.save()
      }
    }

    // Respond with exact content expected by Bankart
    res.set('Content-Type', 'text/plain')
    return res.status(200).send('OK')
  } catch (error) {
    console.error('[Bankart Callback] error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

module.exports.bankartCallback = bankartCallback

