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

    // Require all NLB Bankart URLs explicitly. Do not fall back to legacy or frontend routes.
    const missing = []
    if (!urls.successUrl) missing.push('NLB_BANKART_SUCCESS_URL')
    if (!urls.failUrl) missing.push('NLB_BANKART_FAIL_URL')
    if (!urls.cancelUrl) missing.push('NLB_BANKART_CANCEL_URL')
    if (!urls.callbackUrl) missing.push('NLB_BANKART_CALLBACK_URL')
    if (missing.length > 0) {
      console.error('[createBankartPayment] Missing required Bankart envs:', missing.join(', '))
      return res.status(500).json({ message: 'Missing required Bankart environment variables', missing })
    }

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

  const result = await bankartService.createBankartPaymentSession({ booking, payment, urls })

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

    if (result && result.error) {
      const err = result.error
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

      return res.status(status || 503).json({ success: false, error: 'Bankart provider not available', errorDetails: clientError, paymentId: String(payment._id), bookingId: String(booking._id) })
    }

    // Normal path: result.session and result.rawResponse available
    const providerResponse = result.rawResponse || (result.session && result.session.raw) || {}
    const returnType = providerResponse.returnType || (providerResponse.type) || (providerResponse.result) || null
    const redirectUrl = (providerResponse && providerResponse.redirectUrl) || (result.session && result.session.redirectUrl) || null
    const hasRedirectUrl = Boolean(redirectUrl)

    // Safe host extraction
    let redirectHost = null
    try {
      if (redirectUrl) redirectHost = (new URL(redirectUrl)).host
    } catch (e) {
      redirectHost = null
    }

    // Add safe backend log with providerResponse summary
    try {
      console.log('[createBankartPayment] providerResponse summary:', {
        provider: 'nlb_bankart',
        returnType: String(returnType || '(unset)'),
        hasRedirectUrl: hasRedirectUrl,
        redirectHost: redirectHost,
        paymentId: String(payment._id),
        bookingId: String(booking._id)
      })
    } catch (e) {}

    if (hasRedirectUrl) {
      return res.json({
        success: true,
        provider: 'nlb_bankart',
        paymentId: String(payment._id),
        bookingId: String(booking._id),
        returnType: String(returnType || 'REDIRECT'),
        redirectUrl: redirectUrl
      })
    }

    // If no redirect URL provided by Bankart, return controlled error
    return res.status(502).json({
      success: false,
      error: 'Bankart did not return redirectUrl',
      providerResponse: { returnType: String(returnType || '(unset)'), hasRedirectUrl: false },
      paymentId: String(payment._id),
      bookingId: String(booking._id)
    })
  } catch (error) {
    console.error('[createBankartPayment] error:', error)
    return res.status(500).json({ message: error.message })
  }
}

module.exports = {
  createBankartPayment,
}

