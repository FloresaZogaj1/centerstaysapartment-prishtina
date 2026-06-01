const mongoose = require('mongoose')

const BookingSchema = new mongoose.Schema({
  roomType: { type: mongoose.Schema.Types.ObjectId, ref: 'RoomType', required: true },
  roomTypeSnapshot: { type: Object, required: true },
  assignedUnitNumber: { type: String },
  guest: {
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true }
  },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  nights: { type: Number },
  adults: { type: Number, default: 1 },
  children: { type: Number, default: 0 },
  totalPersons: { type: Number },
  meals: {
    breakfast: { type: Boolean, default: false },
    lunch: { type: Boolean, default: false },
    dinner: { type: Boolean, default: false }
  },
  extras: {
    airportTransportTwoWay: { type: Boolean, default: false },
    rentCarGolf7: { type: Boolean, default: false }
  },
  pricing: {
    pricePerNight: Number,
    nights: Number,
    roomTotal: Number,
    mealsTotal: Number,
    airportTransportTotal: Number,
    rentCarTotal: Number,
    total: Number,
    currency: { type: String, default: 'EUR' }
  },
  status: { type: String, enum: ['pending','paid','failed','cancelled','confirmed'], default: 'pending' },
  paymentProvider: { type: String },
  paymentStatus: { type: String },
  paymentReference: { type: String },
  bktOrderId: { type: String },
  specialRequests: { type: String }
}, { timestamps: true })

module.exports = mongoose.model('Booking', BookingSchema)
