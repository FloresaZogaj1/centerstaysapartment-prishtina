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
    return res.status(500).json({ message: error.message })
  }
}

module.exports = {
  calculateBookingTotalController,
  createBookingController,
}
