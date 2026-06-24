const { buildSignatureV3, verifyBankartCallback } = require('../src/services/bankartService')
const crypto = require('crypto')

// Quick unit test for signature helper
function makeTest() {
  const secret = process.env.NLB_BANKART_SHARED_SECRET || 'test-shared-secret'
  const apiKey = '210844IP021844'
  const encodedApiKey = encodeURIComponent(apiKey)
  const endpointPath = `/api/v3/transaction/${encodedApiKey}/debit`
  const payload = {
    merchantTransactionId: 'test-123',
    amount: '9.99',
    currency: 'EUR',
    successUrl: 'https://example.com/success',
    cancelUrl: 'https://example.com/cancel',
    errorUrl: 'https://example.com/error',
    callbackUrl: 'https://example.com/callback',
    description: 'Test payment',
    customer: { firstName: 'John', lastName: 'Doe', email: 'john@example.com', ipAddress: '127.0.0.1' },
    language: 'en'
  }
  const bodyString = JSON.stringify(payload)
  const date = new Date().toUTCString()
  const contentType = 'application/json; charset=utf-8'

  // locally compute signature using same algorithm as service
  const expectedSig = buildSignatureV3({ method: 'POST', bodyString, contentType, date, requestUri: endpointPath })
  console.log('Generated signature:', expectedSig)

  // Assertions for canonical values
  if (endpointPath !== '/api/v3/transaction/210844IP021844/debit') {
    console.error('Endpoint path canonicalization failed:', endpointPath)
    process.exit(2)
  }
  if (contentType !== 'application/json; charset=utf-8') {
    console.error('Content-Type canonicalization failed:', contentType)
    process.exit(2)
  }

  // Signature should be base64 (contains only base64 chars and ends with '=' or without padding)
  if (!/^[A-Za-z0-9+\/]+=*$/.test(expectedSig)) {
    console.error('Signature is not base64:', expectedSig)
    process.exit(2)
  }

  // Now mimic a callback verification: compose headers and raw body
  const headers = { 'content-type': contentType, date }
  // For the callback, Bankart would send X-Signature header. We simulate it by using expectedSig
  headers['x-signature'] = expectedSig
  const verification = verifyBankartCallback(headers, payload, bodyString, endpointPath, 'POST')
  console.log('Verification result:', verification)
  if (!verification.valid) process.exit(2)
  console.log('Signature helper unit test passed')
}

makeTest()
