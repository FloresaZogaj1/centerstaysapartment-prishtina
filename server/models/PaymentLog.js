const mongoose = require('mongoose')

const PaymentLogSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  provider: { type: String },
  orderId: { type: String },
  amount: { type: Number },
  currency: { type: String, default: 'EUR' },
  status: { type: String },
  rawRequest: { type: Object },
  rawResponse: { type: Object },
  transactionId: { type: String },
  errorMessage: { type: String }
}, { timestamps: true })

module.exports = mongoose.model('PaymentLog', PaymentLogSchema)
