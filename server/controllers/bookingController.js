const asyncHandler = require('express-async-handler')
const RoomType = require('../models/RoomType')
const Booking = require('../models/Booking')
const { assignUnit } = require('../utils/availability')
const calculatePrice = require('../utils/calculatePrice')
const sendEmail = require('../utils/sendEmail')
const { bookingEmailHtml } = require('../utils/emailTemplates')

// POST /api/bookings/quote
exports.quote = asyncHandler(async (req, res) => {
  const { roomTypeId, checkIn, checkOut, meals = {}, extras = {}, adults = 1, children = 0 } = req.body
  if (!roomTypeId || !checkIn || !checkOut) return res.status(400).json({ message: 'Missing fields' })
  const roomType = await RoomType.findById(roomTypeId)
  if (!roomType) return res.status(404).json({ message: 'RoomType not found' })

  const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000*60*60*24))
  if (nights <= 0) return res.status(400).json({ message: 'Invalid dates' })

  const pricing = calculatePrice({ pricePerNight: roomType.pricePerNight, nights, meals, extras })

  // check availability count
  const overlapping = await Booking.find({
    roomType: roomTypeId,
    status: { $in: ['pending','confirmed','paid'] },
    checkIn: { $lt: new Date(checkOut) },
    checkOut: { $gt: new Date(checkIn) }
  })
  const bookedCount = overlapping.length
  const availableCount = roomType.totalRooms - bookedCount

  res.json({ pricing, nights, availableCount })
})

// POST /api/bookings
exports.create = asyncHandler(async (req, res) => {
  const { roomTypeId, checkIn, checkOut, meals = {}, extras = {}, adults = 1, children = 0, fullName, email, phone, specialRequests } = req.body
  if (!roomTypeId || !checkIn || !checkOut || !fullName || !email || !phone) return res.status(400).json({ message: 'Missing required fields' })
  const roomType = await RoomType.findById(roomTypeId)
  if (!roomType) return res.status(404).json({ message: 'RoomType not found' })

  const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000*60*60*24))
  if (nights <= 0) return res.status(400).json({ message: 'Invalid dates' })

  // availability
  const { availableUnit } = await assignUnit(roomType.unitNumbers, roomType._id, checkIn, checkOut)
  if (!availableUnit) return res.status(400).json({ message: 'No availability for selected type/dates' })

  const pricingCalc = calculatePrice({ pricePerNight: roomType.pricePerNight, nights, meals, extras })

  const booking = new Booking({
    roomType: roomType._id,
    roomTypeSnapshot: {
      name: roomType.name,
      slug: roomType.slug,
      pricePerNight: roomType.pricePerNight
    },
    assignedUnitNumber: availableUnit,
    guest: { fullName, email, phone },
    checkIn, checkOut, nights,
    adults, children, totalPersons: (adults + children),
    meals, extras,
    pricing: {
      pricePerNight: roomType.pricePerNight,
      nights,
      roomTotal: pricingCalc.roomTotal,
      mealsTotal: pricingCalc.mealsTotal,
      airportTransportTotal: pricingCalc.airportTransportTotal,
      rentCarTotal: pricingCalc.rentCarTotal,
      total: pricingCalc.total,
      currency: pricingCalc.currency
    },
    status: 'pending',
    specialRequests
  })

  await booking.save()

  // send emails
  try {
    const html = bookingEmailHtml(booking)
    await sendEmail({ to: booking.guest.email, subject: 'Rezervimi juaj – CenterStays', html })
    if (process.env.ADMIN_EMAIL) await sendEmail({ to: process.env.ADMIN_EMAIL, subject: 'New booking created', html })
  } catch (e) {
    console.warn('Email send failed', e.message)
  }

  res.status(201).json(booking)
})

// GET /api/bookings
exports.list = asyncHandler(async (req, res) => {
  const bookings = await Booking.find().populate('roomType')
  res.json(bookings)
})

// GET /api/bookings/:id
exports.get = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate('roomType')
  if (!booking) return res.status(404).json({ message: 'Not found' })
  res.json(booking)
})

// GET /api/bookings/admin/all
exports.adminAll = asyncHandler(async (req, res) => {
  const key = req.headers['admin_api_key']
  if (!key || key !== process.env.ADMIN_API_KEY) return res.status(401).json({ message: 'Unauthorized' })
  const bookings = await Booking.find().sort({ createdAt: -1 })
  res.json(bookings)
})

// PATCH /api/bookings/:id/status
exports.updateStatus = asyncHandler(async (req, res) => {
  const key = req.headers['admin_api_key']
  if (!key || key !== process.env.ADMIN_API_KEY) return res.status(401).json({ message: 'Unauthorized' })
  const { status } = req.body
  const booking = await Booking.findById(req.params.id)
  if (!booking) return res.status(404).json({ message: 'Not found' })
  booking.status = status
  await booking.save()
  res.json(booking)
})
