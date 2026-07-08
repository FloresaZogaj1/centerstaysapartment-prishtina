require('dotenv').config()
const connectDB = require('../src/config/db')
const Room = require('../src/models/Room')
const Booking = require('../src/models/Booking')
const Payment = require('../src/models/Payment')

;(async()=>{
  await connectDB()
  const total = await Room.countDocuments()
  const tmpBookings = await Booking.countDocuments({ bookingNumber: { $regex: '^TMP-' } })
  // payments that reference removed bookings should be zero, but also check any payments whose rawResponse.oid starts with TMP-
  const tmpPaymentsByOid = await Payment.countDocuments({ 'rawResponse.oid': { $regex: '^TMP-' } })
  const paymentsTotal = await Payment.countDocuments()
  console.log('TOTAL_ROOMS', total)
  console.log('TMP_BOOKINGS', tmpBookings)
  console.log('TMP_PAYMENTS_BY_RAWRESPONSE_OID', tmpPaymentsByOid)
  console.log('PAYMENTS_TOTAL', paymentsTotal)
  process.exit(0)
})().catch(e=>{ console.error(e); process.exit(1) })
