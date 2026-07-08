require('dotenv').config()
const connectDB = require('../src/config/db')
const Booking = require('../src/models/Booking')
const Payment = require('../src/models/Payment')

async function run() {
  const dry = process.argv.includes('--dry-run')
  await connectDB()
  console.log('[cleanupTmp] connected to DB')

  const tmpBookings = await Booking.find({ bookingNumber: { $regex: '^TMP-' } })
  if (!tmpBookings || tmpBookings.length === 0) {
    console.log('[cleanupTmp] no TMP- bookings found')
    process.exit(0)
  }

  const bookingIds = tmpBookings.map(b => b._id)

  // Load Room model here to safely resolve names when possible
  let Room = null
  try {
    Room = require('../src/models/Room')
  } catch (e) {
    // If Room cannot be required due to model registration issues, we'll skip name resolution
    Room = null
  }

  // Find payments related to those bookings
  const payments = await Payment.find({ booking: { $in: bookingIds } })

  // Print what will be deleted
  console.log('[cleanupTmp] Found the following temporary bookings and related payments:')
  for (const b of tmpBookings) {
    const related = payments.filter(p => String(p.booking) === String(b._id))
    // attempt to resolve room name if Room model available
    let roomName = b.room || null
    try {
      if (Room && b.room) {
        const r = await Room.findById(b.room)
        if (r) roomName = r.name
      }
    } catch (e) {
      roomName = b.room
    }

    if (related.length === 0) {
      console.log(`- Booking: ${b._id} | ${b.bookingNumber} | room: ${roomName || '(unknown)'} | payments: NONE`)
    } else {
      for (const p of related) {
        console.log(`- Booking: ${b._id} | ${b.bookingNumber} | payment: ${p._id} | room: ${roomName || '(unknown)'} | amount: ${p.amount}`)
      }
    }
  }

  console.log('[cleanupTmp] summary:', { bookingsFound: tmpBookings.length, paymentsFound: payments.length })

  if (dry) {
    console.log('[cleanupTmp] dry-run mode: no deletions performed')
    process.exit(0)
  }

  // Proceed to delete payments first, then bookings
  try {
    if (payments.length > 0) {
      const delPay = await Payment.deleteMany({ booking: { $in: bookingIds } })
      console.log('[cleanupTmp] deleted payments count:', delPay.deletedCount || delPay.n || 0)
    } else {
      console.log('[cleanupTmp] no payments to delete')
    }

    const delBk = await Booking.deleteMany({ _id: { $in: bookingIds } })
    console.log('[cleanupTmp] deleted bookings count:', delBk.deletedCount || delBk.n || 0)

    console.log('[cleanupTmp] cleanup completed')
    process.exit(0)
  } catch (e) {
    console.error('[cleanupTmp] error during deletion', e && e.message ? e.message : e)
    process.exit(1)
  }
}

run().catch(e => { console.error('[cleanupTmp] runner error', e && e.message ? e.message : e); process.exit(1) })
