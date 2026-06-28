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

    // Boot marker to detect deployed instances specifically for create-payment
    try { console.log('[BOOT] BKT create-payment form debug active') } catch (e) {}

    // Sanitize critical envs before building the form
    const cleanEnv = (v) => String(v || '').replace(/[\r\n\t]/g, '').trim()
    const gatewayUrl = cleanEnv(process.env.BKT_3D_POST_URL || process.env.BKT_GATEWAY_URL)
    const okUrl = cleanEnv(process.env.BKT_OK_URL || process.env.BKT_SUCCESS_URL)
    const failUrl = cleanEnv(process.env.BKT_FAIL_URL || process.env.BKT_CANCEL_URL)
    const cancelUrl = cleanEnv(process.env.BKT_CANCEL_URL || process.env.BKT_FAIL_URL)
    const callbackUrl = cleanEnv(process.env.BKT_CALLBACK_URL)
    const clientId = cleanEnv(process.env.BKT_CLIENT_ID)
    const storeKey = cleanEnv(process.env.BKT_STORE_KEY)
    const storeType = cleanEnv(process.env.BKT_STORE_TYPE)

    // Validate gateway URL and absence of CR/LF in URLs
    if (!gatewayUrl || !gatewayUrl.startsWith('https://')) throw new Error('[BKT] Invalid gateway URL')
    if (/[\r\n]/.test(gatewayUrl + okUrl + failUrl + cancelUrl + callbackUrl)) throw new Error('[BKT] BKT env URLs contain newline characters')

    // Build the form using the nestpay service but ensure it uses cleaned values
    // The nestpay service already uses process.env; temporarily override values for safety
    process.env.BKT_3D_POST_URL = gatewayUrl
    process.env.BKT_OK_URL = okUrl
    process.env.BKT_FAIL_URL = failUrl
    process.env.BKT_CANCEL_URL = cancelUrl
    process.env.BKT_CALLBACK_URL = callbackUrl
    process.env.BKT_CLIENT_ID = clientId
    process.env.BKT_STORE_KEY = storeKey
    process.env.BKT_STORE_TYPE = storeType

    const form = nestpay.create3DPayHostingFields({ booking, payment })

    // Ensure returned action and fields are cleaned as well
    const formAction = String(form && form.action ? String(form.action) : gatewayUrl)
    const htmlForm = { action: formAction, method: 'POST', fields: form.fields }

    // Persist provider order id / oid to payment for later lookup in callbacks
    try {
      const fields = htmlForm.fields || {}
      const orderId = String(fields.oid || fields.OID || fields.OrderId || fields.orderId || '')
      if (orderId) {
        payment.providerOrderId = orderId
        payment.orderId = orderId
        payment.provider = 'BKT'
        payment.providerStatus = 'pending'
        await payment.save()
      }
    } catch (e) {
      console.error('[createBktPayment] failed to persist orderId on payment', e && e.message ? e.message : e)
    }

    // Safe create response log for frontend handling
    try {
      const fields = htmlForm.fields || {}
      const orderId = String(fields.oid || fields.OID || fields.OrderId || fields.orderId || '(unset)')
      const amt = String(fields.amount || payment.amount || (booking && booking.pricing && booking.pricing.totalAmount) || '(unset)')
      console.log('[createBktPayment] response to frontend', {
        hasRedirectUrl: !!htmlForm.action,
        redirectUrlHost: htmlForm.action ? (() => { try { return new URL(htmlForm.action).host } catch (e) { return null } })() : null,
        hasHtmlForm: !!htmlForm,
        gatewayUrl: JSON.stringify(gatewayUrl),
        formAction: JSON.stringify(formAction),
        paymentId: String(payment._id),
        bookingId: String(booking._id),
        orderId,
        amount: amt
      })
    } catch (e) {}

  return res.json({ message: 'BKT NestPay payment form created.', form: htmlForm })
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

    // Safe tolerant dump: log any unexpected keys/values (truncated) while skipping sensitive keys
    try {
      const safeDump = {}
      const sensitivePattern = /pan|card|cvv|cv2|hash|storekey|store|auth|password/i
      Object.keys(payload || {}).forEach(k => {
        if (sensitivePattern.test(k)) return
        const v = payload[k]
        if (v === undefined || v === null) return
        let s = typeof v === 'string' ? v : JSON.stringify(v)
        if (s.length > 300) s = s.slice(0, 300) + '...'
        safeDump[k] = s
      })
      if (Object.keys(safeDump).length > 0) console.log('[BKT callback] safeDump', safeDump)
    } catch (e) {}

    // Exact requested sanitized log for provider values (no PAN/CVV/hash/auth headers)
    try {
      console.log('[BKT callback] provider values', {
        oid: req.body?.oid,
        ProcReturnCode: req.body?.ProcReturnCode,
        Response: req.body?.Response,
        ErrMsg: req.body?.ErrMsg,
        ErrorCode: req.body?.ErrorCode,
        mdStatus: req.body?.mdStatus,
        traceId: req.body?.traceId,
        TranType: req.body?.TranType,
        amount: req.body?.amount,
        currency: req.body?.currency,
        clientid: req.body?.clientid
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

              try {
                const notificationService = require('../services/notificationService')
                await notificationService.handlePaymentResultNotification({ paymentId: String(payment._id), bookingId: String(booking._id), status: 'paid' })
              } catch (e) { console.log('[BKT callback][async] notificationService error (paid):', e && e.message ? e.message : e) }
            } else {
              try {
                const notificationService = require('../services/notificationService')
                await notificationService.handlePaymentResultNotification({ paymentId: String(payment._id), bookingId: String(booking._id), status: 'failed' })
              } catch (e) { console.log('[BKT callback][async] notificationService error (failed):', e && e.message ? e.message : e) }
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
          // Non-blocking notification for paid payment (idempotent)
          setImmediate(async () => {
            try {
              const notificationService = require('../services/notificationService')
              console.log('[Payment Notification] started', { provider: 'bkt', status: 'paid', bookingId: String(booking._id), paymentId: String(payment._id), amount: payment.amount })
              const resn = await notificationService.handlePaymentResultNotification({ bookingId: String(booking._id), paymentId: String(payment._id), provider: 'bkt', status: 'paid', amount: payment.amount })
              console.log('[Payment Notification] completed', { bookingId: String(booking._id), paymentId: String(payment._id), result: resn && resn.ok })
            } catch (e) {
              console.error('[Payment Notification] error', e && e.message ? e.message : e)
            }
          })
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

    // Exact requested sanitized log for fail return provider values
    try {
      console.log('[BKT fail return] provider values', {
        oid: req.body?.oid,
        ProcReturnCode: req.body?.ProcReturnCode,
        Response: req.body?.Response,
        ErrMsg: req.body?.ErrMsg,
        ErrorCode: req.body?.ErrorCode,
        mdStatus: req.body?.mdStatus,
        traceId: req.body?.traceId,
        TranType: req.body?.TranType,
        amount: req.body?.amount,
        currency: req.body?.currency,
        clientid: req.body?.clientid
      })
    } catch (e) {}

    // Safe tolerant dump for fail handler as well
    try {
      const body = req.method === 'GET' ? req.query : req.body
      const safeDump = {}
      const sensitivePattern = /pan|card|cvv|cv2|hash|storekey|store|auth|password/i
      Object.keys(body || {}).forEach(k => {
        if (sensitivePattern.test(k)) return
        const v = body[k]
        if (v === undefined || v === null) return
        let s = typeof v === 'string' ? v : JSON.stringify(v)
        if (s.length > 300) s = s.slice(0, 300) + '...'
        safeDump[k] = s
      })
      if (Object.keys(safeDump).length > 0) console.log('[BKT fail return] safeDump', safeDump)
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
      // First try to find payment by stored order identifiers
      let payment = await Payment.findOne({
        $or: [
          { providerOrderId: String(oid) },
          { orderId: String(oid) },
          { merchantTransactionId: String(oid) }
        ]
      })

      // Fallback: find booking by bookingNumber then latest payment for that booking
      let booking = null
      if (!payment) {
        booking = await Booking.findOne({ bookingNumber: oid }).populate('room')
        if (booking) {
          payment = await Payment.findOne({ booking: booking._id }).sort({ createdAt: -1 })
        }
      } else {
        // populate booking if payment found
        if (payment.booking) booking = await Booking.findById(payment.booking).populate('room')
      }

      if (!payment) {
        console.error('[BKT fail return] payment not found for oid', { oid })
      } else {
        try {
          // Update provider-related fields conservatively
          payment.provider = payment.provider || 'BKT'
          payment.providerResult = payload?.Response || payload?.response || payment.providerResult
          payment.providerCode = payload?.ErrorCode || payload?.ProcReturnCode || payment.providerCode
          payment.providerMessage = payload?.mdErrorMsg || payload?.ErrMsg || payload?.Response || payment.providerMessage
          payment.providerTransactionId = payload?.traceId || payload?.trace_id || payment.providerTransactionId
          payment.rawResponse = payload

          // Mark as failed (do not mark booking as paid)
          payment.status = 'failed'
          payment.lastNotificationStatus = 'failed'
          payment.lastNotificationReason = payment.providerMessage

          await payment.save()

          if (booking) {
            booking.paymentStatus = 'failed'
            try { await booking.save() } catch (e) { console.error('[BKT fail return] failed to save booking.paymentStatus', e && e.message ? e.message : e) }
          } else {
            console.error('[BKT fail return] booking not found for payment', { paymentId: String(payment._id), oid })
          }

          // Trigger non-blocking notification for failed/declined payment (idempotent)
          setImmediate(async () => {
            try {
              const notificationService = require('../services/notificationService')
              const reason = payload?.mdErrorMsg || payload?.ErrMsg || payload?.Response || 'Payment declined'
              console.log('[Payment Notification] started', { provider: 'bkt', status: 'failed', orderId: oid, bookingId: booking?._id ? String(booking._id) : null, paymentId: String(payment._id), amount: payload?.amount, reason })

              const resn = await notificationService.handlePaymentResultNotification({
                provider: 'bkt',
                status: 'failed',
                bookingId: booking?._id ? String(booking._id) : null,
                paymentId: String(payment._id),
                orderId: oid,
                amount: payload?.amount,
                reason,
                providerCode: payload?.ErrorCode || payload?.ProcReturnCode,
                providerMessage: payload?.mdErrorMsg || payload?.ErrMsg || payload?.Response,
                transactionId: payload?.traceId || payload?.trace_id || null,
                rawPayload: payload
              })

              if (resn && resn.ok) {
                if (resn.actions) {
                  // if notificationService marked sentAt fields, log accordingly
                  console.log('[Payment Notification] completed', { bookingId: booking?._id ? String(booking._id) : null, paymentId: String(payment._id), actions: resn.actions })
                } else {
                  console.log('[Payment Notification] completed', { bookingId: booking?._id ? String(booking._id) : null, paymentId: String(payment._id), result: resn })
                }
              } else {
                console.log('[Payment Notification] completed with errors', { bookingId: booking?._id ? String(booking._id) : null, paymentId: String(payment._id), result: resn })
              }
            } catch (e) {
              console.error('[Payment Notification] error', e && e.message ? e.message : e)
            }
          })
        } catch (e) {
          console.error('[BKT fail return] error updating payment/booking', e && e.message ? e.message : e)
        }
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

