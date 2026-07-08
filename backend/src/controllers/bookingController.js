const Room = require('../models/Room')
const calculateBookingTotal = require('../utils/calculateBookingTotal')

const calculateBookingTotalController = async (req, res) => {
  try {
    const { roomId, checkInDate, checkOutDate, guests, addons = {} } = req.body

    if (!roomId) return res.status(400).json({ message: 'roomId is required' })

    const room = await Room.findById(roomId)
    if (!room || !room.isActive) return res.status(404).json({ message: 'Room not found' })

    const pricing = calculateBookingTotal(
      room.basePricePerNight,
      checkInDate,
      checkOutDate,
      guests,
      addons
    )

    // Return the pricing breakdown along with room info
    return res.json({
      room: {
        id: room._id,
        name: room.name,
        slug: room.slug,
        basePricePerNight: room.basePricePerNight,
      },
      pricing,
    })
  } catch (error) {
    console.error('[calculateBooking] error', error && error.message ? error.message : error)
    return res.status(500).json({ message: error.message })
  }
}

module.exports = {
  calculateBookingTotalController,
}

const Booking = require('../models/Booking')

const createBookingController = async (req, res) => {
  try {
    const {
      roomId,
      firstName,
      lastName,
      email,
      phone,
      checkInDate,
      checkOutDate,
      guests,
      addons = {},
    } = req.body

    // Validate required fields
    if (!roomId || !firstName || !lastName || !email || !phone || !checkInDate || !checkOutDate || !guests) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    const room = await Room.findById(roomId)
    if (!room || !room.isActive) return res.status(404).json({ message: 'Room not found' })

    const pricing = calculateBookingTotal(room.basePricePerNight, checkInDate, checkOutDate, guests, addons)

    const bookingNumber = `CCP-${Date.now()}`

    const bookingData = {
      bookingNumber,
      room: room._id,
      firstName,
      lastName,
      email,
      phone,
      checkInDate: new Date(checkInDate),
      checkOutDate: new Date(checkOutDate),
      nights: pricing.nights,
      guests,
      addons: {
        breakfast: !!addons.breakfast,
        lunch: !!addons.lunch,
        dinner: !!addons.dinner,
        airportTransport: !!addons.airportTransport,
        rentCarGolf7: !!addons.rentCarGolf7,
      },
      pricing: {
        roomTotal: pricing.roomTotal,
        guestExtraTotal: pricing.guestExtraTotal,
        mealsTotal: pricing.mealsTotal,
        transportTotal: pricing.transportTotal,
        rentCarTotal: pricing.rentCarTotal,
        totalAmount: pricing.totalAmount,
        currency: 'EUR',
      },
      status: 'pending_payment',
      paymentStatus: 'unpaid',
    }

    const booking = await Booking.create(bookingData)

    return res.status(201).json(booking)
  } catch (error) {
    console.error('[createBooking] error', error && error.message ? error.message : error)
    return res.status(500).json({ message: error.message })
  }
}

module.exports = {
  calculateBookingTotalController,
  createBookingController,
}

// Admin-only: return the latest 3 bookings with selected fields
async function latestBookingsController(req, res) {
  try {
    const apiKey = req.headers['x-admin-api-key']
    if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const Booking = require('../models/Booking')
    const bookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('room')
      .lean()

    const mapped = bookings.map(b => ({
      guestName: `${b.firstName || ''} ${b.lastName || ''}`.trim(),
      email: b.email || '',
      phone: b.phone || '',
      roomName: (b.room && (b.room.name || b.room.title)) ? (b.room.name || b.room.title) : (b.roomName || ''),
      checkInDate: b.checkInDate || null,
      checkOutDate: b.checkOutDate || null,
      guests: b.guests || 0,
      totalPrice: (b.pricing && b.pricing.totalAmount) ? b.pricing.totalAmount : (b.totalAmount || 0),
      bookingStatus: b.status || '',
      createdAt: b.createdAt || b.created_at || null,
    }))

    return res.json(mapped)
  } catch (error) {
    console.error('[latestBookings] error', error && error.message ? error.message : error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

// Re-export including the new controller
module.exports = {
  calculateBookingTotalController,
  createBookingController,
  latestBookingsController,
}
