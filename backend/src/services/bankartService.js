"use strict"

const crypto = require('crypto')
const axios = require('axios')
const config = require('../config/bankartConfig')

/*
 TODO: Bankart / NLB Integration - REQUIRED before enabling live flow

 - DO NOT treat the current canonicalization/signature logic as final.
 - The following items MUST be confirmed from the official Bankart docs
   (from the provider portal) before enabling production usage:
     * Exact API endpoint for your chosen integration flow
     * Exact request format and field names sent to the endpoint
     * Exact signature / HMAC canonicalization:
         - which fields are included
         - field order
         - separator rules
         - URL-encoding rules
         - hash algorithm and encoding (hex/base64)
         - signature header or body field name used by Bankart
     * Callback (webhook) verification format (header name, body format)
     * Status mapping (provider-specific status strings -> internal status)
     * Whether the flow requires client-side tokenization (payment.js),
       a hosted form POST, or a server-to-server transaction call

 - Until those items are provided and `NLB_BANKART_CONFIRMED_IMPLEMENTATION`
   is set to 'true' in the environment, the live flow will remain blocked.
 - This file currently contains placeholder canonicalization and signature
   behavior that MUST be replaced with the provider-specified implementation.
*/

/**
 * Helper: buildSignature
 * - Compute HMAC-SHA256 signature for a canonical string using shared secret.
 * - The canonicalization below is generic and may need adjustment to match
 *   Bankart's exact requirements. Update when you confirm the exact format.
 */
/**
 * Build Bankart signature per Transaction API v3 docs:
 * - message = METHOD + "\n" + SHA512(body) (hex lowercase) + "\n" + Content-Type + "\n" + Date + "\n" + Request URI
 * - HMAC-SHA512(secret, message) in binary, then Base64 encode result
 */
function buildSignatureV3 ({ method, bodyString, contentType, date, requestUri }) {
  const secret = config.sharedSecret || process.env.NLB_BANKART_SHARED_SECRET
  if (!secret) throw new Error('Bankart shared secret not configured')

  const bodyHash = crypto.createHash('sha512').update(bodyString || '').digest('hex')
  const message = [method.toUpperCase(), bodyHash, contentType, date, requestUri].join('\n')
  const hmac = crypto.createHmac('sha512', secret).update(message).digest()
  return hmac.toString('base64')
}

/**
 * createBankartPaymentSession
 * - Build a minimal payload the controller can return to the frontend.
 * - We return an object with either redirectUrl or form: { action, method, fields }
 * - The actual remote POST/redirect is commented out to avoid network calls in
 *   environments where Bankart credentials are not present.
 */
