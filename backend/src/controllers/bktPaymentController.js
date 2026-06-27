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

    // Safe diagnostic logs: show which customer-facing URLs are being sent to BKT
    try {
      const fields = form && form.fields ? form.fields : {}
      const okUrl = fields.okUrl
      const failUrl = fields.failUrl
      const cancelUrl = fields.cancelUrl
      const callbackUrl = fields.callbackUrl
      const orderId = String(fields.oid || fields.OID || fields.OrderId || fields.orderId || '(unset)')
      const amt = String(fields.amount || payment.amount || (booking && booking.pricing && booking.pricing.totalAmount) || '(unset)')
      // Log exactly the backend endpoints being sent (safe)
      console.log('[createBktPayment] BKT redirect fields being sent:')
      console.log('okUrl=%s', String(okUrl || '(unset)'))
      console.log('failUrl=%s', String(failUrl || '(unset)'))
      console.log('cancelUrl=%s', String(cancelUrl || '(unset)'))
      console.log('callbackUrl=%s', String(callbackUrl || '(unset)'))
      console.log('bookingId=%s orderId=%s amount=%s paymentId=%s', String(booking._id), orderId, amt, String(payment._id))
    } catch (e) { /* swallow logging errors */ }

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

    // Minimal sanitized log for quick inspection
    try {
      console.log('[BKT callback] received', {
        method: req.method,
        origin: req.headers && req.headers.origin,
        referer: req.headers && req.headers.referer,
        oid: payload.oid || payload.OID || payload.OrderId || payload.orderId || null,
        ProcReturnCode: payload.ProcReturnCode || null,
        Response: payload.Response || payload.response || null,
        ErrMsg: payload.ErrMsg || payload.Errmsg || null,
        ErrorCode: payload.ErrorCode || null,
        bodyKeys: Object.keys(payload || {})
      })
    } catch (e) {}

    // Log sanitized provider values for easier debugging of declines (no PAN/CVV or full card data)
    try {
      console.log('[BKT callback] provider values', {
        oid: payload.oid || payload.OID || payload.OrderId || payload.orderId || null,
        ProcReturnCode: payload.ProcReturnCode || null,
        Response: payload.Response || payload.response || null,
        ErrMsg: payload.ErrMsg || payload.Errmsg || null,
        ErrorCode: payload.ErrorCode || null,
        mdStatus: payload.mdStatus || null,
        traceId: payload.traceId || null,
        TranType: payload.TranType || null,
        amount: payload.amount || null,
        currency: payload.currency || null,
        clientid: payload.clientid || null
      })
    } catch (e) {}

    const receivedHash = payload.HASH || payload.hash
    if (!receivedHash) {
      console.log('[BKT callback] missing HASH - responding 400')
      return res.status(400).type('text/plain').send('Missing HASH')
    }

    const verified = nestpay.verifyHashV3(payload, receivedHash, process.env.BKT_STORE_KEY)
    if (!verified) {
      console.log('[BKT callback] invalid HASH - responding 400')
      return res.status(400).type('text/plain').send('Invalid HASH')
    }

    // Respond immediately so the gateway does not time out
    try { console.log('[BKT callback] responding 200 OK immediately') } catch (e) {}
    res.status(200).type('text/plain').send('OK')

    // Do the heavier work asynchronously without blocking the response
    setImmediate(async () => {
      try {
        // Extract order id (oid) from possible fields
        const oid = payload.oid || payload.OID || payload.OrderId || payload.orderId
        if (!oid) {
          console.log('[BKT callback][async] missing oid - skipping DB update')
          return
        }

        const booking = await Booking.findOne({ bookingNumber: oid }).populate('room')
        if (!booking) {
          console.log('[BKT callback][async] booking not found for oid:', oid)
          return
        }

        // Find latest payment for booking
        let payment = await Payment.findOne({ booking: booking._id }).sort({ createdAt: -1 })
        if (!payment) {
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

        // Run post-payment side effects asynchronously; do not block
        setImmediate(async () => {
          try {
            if (payment.status === 'paid') {
              const invoiceService = require('../services/invoiceService')
              try {
                const inv = await invoiceService.generateAndSendInvoice(booking, payment)
                if (!inv || !inv.ok) console.log('[BKT callback][async] invoice generation/send result:', inv)
              } catch (e) { console.log('[BKT callback][async] invoice service error:', e && e.message ? e.message : e) }

              try { await emailService.sendBookingPaidCustomerEmail(booking) } catch (e) { console.log('[BKT callback][async] Email send error (customer paid):', e && e.message ? e.message : e) }
              try { await emailService.sendBookingPaidAdminEmail(booking, payment) } catch (e) { console.log('[BKT callback][async] Admin paid email failed', e && e.message ? e.message : e) }
            } else {
              try { await emailService.sendBookingFailedCustomerEmail(booking) } catch (e) { console.log('[BKT callback][async] Email send error (customer failed):', e && e.message ? e.message : e) }
              try { await emailService.sendBookingFailedAdminEmail(booking, payment) } catch (e) { console.log('[BKT callback][async] Admin failed email failed', e && e.message ? e.message : e) }
            }
          } catch (e) {
            console.log('[BKT callback][async] post-payment side effects failed:', e && e.message ? e.message : e)
          }
        })
      } catch (e) {
        console.error('[BKT callback][async] error processing payload:', e && e.message ? e.message : e)
      }
    })

    return
  } catch (error) {
    console.error('Error in BKT callback handler:', error)
    // If something goes wrong before we've responded, ensure a safe response
    try { return res.status(500).json({ message: error.message }) } catch (e) { return }
  }
}

