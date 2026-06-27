"use strict"
const crypto = require('crypto')

// Helper to clean environment values: remove CR/LF/TAB and trim
function cleanEnv (value) {
  return String(value || '').replace(/[\r\n\t]/g, '').trim()
}

// Required environment variables for BKT (fail fast if missing)
// Required envs: some have alternate names (OK/FAIL). We'll fail fast for truly required ones,
// but allow OK/FAIL alternatives for redirect endpoints.
const REQUIRED_VARS_MIN = [
  'BKT_CLIENT_ID',
  'BKT_STORE_KEY',
  'BKT_STORE_TYPE',
  'BKT_CURRENCY',
  'BKT_TRAN_TYPE',
  'BKT_3D_POST_URL',
  'BKT_API_USERNAME',
  'BKT_API_PASSWORD',
  'BKT_API_POST_URL',
  'BKT_CALLBACK_URL'
]

for (const v of REQUIRED_VARS_MIN) {
  if (!process.env[v]) {
    throw new Error(`Missing required BKT environment variable: ${v}`)
  }
}

// Ensure at least one form of redirect URL is present (ok or success, fail or fail)
if (!process.env.BKT_OK_URL && !process.env.BKT_SUCCESS_URL) throw new Error('Missing BKT_OK_URL or BKT_SUCCESS_URL')
if (!process.env.BKT_FAIL_URL && !process.env.BKT_CANCEL_URL) throw new Error('Missing BKT_FAIL_URL or BKT_CANCEL_URL')

/**
 * escapeHashValue - escapes pipe characters and trims value
 * Rule: The official instructions require values to be escaped (pipes) and
 * joined with |. We'll apply a conservative escaping: replace '|' with '\\|' and trim.
 */
function escapeHashValue (value) {
  if (value === undefined || value === null) return ''
  return String(value).trim().replace(/\|/g, '\\|')
}

/**
 * buildHashPlainText(params, storeKey)
 * - Exclude hash and HASH and encoding and storeKey from params
 * - Sort parameter names alphabetically A-Z
 * - Join escaped values with |
 * - Append storeKey at the end
 */
function buildHashPlainText (params, storeKey) {
  const filtered = {}
  for (const k of Object.keys(params)) {
    const lk = k.toLowerCase()
    if (lk === 'hash' || lk === 'encoding' || lk === 'storekey') continue
    filtered[k] = params[k]
  }

  const names = Object.keys(filtered).sort((a, b) => a.localeCompare(b))
  const escaped = names.map(n => escapeHashValue(filtered[n]))
  const joined = escaped.join('|')
  return joined + '|' + (storeKey || '')
}

/**
 * generateHashV3
 * - SHA512 then Base64
 */
function generateHashV3 (params, storeKey) {
  const plain = buildHashPlainText(params, storeKey)
  const hash = crypto.createHash('sha512').update(plain, 'utf8').digest('base64')
  return hash
}

/**
 * verifyHashV3
 */
function verifyHashV3 (params, receivedHash, storeKey) {
  try {
    const calc = generateHashV3(params, storeKey)
    return calc === receivedHash
  } catch (err) {
    return false
  }
}

/**
 * create3DPayHostingFields
 * Build the form fields for 3D_PAY_HOSTING post to BKT
 */
