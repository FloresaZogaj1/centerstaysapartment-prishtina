const mongoose = require('mongoose')

const PaymentSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    provider: { type: String, default: 'BANKART' },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'EUR' },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'cancelled'],
      default: 'pending',
    },
    bankartOrderId: { type: String },
    bankartTransactionId: { type: String },
    rawResponse: { type: Object },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Payment', PaymentSchema)
