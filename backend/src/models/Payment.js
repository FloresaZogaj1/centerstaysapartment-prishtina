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
  // Provider callback metadata (persisted for audit + troubleshooting)
  providerTransactionId: { type: String }, // primary provider transaction id (uuid)
  providerUuid: { type: String },
  providerResult: { type: String },
  providerCode: { type: String },
  providerMessage: { type: String },
  adapterCode: { type: String },
  adapterMessage: { type: String },
  callbackReceivedAt: { type: Date },
  verifiedSignature: { type: Boolean },
    rawResponse: { type: Object },
  // Refund metadata
  refundStatus: { type: String },
  refundedAt: { type: Date },
  refundAmount: { type: String },
  refundTransactionId: { type: String },
  refundMerchantTransactionId: { type: String },
  refundProviderResult: { type: String },
    // Invoice metadata to ensure idempotent invoice sending
    invoiceNumber: { type: String },
    invoiceSentAt: { type: Date }
  },
  { timestamps: true }
)

module.exports = mongoose.model('Payment', PaymentSchema)
