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
    // Use NLB/Bankart-specific environment variables for Bankart hosted payments
    // Do not fall back to BKT or frontend callback URLs here.
    const urls = {
      successUrl: process.env.NLB_BANKART_SUCCESS_URL || null,
      failUrl: process.env.NLB_BANKART_FAIL_URL || null,
      cancelUrl: process.env.NLB_BANKART_CANCEL_URL || null,
      callbackUrl: process.env.NLB_BANKART_CALLBACK_URL || null
    }

    // Fail fast if required Bankart callback is not configured
    if (!urls.callbackUrl) {
      console.error('[createBankartPayment] NLB_BANKART_CALLBACK_URL is not configured. Aborting Bankart create.')
      return res.status(500).json({ message: 'Bankart callback URL not configured (NLB_BANKART_CALLBACK_URL required)' })
    }

    // Ensure front-end defaults exist for developer convenience but we prefer explicit NLB envs
    urls.successUrl = urls.successUrl || `${process.env.FRONTEND_URL}/payment/success`
    urls.failUrl = urls.failUrl || `${process.env.FRONTEND_URL}/payment/fail`
    urls.cancelUrl = urls.cancelUrl || `${process.env.FRONTEND_URL}/payment/cancel`

    // Create session with guard: service may return { error } if not configured
    // Diagnostic logs (safe): mode and presence of critical envs
    try {
      console.log('[createBankartPayment] NLB_BANKART_MODE=', process.env.NLB_BANKART_MODE || '(unset)')
      console.log('[createBankartPayment] NLB_BANKART_CONFIRMED_IMPLEMENTATION=', String(process.env.NLB_BANKART_CONFIRMED_IMPLEMENTATION || 'false'))
      console.log('[createBankartPayment] NLB_BANKART_API_KEY exists=', !!process.env.NLB_BANKART_API_KEY)
      console.log('[createBankartPayment] NLB_BANKART_SHARED_SECRET exists=', !!process.env.NLB_BANKART_SHARED_SECRET)
      console.log('[createBankartPayment] NLB_BANKART_API_USERNAME exists=', !!process.env.NLB_BANKART_API_USERNAME)
      console.log('[createBankartPayment] NLB_BANKART_API_PASSWORD exists=', !!process.env.NLB_BANKART_API_PASSWORD)
      console.log('[createBankartPayment] NLB_BANKART_POST_URL=', process.env.NLB_BANKART_POST_URL || config && config.postUrl || '(unset)')
      // compute endpoint safely if possible
      if (bankartService && bankartService.createBankartPaymentSession && bankartService.createBankartPaymentSession.computeEndpointForApiKey) {
        const ep = bankartService.createBankartPaymentSession.computeEndpointForApiKey(process.env.NLB_BANKART_API_KEY || '')
        console.log('[createBankartPayment] computed endpoint=', ep && ep.endpoint)
      }
    } catch (e) {}

    const session = await bankartService.createBankartPaymentSession({ booking, payment, urls })

    // Safe status/logging for Render: presence of envs (do not log values)
    try {
      console.log('[createBankartPayment] NLB_BANKART_MODE=', process.env.NLB_BANKART_MODE || '(unset)')
      console.log('[createBankartPayment] NLB_BANKART_API_KEY exists=', !!(process.env.NLB_BANKART_API_KEY || process.env.NLB_BANKART_API_KEY === '') ? !!process.env.NLB_BANKART_API_KEY : false)
      console.log('[createBankartPayment] NLB_BANKART_SHARED_SECRET exists=', !!process.env.NLB_BANKART_SHARED_SECRET)
      console.log('[createBankartPayment] NLB_BANKART_API_USERNAME exists=', !!process.env.NLB_BANKART_API_USERNAME)
      console.log('[createBankartPayment] NLB_BANKART_API_PASSWORD exists=', !!process.env.NLB_BANKART_API_PASSWORD)
      // compute final endpoint safely (uses service helper indirectly)
      const ep = bankartService && bankartService.buildSignatureV3 ? null : null
    } catch (e) {}

    if (session && session.error) {
      const err = session.error
      // session.error may be structured from service
      const status = (err && err.httpStatus) || (err && err.status) || null
      const providerMessage = (err && err.providerMessage) || (err && err.message) || null
      const missingEnv = (err && err.missingEnv) || null

  // Log safe info for Render
      console.log('[createBankartPayment] merchantTransactionId=%s bookingId=%s paymentId=%s', String(payment._id), String(booking._id), String(payment._id))
      if (status) console.log('[createBankartPayment] bankart httpStatus=', status)
      if (providerMessage) console.log('[createBankartPayment] bankart providerMessage=', String(providerMessage).slice(0,200))
      if (missingEnv) console.log('[createBankartPayment] missingEnv=', missingEnv)
  if (err && err.code) console.log('[createBankartPayment] serviceErrorCode=', err.code)

      // Build a safe client response
      const clientError = { code: err.code || 'bankart_unavailable' }
      if (status) clientError.httpStatus = status
      if (providerMessage) clientError.providerMessage = providerMessage
      if (missingEnv) clientError.missingEnv = missingEnv

      return res.status(status || 503).json({ message: 'Bankart provider not available', error: clientError })
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

    // Generate and send invoice (idempotent). Don't block callback on invoice failures.
    try {
      if (payment.status === 'paid' && payment.booking) {
        const booking = await Booking.findById(payment.booking)
        if (booking) {
          const invoiceService = require('../services/invoiceService')
          try {
            const inv = await invoiceService.generateAndSendInvoice(booking, payment)
            if (!inv || !inv.ok) console.log('[Bankart Callback] invoice generation/send result:', inv)
          } catch (e) { console.log('[Bankart Callback] invoice service error:', e && e.message ? e.message : e) }
        }
      }
    } catch (e) {
      console.log('[Bankart Callback] invoice handling unexpected error:', e && e.message ? e.message : e)
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

