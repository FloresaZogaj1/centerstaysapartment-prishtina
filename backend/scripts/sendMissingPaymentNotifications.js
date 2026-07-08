#!/usr/bin/env node
// Usage: node sendMissingPaymentNotifications.js
// Finds payments missing notification sentAt timestamps and re-runs notificationService

const connectDB = require('../src/config/db')
const Payment = require('../src/models/Payment')
const Booking = require('../src/models/Booking')

async function run() {
  await connectDB()
  console.log('[repair] scanning payments for missing notification timestamps')

  const candidates = await Payment.find({
    $or: [
      { status: 'paid', paidCustomerEmailSentAt: { $exists: false } },
      { status: 'paid', paidAdminEmailSentAt: { $exists: false } },
      { status: 'failed', failedCustomerEmailSentAt: { $exists: false } },
      { status: 'failed', failedAdminEmailSentAt: { $exists: false } }
    ]
  }).limit(200)

  console.log('[repair] found', candidates.length, 'payments')

  const notificationService = require('../src/services/notificationService')

  for (const p of candidates) {
    try {
      const booking = p.booking ? await Booking.findById(p.booking).populate('room') : null
      const status = p.status || (p.refundStatus === 'refunded' ? 'refunded' : 'failed')
      console.log('[repair] processing', { paymentId: String(p._id), bookingId: p.booking, status })
      const r = await notificationService.handlePaymentResultNotification({ paymentId: String(p._id), bookingId: String(p.booking), status })
      console.log('[repair] result', r)
    } catch (e) {
      console.error('[repair] error processing payment', p._id, e && e.message ? e.message : e)
    }
  }

  console.log('[repair] done')
  process.exit(0)
}

run().catch(e => { console.error('repair runner error', e); process.exit(1) })