function create3DPayHostingFields ({ booking, payment }) {
  // booking: contains bookingNumber, pricing.totalAmount
  // payment: local payment record (id)
  // Amount should be a string with two decimals (e.g. "850.00")
  const rawAmount = (booking && booking.pricing && booking.pricing.totalAmount) || (payment && payment.amount) || 0
  const amount = Number(rawAmount).toFixed(2)

  const oid = booking && (booking.bookingNumber || booking._id) ? (booking.bookingNumber || booking._id) : `ORDER-${Date.now()}`

  // Build the parameters strictly from environment and inputs (no hardcoded/demo fallbacks)
  const params = {
    clientid: cleanEnv(process.env.BKT_CLIENT_ID),
    amount: String(amount),
    oid: String(oid),
    // Use explicit backend endpoints for BKT redirects so gateway returns to the server
    okUrl: cleanEnv(process.env.BKT_OK_URL || process.env.BKT_SUCCESS_URL),
    failUrl: cleanEnv(process.env.BKT_FAIL_URL || process.env.BKT_CANCEL_URL),
    // Some setups may support a cancel URL; fallback to failUrl if not set
    cancelUrl: cleanEnv(process.env.BKT_CANCEL_URL || process.env.BKT_FAIL_URL),
    callbackUrl: cleanEnv(process.env.BKT_CALLBACK_URL),
    TranType: cleanEnv(process.env.BKT_TRAN_TYPE),
    storetype: cleanEnv(process.env.BKT_STORE_TYPE),
    currency: cleanEnv(process.env.BKT_CURRENCY),
    rnd: String(Date.now()),
    hashAlgorithm: 'ver3',
    encoding: 'UTF-8'
  }

  // Validate redirect URLs - ensure they point to our backend endpoints
  const errors = []
  if (!params.okUrl) errors.push('BKT_OK_URL is not set')
  if (!params.failUrl) errors.push('BKT_FAIL_URL is not set')
  if (!params.callbackUrl) errors.push('BKT_CALLBACK_URL is not set')

  if (params.okUrl && !String(params.okUrl).includes('/api/payments/bkt/ok')) errors.push('BKT_OK_URL must include /api/payments/bkt/ok')
  if (params.failUrl && !String(params.failUrl).includes('/api/payments/bkt/fail')) errors.push('BKT_FAIL_URL must include /api/payments/bkt/fail')
  // cancelUrl should route to the same backend fail endpoint (safe default)
  if (params.cancelUrl && !String(params.cancelUrl).includes('/api/payments/bkt/fail')) errors.push('BKT_CANCEL_URL must include /api/payments/bkt/fail')
  if (params.callbackUrl && !String(params.callbackUrl).includes('/api/payments/bkt/callback')) errors.push('BKT_CALLBACK_URL must include /api/payments/bkt/callback')

  // Ensure there are no CR/LF characters lingering in URLs
  for (const [key, value] of Object.entries({ okUrl: params.okUrl, failUrl: params.failUrl, cancelUrl: params.cancelUrl, callbackUrl: params.callbackUrl })) {
    if (typeof value === 'string' && /[\r\n]/.test(value)) {
      errors.push(`${key} contains newline characters`)
    }
  }

  // Log sanitized BKT URLs so CR/LF (as JSON escaped) is visible if present
  try {
    console.log('[createBktPayment] sanitized BKT URLs', {
      okUrl: JSON.stringify(params.okUrl),
      failUrl: JSON.stringify(params.failUrl),
      cancelUrl: JSON.stringify(params.cancelUrl),
      callbackUrl: JSON.stringify(params.callbackUrl)
    })
  } catch (e) {}

  if (errors.length > 0) {
    const err = new Error('BKT redirect URL validation failed: ' + errors.join('; '))
    err.code = 'bkt_redirect_validation_failed'
    err.details = errors
    throw err
  }

  const storeKey = cleanEnv(process.env.BKT_STORE_KEY)
  const hash = generateHashV3(params, storeKey)

  // Do NOT include storeKey or any secret in the returned fields
  const returnedFields = Object.assign({}, params)
  returnedFields.hash = hash

  return {
    action: cleanEnv(process.env.BKT_3D_POST_URL),
    fields: returnedFields
  }
}

/**
 * mapNestpayStatus
 * Placeholder mapping from NestPay to internal statuses
 */
function mapNestpayStatus (payload) {
  // payload will vary; map commonly used status fields
  const status = (payload && (payload.status || payload.procedureResult || payload.Result)) || ''
  const s = String(status).toLowerCase()
  if (s.includes('success') || s.includes('approved') || s === '1') return 'paid'
  if (s.includes('pending')) return 'pending'
  if (s.includes('fail') || s.includes('denied') || s === '0') return 'failed'
  return 'unknown'
}

module.exports = {
  escapeHashValue,
  buildHashPlainText,
  generateHashV3,
  verifyHashV3,
  create3DPayHostingFields,
  mapNestpayStatus
}
