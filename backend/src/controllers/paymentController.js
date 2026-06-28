const Booking = require('../models/Booking')
const Payment = require('../models/Payment')
const bankartService = require('../services/bankartService')

// Boot marker: helps verify deployed instances are running this commit
try {
  console.log('[BOOT] BKT provider-values logging version active')
} catch (e) {}

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
  // Minimal, non-blocking pre-response handling: parse payload and respond OK immediately
  try {
    const payload = req.body || {}

    // sanitized summary (avoid sensitive fields)
    const sanitized = {
      merchantTransactionId: payload.merchantTransactionId || payload.merchantOrderId || payload.orderId || payload.merchantOrder || null,
      uuid: payload.uuid || null,
      purchaseId: payload.purchaseId || null,
      result: payload.result || payload.status || null,
      code: payload.code || null,
      message: payload.message || null,
      transactionType: payload.transactionType || null,
      amount: payload.amount || null,
      currency: payload.currency || null,
    }

    console.log('[Bankart Callback] received safe summary', {
      provider: 'bankart',
      transactionType: sanitized.transactionType,
      result: sanitized.result,
      code: sanitized.code,
      message: sanitized.message,
      uuid: sanitized.uuid,
      purchaseId: sanitized.purchaseId,
      merchantTransactionId: sanitized.merchantTransactionId,
      amount: sanitized.amount,
      currency: sanitized.currency,
    })

    // Boot marker for verification in Render logs
    try { console.log('[BOOT] Bankart callback immediate-OK refund-safe version active') } catch (e) {}

    // Immediately respond OK so provider does not retry or time out
    res.set('Content-Type', 'text/plain')
    res.status(200).send('OK')
    try { console.log('[Bankart Callback] responded 200 OK immediately') } catch (e) {}

    // Process everything asynchronously. Any errors here must not affect the response.
    setImmediate(async () => {
      try {
        // perform signature verification inside async handler
        const rawBody = req.rawBody || null
        const requestPath = req.originalUrl || req.url || req.path || '/'
        const method = req.method || 'POST'
        let verification = null
        try {
          verification = bankartService.verifyBankartCallback(req.headers || {}, payload, rawBody, requestPath, method)
        } catch (e) {
          console.error('[Bankart Callback][async] signature verification threw error', e && e.message ? e.message : e)
        }

        const verified = !!(verification && verification.valid)
        console.log('[Bankart Callback][async] signature verification result', { verifiedSignature: verified, reason: verification && verification.reason ? String(verification.reason).slice(0,200) : undefined })

        if (!verified) {
          console.error('[Bankart Callback][async] invalid signature; aborting processing')
          return
        }

        // Map provider status to normalized internal status
        const providerResult = (payload.result || payload.status || '').toString()
        const normalized = bankartService.mapBankartStatus(providerResult)

        // Normalize and validate merchantTransactionId for lookups
        const rawMerchantTransactionId = payload.merchantTransactionId || payload.merchantOrderId || payload.orderId || payload.merchantOrder || null
        const isRefund = (payload.transactionType && String(payload.transactionType).toUpperCase() === 'REFUND')

        let lookupPaymentId = rawMerchantTransactionId
        if (isRefund && typeof lookupPaymentId === 'string') {
          lookupPaymentId = lookupPaymentId.replace(/^refund\d*-/, '')
        }

        console.log('[Bankart Callback][async] normalized merchantTransactionId', { transactionType: payload.transactionType, rawMerchantTransactionId, lookupPaymentId })

        const mongoose = require('mongoose')
        if (!lookupPaymentId || !mongoose.Types.ObjectId.isValid(lookupPaymentId)) {
          console.error('[Bankart Callback][async] invalid normalized payment id', { rawMerchantTransactionId, lookupPaymentId })
          return
        }

        // Load payment safely
        let payment = null
        try {
          payment = await Payment.findById(lookupPaymentId)
        } catch (e) {
          console.error('[Bankart Callback][async] error finding payment by id', { lookupPaymentId, err: e && e.message ? e.message : e })
          return
        }

        if (!payment) {
          console.log('[Bankart Callback][async] payment not found for id', lookupPaymentId)
          return
        }

        // Persist provider fields for audit (safe, idempotent)
        try {
          payment.providerTransactionId = payment.providerTransactionId || payload.uuid || payment.providerTransactionId
          payment.providerUuid = payment.providerUuid || payload.uuid || payment.providerUuid
          payment.providerResult = providerResult || payment.providerResult
          payment.providerCode = payload.code || payment.providerCode
          payment.providerMessage = payload.message || payment.providerMessage
          payment.callbackReceivedAt = payment.callbackReceivedAt || new Date()
          payment.verifiedSignature = true
          payment.rawResponse = payment.rawResponse || payload

          if (isRefund) {
            // Idempotent refund handling
            const incomingRefundTxId = payload.uuid || null
            // If this refund was already recorded, ignore
            if (incomingRefundTxId && payment.refundTransactionId && payment.refundTransactionId === incomingRefundTxId && payment.status === 'refunded') {
              console.log('[Bankart Callback] duplicate refund callback ignored safely', { paymentId: String(payment._id), refundTransactionId: incomingRefundTxId })
            } else {
              if (providerResult && ['OK', 'SUCCESS', 'APPROVED'].includes(providerResult.toUpperCase())) {
                payment.status = 'refunded'
                payment.refundStatus = 'refunded'
                payment.refundedAt = new Date()
                payment.refundAmount = payload.amount || payment.refundAmount
                payment.refundTransactionId = incomingRefundTxId || payment.refundTransactionId
                payment.refundMerchantTransactionId = rawMerchantTransactionId || payment.refundMerchantTransactionId
                payment.refundProviderResult = providerResult || payment.refundProviderResult
              } else {
                payment.refundStatus = 'failed'
                payment.refundProviderResult = providerResult || payment.refundProviderResult
              }
            }
          } else {
            // DEBIT flows: map to paid/failed/pending etc.
            payment.status = normalized || payment.status
          }

          payment.updatedAt = new Date()
          await payment.save()
        } catch (e) {
          console.error('[Bankart Callback][async] error saving payment', e && e.message ? e.message : e)
        }

        // Update booking paymentStatus if linked (do NOT change booking.status)
        if (payment.booking) {
          try {
            const booking = await Booking.findById(payment.booking)
            if (booking) {
              if (isRefund) {
                booking.paymentStatus = 'refunded'
              } else {
                booking.paymentStatus = normalized || booking.paymentStatus
              }
              await booking.save()

              if (isRefund) {
                console.log('[Bankart Callback] refund persistence complete', {
                  paymentId: String(payment._id),
                  bookingId: String(booking._id),
                  paymentStatus: payment.status,
                  bookingPaymentStatus: booking.paymentStatus,
                  refundTransactionId: payment.refundTransactionId
                })
              }
            }
          } catch (e) {
            console.error('[Bankart Callback][async] error updating booking status', e && e.message ? e.message : e)
          }
        }

        // Final mapping log
        try {
          console.log('[Bankart Callback] final mapping', {
            provider: 'bankart',
            transactionType: payload.transactionType,
            providerResult,
            mappedStatus: payment.status,
            paymentId: String(payment._id),
            bookingId: payment.booking ? String(payment.booking) : null,
            merchantTransactionId: rawMerchantTransactionId,
            verifiedSignature: !!payment.verifiedSignature
          })
        } catch (e) {}

        // Run invoice generation and email notifications asynchronously but errors must be caught
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
                  } catch (e) { console.error('[Bankart Callback][async] invoice service error:', e && e.message ? e.message : e) }

                  try { const ok = await require('../services/emailService').sendBookingPaidCustomerEmail(booking); if (!ok) console.log('[Bankart Callback][async] customer paid email not sent') } catch (e) { console.error('[Bankart Callback][async] Email send error (customer paid):', e && e.message ? e.message : e) }
                  try { const ok2 = await require('../services/emailService').sendBookingPaidAdminEmail(booking, payment); if (!ok2) console.log('[Bankart Callback][async] admin paid email not sent') } catch (e) { console.error('[Bankart Callback][async] Admin paid email failed', e && e.message ? e.message : e) }
                }
              } catch (e) {
                console.error('[Bankart Callback][async] error during invoice/email flow:', e && e.message ? e.message : e)
              }
            }
          } catch (e) {
            console.error('[Bankart Callback][async] unexpected error in post-processing:', e && e.message ? e.message : e)
          }
        })

      } catch (err) {
        console.error('[Bankart Callback][async] unexpected processing error', err && err.message ? err.message : err)
      }
    })

    return
  } catch (error) {
    // Should never reach here; ensure not to change response
    console.error('[Bankart Callback] pre-response unexpected error', error && error.message ? error.message : error)
    try { if (!res.headersSent) { res.set('Content-Type', 'text/plain'); res.status(200).send('OK') } } catch (e) {}
    return
  }
}

