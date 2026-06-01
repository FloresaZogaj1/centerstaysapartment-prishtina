function bookingEmailHtml(booking) {
  return `
    <h2>Rezervimi juaj - ${booking.guest.fullName}</h2>
    <p>Status: ${booking.status}</p>
    <ul>
      <li>Tipi: ${booking.roomTypeSnapshot.name}</li>
      <li>Njësia: ${booking.assignedUnitNumber || 'TBA'}</li>
      <li>Check-in: ${new Date(booking.checkIn).toLocaleDateString()}</li>
      <li>Check-out: ${new Date(booking.checkOut).toLocaleDateString()}</li>
      <li>Nata: ${booking.nights}</li>
      <li>Personat: ${booking.totalPersons} (Rritur: ${booking.adults}, Femijë: ${booking.children})</li>
      <li>Ushqimet: Breakfast ${booking.meals.breakfast}, Lunch ${booking.meals.lunch}, Dinner ${booking.meals.dinner}</li>
      <li>Transport aeroporti: ${booking.extras.airportTransportTwoWay}</li>
      <li>Rent a car: ${booking.extras.rentCarGolf7}</li>
      <li>Total: ${booking.pricing.total} ${booking.pricing.currency}</li>
    </ul>
  `
}

module.exports = { bookingEmailHtml }
