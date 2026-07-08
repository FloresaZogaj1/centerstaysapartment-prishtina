require('dotenv').config()
const connectDB = require('../src/config/db')
const Room = require('../src/models/Room')
const Booking = require('../src/models/Booking')

async function run(){
  await connectDB()
  console.log('[tmp] connected')
  const room4 = await Room.findOne({ name: 'City Apartment 04' })
  const room5 = await Room.findOne({ name: 'City Apartment 05' })
  if(!room4 || !room5) { console.error('[tmp] missing rooms', !!room4, !!room5); process.exit(1) }

  const calc = require('../src/utils/calculateBookingTotal')
  const r4 = calc(room4.basePricePerNight, '2026-07-10', '2026-07-12', 2)
  const r5 = calc(room5.basePricePerNight, '2026-07-11', '2026-07-13', 2)

  // create or reuse booking1
  let b1 = await Booking.findOne({ bookingNumber: { $regex: '^TMP-' }, room: room4._id })
  if(!b1){
    b1 = await Booking.create({ bookingNumber: 'TMP-'+Date.now(), room: room4._id, firstName: 'Tmp', lastName: 'User', email: 'tmp1@example.com', phone: '+37710000001', checkInDate: new Date('2026-07-10'), checkOutDate: new Date('2026-07-12'), nights: r4.nights, guests:2, addons:{}, pricing:{ roomTotal:r4.roomTotal, guestExtraTotal:r4.guestExtraTotal, mealsTotal:r4.mealsTotal, transportTotal:r4.transportTotal, rentCarTotal:r4.rentCarTotal, totalAmount:r4.totalAmount, currency:'EUR' }, status:'pending_payment', paymentStatus:'unpaid' })
    console.log('[tmp] created booking1', b1._id)
  } else {
    console.log('[tmp] found booking1', b1._id)
  }

  let b2 = await Booking.findOne({ bookingNumber: { $regex: '^TMP-' }, room: room5._id })
  if(!b2){
    b2 = await Booking.create({ bookingNumber: 'TMP-'+(Date.now()+1), room: room5._id, firstName: 'Tmp2', lastName: 'User2', email: 'tmp2@example.com', phone: '+37710000002', checkInDate: new Date('2026-07-11'), checkOutDate: new Date('2026-07-13'), nights: r5.nights, guests:2, addons:{}, pricing:{ roomTotal:r5.roomTotal, guestExtraTotal:r5.guestExtraTotal, mealsTotal:r5.mealsTotal, transportTotal:r5.transportTotal, rentCarTotal:r5.rentCarTotal, totalAmount:r5.totalAmount, currency:'EUR' }, status:'pending_payment', paymentStatus:'unpaid' })
    console.log('[tmp] created booking2', b2._id)
  } else {
    console.log('[tmp] found booking2', b2._id)
  }

  // Temporary env overrides for createBktPayment validation only
  process.env.BKT_3D_POST_URL = 'https://pgw.example.com/3d'
  process.env.BKT_OK_URL = 'https://centerstays.example.com/api/payments/bkt/ok'
  process.env.BKT_FAIL_URL = 'https://centerstays.example.com/api/payments/bkt/fail'
  process.env.BKT_CANCEL_URL = 'https://centerstays.example.com/api/payments/bkt/fail'
  process.env.BKT_CALLBACK_URL = 'https://centerstays.example.com/api/payments/bkt/callback'

  const controller = require('../src/controllers/bktPaymentController')

  const mockRes = () => {
    const r = {}
    r.status = function(code){ this._code = code; return this }
    r.json = function(obj){ console.log('[tmp] res.json:', JSON.stringify(obj, null, 2)); return this }
    r.redirect = function(u){ console.log('[tmp] res.redirect:', u); return this }
    r.send = function(s){ console.log('[tmp] res.send:', s); return this }
    return r
  }

  console.log('[tmp] calling createBktPayment for booking1')
  await controller.createBktPayment({ body: { bookingId: String(b1._id) } }, mockRes())

  console.log('[tmp] calling createBktPayment for booking2')
  await controller.createBktPayment({ body: { bookingId: String(b2._id) } }, mockRes())

  console.log('[tmp] done')
  process.exit(0)
}

run().catch(e=>{ console.error('[tmp] error', e && e.message?e.message:e); process.exit(1) })
