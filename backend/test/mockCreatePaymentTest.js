// Mocked create-payment test (non-live)
// - Sets env vars to simulate a 'live' flow but uses a mocked axios.post
// - Reloads bankart modules after setting env so config validation runs with our test values
// - Verifies that createBankartPaymentSession returns a redirectUrl when the gateway returns returnType: 'REDIRECT'

process.env.NLB_BANKART_MODE = 'test'
process.env.NLB_BANKART_API_KEY = '210844|P021844-SIM'
process.env.NLB_BANKART_SHARED_SECRET = process.env.NLB_BANKART_SHARED_SECRET || 'test-shared-secret'
process.env.NLB_BANKART_PUBLIC_INTEGRATION_KEY = 'public-key-placeholder'
process.env.NLB_BANKART_POST_URL = process.env.NLB_BANKART_POST_URL || 'https://gateway.bankart.si'
process.env.NLB_BANKART_CALLBACK_URL = process.env.NLB_BANKART_CALLBACK_URL || 'https://example.com/callback'
process.env.NLB_BANKART_SUCCESS_URL = process.env.NLB_BANKART_SUCCESS_URL || 'https://example.com/success'
process.env.NLB_BANKART_FAIL_URL = process.env.NLB_BANKART_FAIL_URL || 'https://example.com/fail'
process.env.NLB_BANKART_CONFIRMED_IMPLEMENTATION = 'true'

// Clear cached modules to force re-read of config with our env values
delete require.cache[require.resolve('../src/config/bankartConfig')]
delete require.cache[require.resolve('../src/services/bankartService')]

const bankartService = require('../src/services/bankartService')
const axios = require('axios')

// Monkeypatch axios.post to simulate Bankart returning REDIRECT
const originalPost = axios.post
axios.post = async (endpoint, data, opts) => {
  console.log('[mockCreatePaymentTest] Mock axios.post called with endpoint:', endpoint)
  const bodyStringSent = typeof data === 'string' ? data : JSON.stringify(data)
  console.log('[mockCreatePaymentTest] Mock bodyString (sent):', bodyStringSent.slice(0, 200))

  // Assert endpoint is exactly the expected non-duplicated endpoint
  const expectedEndpoint = 'https://gateway.bankart.si/api/v3/transaction/210844%7CP021844-SIM/debit'
  if (String(endpoint) !== expectedEndpoint) {
    console.error('[mockCreatePaymentTest] Endpoint mismatch. Expected:', expectedEndpoint, 'Got:', endpoint)
    process.exit(2)
  }

  // We expect the data passed to axios to be the bodyString (string), not an object
  if (typeof data !== 'string') {
    console.error('[mockCreatePaymentTest] Expected axios to receive a string body (bodyString), got object')
    process.exit(2)
  }

  // we could verify JSON.parse(bodyStringSent) equals payload shape, but keep minimal
  return { data: { returnType: 'REDIRECT', redirectUrl: 'https://bankart.mock/redirect/abc123' } }
}

async function run() {
  // Minimal fake booking and payment
  const booking = {
    _id: 'booking-test-1',
    customer: { email: 'john@example.com', address: '', city: '', postcode: '', country: '' },
    ipAddress: '127.0.0.1',
    pricing: { totalAmount: 9.99 }
  }
  const payment = { _id: 'payment-test-1', amount: 9.99, currency: 'EUR' }

  try {
    const urls = {
      successUrl: process.env.NLB_BANKART_SUCCESS_URL,
      failUrl: process.env.NLB_BANKART_FAIL_URL,
      callbackUrl: process.env.NLB_BANKART_CALLBACK_URL
    }

    const result = await bankartService.createBankartPaymentSession({ booking, payment, urls })
    console.log('[mockCreatePaymentTest] createBankartPaymentSession result:', result)

    if (result && result.session && result.session.redirectUrl) {
      console.log('[mockCreatePaymentTest] SUCCESS: redirectUrl present ->', result.session.redirectUrl)
      process.exit(0)
    }

    console.error('[mockCreatePaymentTest] FAILED: redirectUrl not returned')
    process.exit(2)
  } catch (err) {
    console.error('[mockCreatePaymentTest] error:', err)
    process.exit(3)
  } finally {
    // restore
    axios.post = originalPost
  }
}

run()
