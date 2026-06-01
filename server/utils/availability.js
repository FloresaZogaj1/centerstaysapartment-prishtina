const Booking = require('../models/Booking')

async function isAvailable(roomTypeId, checkIn, checkOut) {
  // Count overlapping bookings with statuses that reserve units
  const overlapQuery = {
    roomType: roomTypeId,
    status: { $in: ['pending','confirmed','paid'] },
    checkIn: { $lt: new Date(checkOut) },
    checkOut: { $gt: new Date(checkIn) }
  }
  const overlapping = await Booking.find(overlapQuery)
  return overlapping
}

async function assignUnit(unitNumbers, roomTypeId, checkIn, checkOut) {
  const overlapping = await isAvailable(roomTypeId, checkIn, checkOut)
  const taken = overlapping.map(b => b.assignedUnitNumber).filter(Boolean)
  const available = unitNumbers.find(u => !taken.includes(u))
  return { availableUnit: available, taken }
}

module.exports = { isAvailable, assignUnit }