// Bankart callback/webhook handler - improved logging, verification, mapping and persistence
const bankartCallback = async (req, res) => {
  try {
    const payload = req.body || {}

    // Build a sanitized summary from payload for logs (do not include sensitive card data)
    const sanitized = {
      merchantTransactionId: payload.merchantTransactionId || payload.merchantOrderId || payload.orderId || payload.merchantOrder || null,
      uuid: payload.uuid || null,
      purchaseId: payload.purchaseId || null,
      result: payload.result || payload.status || null,
      code: payload.code || null,
      message: payload.message || null,
      adapterCode: payload.adapterCode || null,
      adapterMessage: payload.adapterMessage || null,
      transactionType: payload.transactionType || null,
      paymentMethod: payload.paymentMethod || null,
      amount: payload.amount || null,
      currency: payload.currency || null,
      hasReturnData: payload.returnData ? true : false,
      returnDataKeys: payload.returnData && typeof payload.returnData === 'object' ? Object.keys(payload.returnData) : []
    }

  console.log('[Bankart Callback] sanitized payload summary:', sanitized)

  // Production marker for deploy verification
  console.log('[Bankart Callback] REFUND NORMALIZATION VERSION ACTIVE')

    // Use rawBody captured by express.json verify option for exact signature verification
    const rawBody = req.rawBody || null
    const requestPath = req.originalUrl || req.url || req.path || '/'
    const method = req.method || 'POST'
    const verification = bankartService.verifyBankartCallback(req.headers || {}, payload, rawBody, requestPath, method)

    const verified = !!(verification && verification.valid)
    console.log('[Bankart Callback] signature verification:', { verifiedSignature: verified, reason: verification && verification.reason ? String(verification.reason).slice(0,200) : undefined })

    if (!verified) {
      // Do not process further if signature cannot be validated
      return res.status(400).send('Invalid signature')
    }


    // Map provider status to normalized internal status
    const providerResult = (payload.result || payload.status || '').toString()
    const normalized = bankartService.mapBankartStatus(providerResult)

    // Implement strict normalization & validation before any DB lookup
    const rawMerchantTransactionId = payload.merchantTransactionId || payload.merchantOrderId || payload.orderId || payload.merchantOrder || null
    const isRefund = (payload.transactionType && String(payload.transactionType).toUpperCase() === 'REFUND')

    let lookupPaymentId = rawMerchantTransactionId

    if (isRefund && typeof lookupPaymentId === 'string') {
      // strip refund prefix like refund1- or refund12-
      lookupPaymentId = lookupPaymentId.replace(/^refund\d*-/, '')
    }

    console.log('[Bankart Callback] normalized merchantTransactionId', {
      transactionType: payload.transactionType,
      rawMerchantTransactionId,
      lookupPaymentId
    })

    // Validate before querying
    const mongoose = require('mongoose')
    if (!mongoose.Types.ObjectId.isValid(lookupPaymentId)) {
      console.error('[Bankart Callback] invalid normalized payment id', {
        transactionType: payload.transactionType,
        rawMerchantTransactionId,
        lookupPaymentId
      })

      // Return 200 to avoid provider retries; nothing we can do with invalid id
      res.set('Content-Type', 'text/plain')
      return res.status(200).send('OK')
    }

    // Safe: only query using the validated, normalized id
    const payment = await Payment.findById(lookupPaymentId)
    if (!payment) {
      console.log('[Bankart Callback] payment not found for id:', String(lookupPaymentId).slice(0,200))
      // Return 200 so provider doesn't retry; we've logged the missing payment
      res.set('Content-Type', 'text/plain')
      return res.status(200).send('OK')
    }

  // Persist provider fields for audit
    try {
      // primary provider txn id
      payment.providerTransactionId = sanitized.uuid || payment.providerTransactionId
      payment.providerUuid = sanitized.uuid || payment.providerUuid
      payment.providerResult = providerResult || payment.providerResult
      payment.providerCode = sanitized.code || payment.providerCode
      payment.providerMessage = sanitized.message || payment.providerMessage
      payment.adapterCode = sanitized.adapterCode || payment.adapterCode
      payment.adapterMessage = sanitized.adapterMessage || payment.adapterMessage
      payment.callbackReceivedAt = new Date()
      payment.verifiedSignature = true
      payment.rawResponse = payload

      // Handle refunds specially
      if (isRefund) {
        // Map refund result
        if (providerResult && ['OK', 'SUCCESS', 'APPROVED'].includes(providerResult.toUpperCase())) {
          payment.status = 'refunded'
          payment.refundStatus = 'refunded'
          payment.refundedAt = new Date()
          payment.refundAmount = payload.amount || payment.refundAmount
          payment.refundTransactionId = payload.uuid || payment.refundTransactionId
          payment.refundMerchantTransactionId = sanitized.merchantTransactionId || payment.refundMerchantTransactionId
          payment.refundProviderResult = providerResult || payment.refundProviderResult
        } else {
          payment.refundStatus = 'failed'
          payment.refundProviderResult = providerResult || payment.refundProviderResult
        }
      } else {
        // Update status and timestamps for normal payments
        payment.status = normalized
      }

      payment.updatedAt = new Date()

      await payment.save()
    } catch (e) {
      console.log('[Bankart Callback] error saving provider info to payment:', e && e.message ? e.message : e)
    }

    // Update booking paymentStatus if linked (do NOT change booking.status to 'refunded')
    if (payment.booking) {
      try {
        const booking = await Booking.findById(payment.booking)
        if (booking) {
          if (isRefund) {
            booking.paymentStatus = 'refunded'
            // Do NOT set booking.status = 'refunded' unless business logic explicitly requires it
          } else {
            booking.paymentStatus = normalized
          }
          await booking.save()

          // Safe persistence log for refunds
          if (isRefund) {
            console.log('[Bankart Callback] refund persistence complete', {
              paymentId: String(payment._id),
              bookingId: String(booking._id),
              paymentStatus: payment.status,
              bookingPaymentStatus: booking.paymentStatus
            })
          }
        }
      } catch (e) {
        console.log('[Bankart Callback] error updating booking status:', e && e.message ? e.message : e)
      }
    }

    // Final mapping log for easy audit (before responding)
    try {
      console.log('[Bankart Callback] final mapping:', {
        provider: 'bankart',
        merchantTransactionId: sanitized.merchantTransactionId,
        paymentId: String(payment._id),
        bookingId: payment.booking ? String(payment.booking) : null,
        verifiedSignature: !!payment.verifiedSignature,
        mappedStatus: payment.status,
        providerResult: payment.providerResult,
        providerCode: payment.providerCode,
        providerMessage: payment.providerMessage,
        adapterCode: payment.adapterCode,
        adapterMessage: payment.adapterMessage
      })
    } catch (e) {}

    // Respond immediately so Bankart doesn't time out
    try {
      console.log('[Bankart Callback] responding 200 OK immediately', {
        merchantTransactionId: sanitized.merchantTransactionId,
        paymentId: String(payment._id),
        bookingId: payment.booking ? String(payment.booking) : null,
        mappedStatus: payment.status
      })
    } catch (e) {}

    res.set('Content-Type', 'text/plain')
    res.status(200).send('OK')

    // Run invoice generation and email notifications asynchronously so they don't block the callback
    setImmediate(async () => {
      try {
        if (payment.status === 'paid' && payment.booking) {
          try {
            const booking = await Booking.findById(payment.booking)
            if (booking) {
              const invoiceService = require('../services/invoiceService')
              try {
                const inv = await invoiceService.generateAndSendInvoice(booking, payment)
                if (!inv || !inv.ok) console.log('[Bankart Callback][async] invoice generation/send result:', inv)
              } catch (e) { console.log('[Bankart Callback][async] invoice service error:', e && e.message ? e.message : e) }

              try { const ok = await require('../services/emailService').sendBookingPaidCustomerEmail(booking); if (!ok) console.log('[Bankart Callback][async] customer paid email not sent') } catch (e) { console.log('[Bankart Callback][async] Email send error (customer paid):', e && e.message ? e.message : e) }
              try { const ok2 = await require('../services/emailService').sendBookingPaidAdminEmail(booking, payment); if (!ok2) console.log('[Bankart Callback][async] admin paid email not sent') } catch (e) { console.log('[Bankart Callback][async] Admin paid email failed', e && e.message ? e.message : e) }
            }
          } catch (e) {
            console.log('[Bankart Callback][async] error during invoice/email flow:', e && e.message ? e.message : e)
          }
        }
      } catch (e) {
        console.log('[Bankart Callback][async] unexpected error in post-processing:', e && e.message ? e.message : e)
      }
    })

    return
  } catch (error) {
    console.error('[Bankart Callback] error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

module.exports.bankartCallback = bankartCallback

