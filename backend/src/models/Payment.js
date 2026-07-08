const mongoose = require('mongoose')

const PaymentSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    provider: { type: String, default: 'BANKART' },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'EUR' },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'cancelled', 'refunded'],
      default: 'pending',
    },
    bankartOrderId: { type: String },
    bankartTransactionId: { type: String },
  // Generic order identifiers for other providers (e.g., BKT oid)
  orderId: { type: String },
  providerOrderId: { type: String },
  merchantTransactionId: { type: String },
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
      ,
      // Notification timestamps (idempotency for emails)
      paidCustomerEmailSentAt: { type: Date },
      paidAdminEmailSentAt: { type: Date },
  paidCustomerEmailError: { type: String },
  paidAdminEmailError: { type: String },
      failedCustomerEmailSentAt: { type: Date },
      failedAdminEmailSentAt: { type: Date },
  failedCustomerEmailError: { type: String },
  failedAdminEmailError: { type: String },
      cancelledCustomerEmailSentAt: { type: Date },
      cancelledAdminEmailSentAt: { type: Date },
  cancelledCustomerEmailError: { type: String },
  cancelledAdminEmailError: { type: String },
      expiredCustomerEmailSentAt: { type: Date },
      expiredAdminEmailSentAt: { type: Date },
  expiredCustomerEmailError: { type: String },
  expiredAdminEmailError: { type: String },
      refundedCustomerEmailSentAt: { type: Date },
      refundedAdminEmailSentAt: { type: Date },
  refundedCustomerEmailError: { type: String },
  refundedAdminEmailError: { type: String },
    // last notification summary
    lastNotificationStatus: { type: String },
    lastNotificationAt: { type: Date },
    lastNotificationReason: { type: String },
      // last notification summary
    // legacy placement kept above
  },
  { timestamps: true }
)

module.exports = mongoose.model('Payment', PaymentSchema)