async function createBankartPaymentSession ({ booking, payment, urls = {} }) {
  // booking: Booking mongoose document
  // payment: Payment mongoose document

  const amount = Number(payment.amount || 0)
  const currency = payment.currency || 'EUR'
  const orderId = payment._id.toString()

  // Build a canonical payload object (adjust keys per Bankart docs)
  // Build payload according to Bankart v3 Debit transaction JSON
  const payload = {
    merchantTransactionId: orderId,
    amount: amount.toFixed(2),
    currency: currency,
    successUrl: urls.successUrl || process.env.NLB_BANKART_SUCCESS_URL || `${process.env.FRONTEND_URL}/payment/success`,
    cancelUrl: urls.failUrl || process.env.NLB_BANKART_FAIL_URL || `${process.env.FRONTEND_URL}/payment/fail`,
    errorUrl: urls.failUrl || process.env.NLB_BANKART_FAIL_URL || `${process.env.FRONTEND_URL}/payment/fail`,
    callbackUrl: urls.callbackUrl || process.env.NLB_BANKART_CALLBACK_URL || `${process.env.FRONTEND_URL}/api/payments/bankart/callback`,
    description: `Booking ${orderId}`,
    customer: {
      email: (booking.customer && booking.customer.email) || booking.email || '',
      billingAddress1: (booking.customer && booking.customer.address) || '',
      billingCity: (booking.customer && booking.customer.city) || '',
      billingPostcode: (booking.customer && booking.customer.postcode) || '',
      billingCountry: (booking.customer && booking.customer.country) || '',
      ipAddress: (booking.ipAddress) || '127.0.0.1'
    },
    language: 'en',
    payByLink: {
      sendByEmail: false,
      expirationInMinute: 120
    }
  }

  // Create JSON string for request body - must be stable (no extra spaces)
  const bodyString = JSON.stringify(payload)

  // Safety checks:
  // - If mode is 'live' and not explicitly confirmed, block the live flow.
  if (config.mode === 'live' && !config.confirmed) {
    return { session: null, error: { code: 'not_confirmed', message: 'Bankart live mode disabled: implementation not confirmed in server environment' } }
  }

  // For both 'test' and confirmed 'live' modes we perform a real server-side POST.
  // Ensure required env vars are present before attempting the network call.
  const apiKeyEnv = config.apiKey || process.env.NLB_BANKART_API_KEY
  const postUrlEnv = config.postUrl || process.env.NLB_BANKART_POST_URL
  const sharedSecretEnv = config.sharedSecret || process.env.NLB_BANKART_SHARED_SECRET
  if (!postUrlEnv || !apiKeyEnv || !sharedSecretEnv) {
    // Indicate which env is missing
    const missing = !postUrlEnv ? 'NLB_BANKART_POST_URL' : (!apiKeyEnv ? 'NLB_BANKART_API_KEY' : 'NLB_BANKART_SHARED_SECRET')
    return { session: null, error: { code: 'missing_env', message: 'Missing required Bankart environment variable', missingEnv: missing } }
  }

  // Perform server-side POST to Bankart v3 transaction debit endpoint
  const apiKey = config.apiKey || process.env.NLB_BANKART_API_KEY
  let endpointBase = config.postUrl || process.env.NLB_BANKART_POST_URL || ''
  // Normalize endpoint base so it does not duplicate the resource path.
  // We expect the service to append: /api/v3/transaction/{encodedApiKey}/debit
  // Accept either 'https://gateway.bankart.si' OR 'https://gateway.bankart.si/api/v3/transaction'
  // and normalize to base without trailing path segment.
  try {
    endpointBase = endpointBase.replace(/\/$/, '')
    // If someone set the full path including /api/v3/transaction, remove that suffix
    endpointBase = endpointBase.replace(/\/api\/v3\/transaction$/i, '')
  } catch (e) {
    // fallback: leave endpointBase as-is
  }
  // API key must be URL-encoded in the path (e.g., '|' -> '%7C')
  const encodedApiKey = encodeURIComponent(apiKey)
  const endpointPath = `/api/v3/transaction/${encodedApiKey}/debit`
  const endpoint = `${endpointBase}${endpointPath}`

  // Helper: expose computed endpoint for logging/diagnostics (safe value)
  function computeEndpointForApiKey (apiKeyParam) {
    let base = config.postUrl || process.env.NLB_BANKART_POST_URL || ''
    try {
      base = base.replace(/\/$/, '')
      base = base.replace(/\/api\/v3\/transaction$/i, '')
    } catch (e) {}
    const enc = encodeURIComponent(apiKeyParam || apiKey)
    const path = `/api/v3/transaction/${enc}/debit`
    return { endpointPath: path, endpoint: `${base}${path}` }
  }

  const contentType = 'application/json; charset=utf-8'
  const date = new Date().toUTCString()

  let signature
  try {
    signature = buildSignatureV3({ method: 'POST', bodyString, contentType, date, requestUri: endpointPath })
  } catch (err) {
    return { session: null, error: 'Bankart shared secret not configured on server' }
  }

  try {
    const authUsername = config.apiUsername || process.env.NLB_BANKART_API_USERNAME
    const authPassword = config.apiPassword || process.env.NLB_BANKART_API_PASSWORD

    const headers = {
      'Content-Type': contentType,
      'Accept': 'application/json',
      'Date': date,
      'X-Signature': signature,
    }

    // Send the exact JSON string used for signing to guarantee byte-for-byte equality
    const resp = await axios.post(endpoint, bodyString, {
      headers,
      auth: authUsername && authPassword ? { username: authUsername, password: authPassword } : undefined,
      timeout: 15000,
    })

    const data = resp && resp.data || {}
    if (data && data.returnType === 'REDIRECT' && data.redirectUrl) {
      return { session: { redirectUrl: data.redirectUrl }, rawResponse: data }
    }

    // If response contains form/html content or other returnTypes, pass them through
    return { session: { raw: data }, rawResponse: data }
  } catch (err) {
    // Sanitize error logging: only log safe details
    try {
      const safe = {}
      if (err && err.response) {
        safe.httpStatus = err.response.status
        // Provider may include structured error code/message in response data
        const data = err.response.data || {}
        if (data && typeof data === 'object') {
          safe.providerCode = data.code || data.error || data.errorCode || null
          safe.providerMessage = data.message || data.error_description || data.errorMessage || null
        }
      } else {
        safe.error = err && err.message ? String(err.message).slice(0, 200) : 'unknown'
      }
      // Include merchant/payment ids when available for correlation
      safe.merchantTransactionId = orderId
      safe.paymentId = payment && payment._id ? String(payment._id) : null
      safe.bookingId = booking && booking._id ? String(booking._id) : null
      console.error('[bankartService] create transaction error (sanitized):', JSON.stringify(safe))
    } catch (e) {
      console.error('[bankartService] create transaction error (sanitized): unknown error')
    }
    // Construct structured error for controller consumption
    if (err && err.response) {
      const data = err.response.data || {}
      return { session: null, error: { code: 'provider_error', httpStatus: err.response.status, providerCode: data.code || data.error || null, providerMessage: data.message || data.error_description || null, endpoint } }
    }
    return { session: null, error: { code: 'network_error', message: String(err && err.message || 'unknown'), endpoint } }
  }
}

