function calculatePrice({ pricePerNight, nights, meals, extras }) {
  const roomTotal = pricePerNight * nights

  let mealsTotal = 0
  const mealPricePerNight = 50
  if (meals.breakfast) mealsTotal += mealPricePerNight * nights
  if (meals.lunch) mealsTotal += mealPricePerNight * nights
  if (meals.dinner) mealsTotal += mealPricePerNight * nights

  let airportTransportTotal = 0
  if (extras.airportTransportTwoWay) airportTransportTotal = 100

  let rentCarTotal = 0
  if (extras.rentCarGolf7) rentCarTotal = 70 * nights

  const total = roomTotal + mealsTotal + airportTransportTotal + rentCarTotal

  return {
    roomTotal,
    mealsTotal,
    airportTransportTotal,
    rentCarTotal,
    total,
    currency: 'EUR'
  }
}

module.exports = calculatePrice
