const asyncHandler = require('express-async-handler')
const Booking = require('../models/Booking')
const PaymentLog = require('../models/PaymentLog')

// POST /api/payments/bkt/create
exports.createBkt = asyncHandler(async (req, res) => {
  // TODO: integrate with BKT VPOS
  const { bookingId } = req.body
  if (!bookingId) return res.status(400).json({ message: 'bookingId required' })
  const booking = await Booking.findById(bookingId)
  if (!booking) return res.status(404).json({ message: 'Booking not found' })
  if (booking.status !== 'pending') return res.status(400).json({ message: 'Booking not pending' })

  // prepare placeholder payment
  const fakeOrderId = `BKT-${Date.now()}`
  const paymentUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payments/bkt/redirect?orderId=${fakeOrderId}&bookingId=${booking._id}`

  const log = await PaymentLog.create({ booking: booking._id, provider: 'bkt', orderId: fakeOrderId, amount: booking.pricing.total, currency: booking.pricing.currency, status: 'created', rawRequest: req.body })

  res.json({ paymentUrl, orderId: fakeOrderId })
})

// POST /api/payments/bkt/callback
exports.callbackBkt = asyncHandler(async (req, res) => {
  // TODO: validate signature
  const { orderId, bookingId, status } = req.body
  const log = await PaymentLog.findOne({ orderId })
  if (!log) return res.status(404).json({ message: 'Log not found' })

  log.rawResponse = req.body
  log.status = status === 'OK' ? 'success' : 'failed'
  await log.save()

  const booking = await Booking.findById(bookingId)
  if (!booking) return res.status(404).json({ message: 'Booking not found' })

  if (status === 'OK') {
    booking.status = 'paid'
    booking.paymentStatus = 'paid'
    booking.paymentReference = orderId
    await booking.save()
    // TODO: send payment success emails
  } else {
    booking.status = 'failed'
    booking.paymentStatus = 'failed'
    await booking.save()
  }

  res.json({ ok: true })
})

// GET /api/payments/bkt/success
exports.success = asyncHandler(async (req, res) => {
  // BKT will redirect user here after success
  // Example query: ?orderId=...&bookingId=...
  res.json({ ok: true, message: 'Payment success (placeholder). Fetch booking by id to confirm.' })
})

// GET /api/payments/bkt/fail
exports.fail = asyncHandler(async (req, res) => {
  res.json({ ok: false, message: 'Payment failed (placeholder).' })
})
