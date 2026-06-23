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
  return {
    mode: (process.env.NLB_BANKART_MODE || '').toLowerCase(),
    apiKey: process.env.NLB_BANKART_API_KEY || '',
    sharedSecret: process.env.NLB_BANKART_SHARED_SECRET || '',
    publicIntegrationKey: process.env.NLB_BANKART_PUBLIC_INTEGRATION_KEY || '',
  apiUsername: process.env.NLB_BANKART_API_USERNAME || '',
  apiPassword: process.env.NLB_BANKART_API_PASSWORD || '',
    postUrl: process.env.NLB_BANKART_POST_URL || '',
    callbackUrl: process.env.NLB_BANKART_CALLBACK_URL || '',
    successUrl: process.env.NLB_BANKART_SUCCESS_URL || '',
    failUrl: process.env.NLB_BANKART_FAIL_URL || '',
    cancelUrl: process.env.NLB_BANKART_CANCEL_URL || '',
    // Safety: explicit confirmation required to enable live flows. Must be set
    // to 'true' in environment to enable production usage.
    confirmed: String(process.env.NLB_BANKART_CONFIRMED_IMPLEMENTATION || '').toLowerCase() === 'true'
  }
}

function validateConfig (cfg) {
  // If running in live mode, require all production vars AND explicit confirmation
  if (cfg.mode === 'live') {
    for (const key of REQUIRED_PROD_VARS) {
      if (!process.env[key] || String(process.env[key]).trim() === '') {
        throw new Error(`NLB/Bankart live mode requires ${key} to be set in environment`)
      }
    }
    if (!cfg.confirmed) {
      throw new Error('NLB/Bankart live mode requires NLB_BANKART_CONFIRMED_IMPLEMENTATION=true for safety')
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