module.exports.bankartCallback = bankartCallback

/**
 * Legacy BKT handlers (safe logging helpers)
 * Some deployments may wire BKT redirects to this controller file. Add exact
 * sanitized logs here so provider decline values are always captured.
 */
const bktFailHandlerLegacy = async (req, res) => {
  try {
    // Mirror existing safe logging format
    try {
      console.log('[BKT fail return] received', {
        method: req.method,
        origin: req.headers && req.headers.origin,
        referer: req.headers && req.headers.referer,
        queryKeys: Object.keys(req.query || {}),
        bodyKeys: Object.keys(req.body || {})
      })
    } catch (e) {}

    // Exact requested sanitized log for provider values
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

    // If this legacy handler is wired, preserve existing redirect behavior
    const frontFailHash = process.env.FRONT_FAIL || process.env.FRONT_FAIL_HASH || (process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/payment/fail` : '/payment/fail')
    return res.redirect(String(frontFailHash))
  } catch (err) {
    console.error('[bktFailHandlerLegacy] error:', err && err.message ? err.message : err)
    const frontFailHash = process.env.FRONT_FAIL || process.env.FRONT_FAIL_HASH || (process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/payment/fail` : '/payment/fail')
    return res.redirect(String(frontFailHash))
  }
}

const bktCallbackLegacy = async (req, res) => {
  try {
    try {
      console.log('[BKT callback] received', { method: req.method, bodyKeys: Object.keys(req.body || {}) })
    } catch (e) {}

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

    // Respond 200 quickly; real processing may be async elsewhere in the app
    res.set('Content-Type', 'text/plain')
    return res.status(200).send('OK')
  } catch (e) {
    console.error('[bktCallbackLegacy] error:', e && e.message ? e.message : e)
    res.set('Content-Type', 'text/plain')
    return res.status(200).send('OK')
  }
}

module.exports.bktFailHandlerLegacy = bktFailHandlerLegacy
module.exports.bktCallbackLegacy = bktCallbackLegacy

