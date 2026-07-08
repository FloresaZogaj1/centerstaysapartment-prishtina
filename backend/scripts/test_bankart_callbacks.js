const paymentController = require('../src/controllers/paymentController')
const bankartService = require('../src/services/bankartService')
const Payment = require('../src/models/Payment')
const Booking = require('../src/models/Booking')

// Helper to create fake req/res
function makeReqRes(payload) {
  const raw = JSON.stringify(payload)
  const req = {
    body: payload,
    headers: { 'content-type': 'application/json; charset=utf-8', date: new Date().toUTCString(), 'x-signature': 'test-sig' },
    rawBody: raw,
    method: 'POST',
    originalUrl: '/api/payments/bankart/callback'
  }
  const res = {
    _status: null,
    _body: null,
    headersSent: false,
    set: function() {},
    status: function (s) { this._status = s; return this },
    send: function (b) { this._body = b; this.headersSent = true; console.log('[TEST RES] status=%s body=%s', this._status, String(b)); }
  }
  return { req, res }
}

async function run() {
  console.log('Starting Bankart callback tests (simulated)')

  // Stub signature verification to always pass during tests
  const origVerify = bankartService.verifyBankartCallback
  bankartService.verifyBankartCallback = () => ({ valid: true })

  // Stub Payment.findById and Booking.findById to avoid DB
  const origPaymentFind = Payment.findById
  const origBookingFind = Booking.findById

  // Create sample payment objects to return
  const samplePayment = (overrides = {}) => {
    const p = {
      _id: overrides._id || '60c000000000000000000001',
      booking: overrides.booking || '60c000000000000000000010',
      status: overrides.status || 'pending',
      providerTransactionId: overrides.providerTransactionId || null,
      providerUuid: overrides.providerUuid || null,
      providerResult: overrides.providerResult || null,
      refundTransactionId: overrides.refundTransactionId || null,
      refundMerchantTransactionId: overrides.refundMerchantTransactionId || null,
      refundStatus: overrides.refundStatus || null,
      save: async function() { console.log('[TEST] Payment.save called for', this._id); return this }
    }
    return p
  }

  const sampleBooking = (overrides = {}) => {
    const b = {
      _id: overrides._id || '60c000000000000000000010',
      paymentStatus: overrides.paymentStatus || 'unpaid',
      save: async function() { console.log('[TEST] Booking.save called for', this._id); return this }
    }
    return b
  }

  // Test cases
  const tests = [
    {
      name: 'DEBIT OK',
      payload: { merchantTransactionId: '60c000000000000000000001', uuid: 'tx-1', result: 'OK', transactionType: 'DEBIT', amount: 120 },
      paymentObj: samplePayment({_id: '60c000000000000000000001', status: 'pending'}),
      bookingObj: sampleBooking()
    },
    {
      name: 'DEBIT ERROR',
      payload: { merchantTransactionId: '60c000000000000000000002', uuid: 'tx-2', result: 'ERROR', transactionType: 'DEBIT', amount: 120 },
      paymentObj: samplePayment({_id: '60c000000000000000000002', status: 'pending'}),
      bookingObj: sampleBooking()
    },
    {
      name: 'REFUND OK with prefix',
      payload: { merchantTransactionId: 'refund1-60c000000000000000000003', uuid: 'rtx-1', result: 'OK', transactionType: 'REFUND', amount: 50 },
      paymentObj: samplePayment({_id: '60c000000000000000000003', status: 'paid'}),
      bookingObj: sampleBooking()
    },
    {
      name: 'Duplicate REFUND',
      payload: { merchantTransactionId: 'refund1-60c000000000000000000004', uuid: 'rtx-dup', result: 'OK', transactionType: 'REFUND', amount: 30 },
      paymentObj: (function(){ const p = samplePayment({_id: '60c000000000000000000004', status: 'refunded'}); p.refundTransactionId = 'rtx-dup'; p.refundStatus = 'refunded'; return p})(),
      bookingObj: sampleBooking({paymentStatus: 'refunded'})
    },
    {
      name: 'Invalid refund merchantTransactionId',
      payload: { merchantTransactionId: 'refund1-notanobjectid', uuid: 'rtx-invalid', result: 'OK', transactionType: 'REFUND', amount: 30 },
      paymentObj: null,
      bookingObj: null
    }
  ]

  for (const t of tests) {
    console.log('\n=== TEST:', t.name, '===')

    // stub Payment.findById to return test payment when matched
    Payment.findById = async (id) => {
      console.log('[TEST] Payment.findById called with', id)
      if (!t.paymentObj) return null
      if (String(id) === String(t.paymentObj._id)) return t.paymentObj
      return null
    }
    Booking.findById = async (id) => {
      console.log('[TEST] Booking.findById called with', id)
      if (!t.bookingObj) return null
      if (String(id) === String(t.bookingObj._id)) return t.bookingObj
      return null
    }

    const { req, res } = makeReqRes(t.payload)
    try {
      await paymentController.bankartCallback(req, res)
    } catch (e) {
      console.error('[TEST] bankartCallback threw', e)
    }

    // allow async setImmediate tasks to run
    await new Promise(r => setTimeout(r, 600))
  }

  // restore
  bankartService.verifyBankartCallback = origVerify
  Payment.findById = origPaymentFind
  Booking.findById = origBookingFind

  console.log('\nBankart callback simulation tests complete')
}

run().catch(e => { console.error('Test runner error', e) })