/**
 * bktOkHandler
 * - Handles customer redirect from BKT after successful 3DS/approval.
 * - Accepts either GET (query params) or POST (form body).
 * - Verifies HASH if present and updates payment/booking accordingly.
 * - Redirects customer to FRONT_OK regardless, but only marks payment paid after verification.
 */
const bktOkHandler = async (req, res) => {
  try {
    const payload = Object.assign({}, req.method === 'GET' ? req.query : req.body)
  console.log('[bktOkHandler] BKT OK return received: method=%s route=%s sanitizedKeys=%s', req.method, req.path, JSON.stringify(Object.keys(payload).slice(0,20)))

    const receivedHash = payload.HASH || payload.hash
    let verified = false
    if (receivedHash) {
      try { verified = nestpay.verifyHashV3(payload, receivedHash, process.env.BKT_STORE_KEY) } catch (e) { verified = false }
    }

  // Identify order id
    const oid = payload.oid || payload.OID || payload.OrderId || payload.orderId || null
    if (oid) {
      const booking = await Booking.findOne({ bookingNumber: oid }).populate('room')
      if (booking) {
        let payment = await Payment.findOne({ booking: booking._id }).sort({ createdAt: -1 })
        if (!payment) {
          payment = await Payment.create({ booking: booking._id, provider: 'BKT', amount: booking.pricing.totalAmount, currency: booking.pricing.currency || 'EUR', status: 'pending' })
        }
        // Only mark paid when verified
        if (verified) {
          payment.status = 'paid'
          booking.paymentStatus = 'paid'
          booking.status = 'paid'
          await payment.save()
          await booking.save()
        } else {
          // keep pending, but attach raw response for later investigation
          payment.rawResponse = payload
          await payment.save()
        }
      }
    }

  const frontOk = process.env.FRONT_OK || (process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/payment/success` : '/payment/success')
  // Prefer hash-based frontend result routes
  const frontOkHash = process.env.FRONT_OK || process.env.FRONT_OK_HASH || (process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/payment/success` : '/payment/success')
  console.log('[bktOkHandler] redirecting customer to FRONT_OK=%s (envPresent=%s)', String(frontOkHash), Boolean(process.env.FRONT_OK || process.env.FRONT_OK_HASH || process.env.FRONTEND_URL))
  return res.redirect(String(frontOkHash))
  } catch (err) {
    console.error('[bktOkHandler] error:', err && err.message ? err.message : err)
    const frontOk = process.env.FRONT_OK || (process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/payment/success` : '/payment/success')
    return res.redirect(String(frontOk))
  }
}

/**
 * bktFailHandler
 * - Handles customer redirect from BKT after failure or cancellation.
 * - Accepts GET or POST, logs sanitized payload, attempts to associate payment and mark failed, then redirects to FRONT_FAIL.
 */
const bktFailHandler = async (req, res) => {
  try {
    const payload = Object.assign({}, req.method === 'GET' ? req.query : req.body)
    // Safe request log
    try {
      console.log('[BKT fail return] received', {
        method: req.method,
        origin: req.headers && req.headers.origin,
        referer: req.headers && req.headers.referer,
        queryKeys: Object.keys(req.query || {}),
        bodyKeys: Object.keys(req.body || {})
      })
    } catch (e) {}

    // Log sanitized provider values for fail return (no PAN/CVV or full card details)
    try {
      console.log('[BKT fail return] provider values', {
        oid: req.body?.oid || req.query?.oid || null,
        ProcReturnCode: req.body?.ProcReturnCode || req.query?.ProcReturnCode || null,
        Response: req.body?.Response || req.query?.Response || null,
        ErrMsg: req.body?.ErrMsg || req.query?.ErrMsg || null,
        ErrorCode: req.body?.ErrorCode || req.query?.ErrorCode || null,
        mdStatus: req.body?.mdStatus || req.query?.mdStatus || null,
        traceId: req.body?.traceId || req.query?.traceId || null,
        TranType: req.body?.TranType || req.query?.TranType || null,
        amount: req.body?.amount || req.query?.amount || null,
        currency: req.body?.currency || req.query?.currency || null,
        clientid: req.body?.clientid || req.query?.clientid || null
      })
    } catch (e) {}

    const oid = payload.oid || payload.OID || payload.OrderId || payload.orderId || null
    if (oid) {
      const booking = await Booking.findOne({ bookingNumber: oid }).populate('room')
      if (booking) {
        let payment = await Payment.findOne({ booking: booking._id }).sort({ createdAt: -1 })
        if (!payment) {
          payment = await Payment.create({ booking: booking._id, provider: 'BKT', amount: booking.pricing.totalAmount, currency: booking.pricing.currency || 'EUR', status: 'pending' })
        }
        // Mark as failed/cancelled conservatively
        payment.status = 'failed'
        booking.paymentStatus = 'failed'
        booking.status = 'failed'
        payment.rawResponse = payload
        await payment.save()
        await booking.save()
      }
    }

  const frontFail = process.env.FRONT_FAIL || (process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/payment/fail` : '/payment/fail')
  const frontFailHash = process.env.FRONT_FAIL || process.env.FRONT_FAIL_HASH || (process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/payment/fail` : '/payment/fail')
  console.log('[bktFailHandler] redirecting customer to FRONT_FAIL=%s (envPresent=%s)', String(frontFailHash), Boolean(process.env.FRONT_FAIL || process.env.FRONT_FAIL_HASH || process.env.FRONTEND_URL))
  return res.redirect(String(frontFailHash))
  } catch (err) {
    console.error('[bktFailHandler] error:', err && err.message ? err.message : err)
    const frontFail = process.env.FRONT_FAIL || (process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/payment/fail` : '/payment/fail')
  const frontFailHash = process.env.FRONT_FAIL || process.env.FRONT_FAIL_HASH || (process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/payment/fail` : '/payment/fail')
  return res.redirect(String(frontFailHash))
  }
}

module.exports = {
  createBktPayment,
  handleBktCallback,
  bktOkHandler,
  bktFailHandler
}

