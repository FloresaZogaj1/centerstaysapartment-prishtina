/**
 * calculateBookingTotal
 * Inputs:
 *  - roomPrice (number)
 *  - checkInDate (Date|string)
 *  - checkOutDate (Date|string)
 *  - guests (number)
 *  - addons (object)
 *
 * Returns an object with nights, roomTotal, guestExtraTotal, mealsTotal,
 * transportTotal, rentCarTotal, totalAmount
 */

function calculateBookingTotal(roomPrice, checkInDate, checkOutDate, guests, addons = {}) {
  if (!roomPrice || typeof roomPrice !== 'number' || isNaN(roomPrice) || roomPrice < 0) {
    throw new Error('Invalid roomPrice')
  }

  const inDate = new Date(checkInDate)
  const outDate = new Date(checkOutDate)
  if (isNaN(inDate) || isNaN(outDate)) throw new Error('Invalid dates')
  if (outDate <= inDate) throw new Error('checkOutDate must be after checkInDate')

  if (!guests || typeof guests !== 'number' || guests < 1) {
    throw new Error('guests must be at least 1')
  }

  // normalize addons
  const a = {
    breakfast: !!addons.breakfast,
    lunch: !!addons.lunch,
    dinner: !!addons.dinner,
    airportTransport: !!addons.airportTransport,
    rentCarGolf7: !!addons.rentCarGolf7,
  }

  // calc nights
  const msPerDay = 24 * 60 * 60 * 1000
  const nights = Math.round((outDate - inDate) / msPerDay)
  if (nights <= 0) throw new Error('Invalid stay length')

  const roomTotal = roomPrice * nights

  // guest extra cost: per requirements it's guests * 50 (flat, not per-night)
  const guestExtraTotal = guests * 50

  // meals: each selected meal = guests * 50
  let mealsTotal = 0
  if (a.breakfast) mealsTotal += guests * 50
  if (a.lunch) mealsTotal += guests * 50
  if (a.dinner) mealsTotal += guests * 50

  const transportTotal = a.airportTransport ? 100 : 0

  const rentCarTotal = a.rentCarGolf7 ? nights * 70 : 0

  const totalAmount = roomTotal + guestExtraTotal + mealsTotal + transportTotal + rentCarTotal

  return {
    nights,
    roomTotal,
    guestExtraTotal,
    mealsTotal,
    transportTotal,
    rentCarTotal,
    totalAmount,
  }
}

module.exports = calculateBookingTotal
