"use strict"

// Exact environment variable names required by the project. Do NOT change
// these names; Render must be configured with these exact keys.
const REQUIRED_PROD_VARS = [
  'NLB_BANKART_API_KEY',
  'NLB_BANKART_SHARED_SECRET',
  'NLB_BANKART_PUBLIC_INTEGRATION_KEY',
  'NLB_BANKART_POST_URL',
  'NLB_BANKART_CALLBACK_URL',
  'NLB_BANKART_SUCCESS_URL',
  'NLB_BANKART_FAIL_URL'
]

function loadConfig() {
  // Trim environment inputs to avoid trailing newlines or whitespace
  const trim = v => (typeof v === 'string' ? v.trim() : v)
  return {
    mode: trim(process.env.NLB_BANKART_MODE || '').toLowerCase(),
    apiKey: trim(process.env.NLB_BANKART_API_KEY || ''),
    sharedSecret: trim(process.env.NLB_BANKART_SHARED_SECRET || ''),
    publicIntegrationKey: trim(process.env.NLB_BANKART_PUBLIC_INTEGRATION_KEY || ''),
    apiUsername: trim(process.env.NLB_BANKART_API_USERNAME || ''),
    apiPassword: trim(process.env.NLB_BANKART_API_PASSWORD || ''),
    postUrl: trim(process.env.NLB_BANKART_POST_URL || ''),
    callbackUrl: trim(process.env.NLB_BANKART_CALLBACK_URL || ''),
    successUrl: trim(process.env.NLB_BANKART_SUCCESS_URL || ''),
    failUrl: trim(process.env.NLB_BANKART_FAIL_URL || ''),
    cancelUrl: trim(process.env.NLB_BANKART_CANCEL_URL || ''),
    // Safety: explicit confirmation required to enable live flows. Must be set
    // to 'true' in environment to enable production usage.
    confirmed: String(process.env.NLB_BANKART_CONFIRMED_IMPLEMENTATION || '').toLowerCase() === 'true'
  }
}

function validateConfig (cfg) {
  // If running in live mode, require all production vars AND explicit confirmation
  if (cfg.mode === 'live') {
    for (const key of REQUIRED_PROD_VARS) {
      const v = process.env[key]
      if (!v || String(v).trim() === '') {
        throw new Error(`NLB/Bankart live mode requires ${key} to be set in environment`)
      }
    }
    if (!cfg.confirmed) {
      throw new Error('NLB/Bankart live mode requires NLB_BANKART_CONFIRMED_IMPLEMENTATION=true for safety')
    }
  }

  // Validate trimmed URL sanity in all modes (fail fast if obviously invalid)
  const urlFields = ['postUrl', 'callbackUrl', 'successUrl', 'failUrl', 'cancelUrl']
  for (const f of urlFields) {
    const v = cfg[f]
    if (v && /\s/.test(String(v))) {
      throw new Error(`Bankart config: environment variable ${f} contains whitespace after trim — please correct ${f}`)
    }
  }
}

const config = loadConfig()
try {
  validateConfig(config)
} catch (err) {
  // Keep warning-level log — controller/service will respect config and
  // refuse to perform live operations unless explicitly enabled.
  console.warn('[bankartConfig] configuration validation:', err.message)
}

module.exports = config

/*
  TODO: Bankart / NLB Integration notes

  - The following environment variables are required (placeholders in .env.example):
      NLB_BANKART_MODE
      NLB_BANKART_API_KEY
      NLB_BANKART_SHARED_SECRET
      NLB_BANKART_PUBLIC_INTEGRATION_KEY
      NLB_BANKART_POST_URL
      NLB_BANKART_CALLBACK_URL
      NLB_BANKART_SUCCESS_URL
      NLB_BANKART_FAIL_URL
      NLB_BANKART_CONFIRMED_IMPLEMENTATION

  - Before enabling live mode, confirm the following from Bankart docs:
      * which endpoint to call for the selected flow
      * whether the integration requires frontend tokenization (payment.js)
      * whether the backend should perform a server-side POST to /api/v2/transaction
      * exact signature and header conventions

  - The server will refuse to enable live Bankart flows unless
    `NLB_BANKART_CONFIRMED_IMPLEMENTATION=true` and all required vars exist.
*/
