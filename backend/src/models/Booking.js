const mongoose = require('mongoose')

const AddonsSchema = new mongoose.Schema(
  {
    breakfast: { type: Boolean, default: false },
    lunch: { type: Boolean, default: false },
    dinner: { type: Boolean, default: false },
    airportTransport: { type: Boolean, default: false },
    rentCarGolf7: { type: Boolean, default: false },
  },
  { _id: false }
)

const PricingSchema = new mongoose.Schema(
  {
    roomTotal: { type: Number, required: true },
    guestExtraTotal: { type: Number, required: true },
    mealsTotal: { type: Number, required: true },
    transportTotal: { type: Number, required: true },
    rentCarTotal: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    currency: { type: String, default: 'EUR' },
  },
  { _id: false }
)

const BookingSchema = new mongoose.Schema(
  {
    bookingNumber: { type: String, required: true, unique: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    checkInDate: { type: Date, required: true },
    checkOutDate: { type: Date, required: true },
    nights: { type: Number, required: true },
    guests: { type: Number, required: true },
    addons: { type: AddonsSchema, default: {} },
    pricing: { type: PricingSchema, required: true },
    status: {
      type: String,
      enum: ['pending_payment', 'paid', 'failed', 'cancelled', 'expired'],
      default: 'pending_payment',
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'pending', 'paid', 'failed', 'cancelled'],
      default: 'unpaid',
    },
    bankartOrderId: { type: String },
    bankartTransactionId: { type: String },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Booking', BookingSchema)
