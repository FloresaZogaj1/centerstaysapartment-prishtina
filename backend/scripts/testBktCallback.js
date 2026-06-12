// LOCAL TEST ONLY - DO NOT RUN IN PRODUCTION
// This script is a local helper for testing BKT/NestPay callbacks.
// It reads secrets from backend/.env and posts simulated callbacks to the
// local backend. Do NOT commit real credentials or run this against
// production endpoints.
const axios = require('axios')
require('dotenv').config({ path: './.env' })
const nestpay = require('../src/services/nestpayService')

async function postCallback(payload) {
  try {
    const resp = await axios.post('http://127.0.0.1:5000/api/payments/bkt/callback', payload, { headers: { 'Content-Type': 'application/json' } })
    console.log('STATUS:', resp.status, 'DATA:', resp.data)
  } catch (err) {
    if (err.response) {
      console.log('STATUS:', err.response.status, 'DATA:', err.response.data)
    } else {
      console.log('ERROR:', err.message)
    }
  }
}

async function runTests(){
  // Basic payload template matching what create3DPayHostingFields might send
  const base = {
    clientid: process.env.BKT_CLIENT_ID,
    amount: '850.00',
    oid: 'TEST-ORDER-12345',
    okUrl: process.env.BKT_SUCCESS_URL,
    failUrl: process.env.BKT_FAIL_URL,
    callbackUrl: process.env.BKT_CALLBACK_URL,
    TranType: process.env.BKT_TRAN_TYPE,
    storetype: process.env.BKT_STORE_TYPE,
    currency: process.env.BKT_CURRENCY,
    rnd: String(Date.now()),
    hashAlgorithm: 'ver3',
    encoding: 'UTF-8'
  }

  console.log('1) Missing hash -> expect 400')
  await postCallback({ ...base })

  console.log('\n2) Invalid hash -> expect 400')
  const bad = { ...base, HASH: 'invalidhash' }
  await postCallback(bad)

  console.log('\n3) Valid hash, Approved -> expect paid')
  const payload3 = { ...base }
  // Simulate bank response fields
  payload3.Response = 'Approved'
  // Compute correct hash
  const valid3 = { ...payload3 }
  const h3 = nestpay.generateHashV3(valid3, process.env.BKT_STORE_KEY)
  valid3.HASH = h3
  await postCallback(valid3)

  console.log('\n4) Valid hash, failure response -> expect failed')
  const payload4 = { ...base }
  payload4.Response = 'Declined'
  const valid4 = { ...payload4 }
  const h4 = nestpay.generateHashV3(valid4, process.env.BKT_STORE_KEY)
  valid4.HASH = h4
  await postCallback(valid4)
}

runTests().catch(console.error)