/**
 * verifyBankartCallback
 * - Verify callback using signature from headers or body using shared secret.
 * - Accepts (reqHeaders, reqBody) to allow controllers to pass both.
 */
function verifyBankartCallback (reqHeaders = {}, reqBody = {}, rawBodyString = null, requestPath = '/', method = 'POST') {
  // Signature header precedence per Bankart docs: X-Signature
  const sigHeader = reqHeaders['x-signature'] || reqHeaders['x-bankart-signature'] || reqHeaders['signature'] || reqHeaders['x-hub-signature']

  if (!sigHeader) {
    return { valid: false, data: null, reason: 'no-signature-provided' }
  }

  // Date header must be present and close to current time (allow small skew)
  const dateHeader = reqHeaders['x-date'] || reqHeaders['date']
  if (!dateHeader) return { valid: false, data: null, reason: 'no-date-header' }

  // Verify date skew (allow 60 seconds)
  try {
    const parsed = Date.parse(dateHeader)
    if (isNaN(parsed)) return { valid: false, data: null, reason: 'invalid-date-header' }
    const now = Date.now()
    const delta = Math.abs(now - parsed)
    if (delta > 60 * 1000) return { valid: false, data: null, reason: 'date-skew-too-large' }
  } catch (e) {
    return { valid: false, data: null, reason: 'date-parse-failed' }
  }

  // Request URI should be the path component of the endpoint the gateway called.
  const requestUri = requestPath || (reqHeaders['x-original-uri'] || reqHeaders['x-forwarded-uri'] || reqHeaders['x-request-uri'] || reqHeaders['x-request-url'] || '')

  // For signature calculation we need the raw body string exactly as received.
  const bodyString = rawBodyString || (typeof reqBody === 'string' ? reqBody : JSON.stringify(reqBody || {}))

  // Compute body SHA512 hex
  let bodyHash
  try {
    bodyHash = crypto.createHash('sha512').update(bodyString || '').digest('hex')
  } catch (e) {
    return { valid: false, data: null, reason: 'body-hash-failed' }
  }

  // Choose content-type from headers (fallback to application/json; charset=utf-8)
  // Use the incoming header exactly if present so signature canonicalization matches the sender.
  const contentType = reqHeaders['content-type'] || reqHeaders['Content-Type'] || 'application/json; charset=utf-8'

  // Build message and signature
  let expectedSig
  try {
  const msg = [String(method || 'POST').toUpperCase(), bodyHash, contentType, dateHeader, requestUri || ''].join('\n')
  const secret = config.sharedSecret || process.env.NLB_BANKART_SHARED_SECRET
  if (!secret) throw new Error('no-shared-secret')
  expectedSig = crypto.createHmac('sha512', secret).update(msg).digest('base64')
  } catch (err) {
    return { valid: false, data: null, reason: 'no-shared-secret' }
  }

  // Timing-safe compare
  const expectedBuf = Buffer.from(String(expectedSig))
  const providedBuf = Buffer.from(String(sigHeader))
  const valid = expectedBuf.length === providedBuf.length && crypto.timingSafeEqual(expectedBuf, providedBuf)

  return { valid, data: reqBody, reason: valid ? null : 'signature-mismatch' }
}

/**
 * mapBankartStatus
 */
function mapBankartStatus (status) {
  const s = String(status || '').toLowerCase()
  if (s === 'success' || s === 'paid' || s === 'completed' || s === 'ok') return 'paid'
  if (s === 'pending' || s === 'in_progress') return 'pending'
  if (s.includes('cancel') || s.includes('cancelled')) return 'cancelled'
  if (s.includes('fail') || s.includes('failed') || s.includes('error')) return 'failed'
  return 'unknown'
}

module.exports = {
  createBankartPaymentSession,
  verifyBankartCallback,
  mapBankartStatus
}

// Export internal helper for unit testing of signature generation
module.exports.buildSignatureV3 = buildSignatureV3
