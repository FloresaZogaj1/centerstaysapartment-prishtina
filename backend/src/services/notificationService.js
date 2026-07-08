const invoiceService = require('./invoiceService')
const emailService = require('./emailService')
const Booking = require('../models/Booking')
const Payment = require('../models/Payment')

async function handlePaymentResultNotification({ paymentId, bookingId, status, reason }) {
  // Non-blocking orchestrator: perform idempotent invoice + email sends where appropriate
  try {
    if (!paymentId && !bookingId) return { ok: false, reason: 'missing_identifiers' }

    const payment = paymentId ? await Payment.findById(paymentId) : await Payment.findOne({ booking: bookingId }).sort({ createdAt: -1 })
    if (!payment) return { ok: false, reason: 'payment_not_found' }

    const booking = bookingId ? await Booking.findById(bookingId).populate('room') : await Booking.findById(payment.booking).populate('room')
    if (!booking) return { ok: false, reason: 'booking_not_found' }

    const result = { ok: true, actions: [] }

    // Helper to mark sentAt on payment and save
    async function markAndSave(field) {
      try {
        payment[field] = payment[field] || new Date()
        payment.lastNotificationStatus = status
        payment.lastNotificationAt = new Date()
        await payment.save()
      } catch (e) { console.error('[notificationService] markAndSave error', e && e.message ? e.message : e) }
    }

    // Only proceed if email is configured; invoiceService will check as well
    const emailConfigured = emailService.isEmailConfigured()

    if (status === 'paid') {
      // Generate invoice idempotently
      try {
        const inv = await invoiceService.generateAndSendInvoice(booking, payment)
        result.actions.push({ invoice: inv })
      } catch (e) { console.error('[notificationService] invoice error', e && e.message ? e.message : e); result.actions.push({ invoice: { ok: false } }) }

      // Send customer + admin emails idempotently
      if (emailConfigured && !payment.paidCustomerEmailSentAt) {
        try {
          const resCust = await emailService.sendBookingPaidCustomerEmail(booking)
          if (resCust) {
            await markAndSave('paidCustomerEmailSentAt')
            result.actions.push({ paidCustomerEmailSent: true })
          } else {
            result.actions.push({ paidCustomerEmailSent: false })
            payment.paidCustomerEmailError = payment.paidCustomerEmailError || 'send_failed'
            await payment.save()
          }
        } catch (e) { console.error('[notificationService] paidCustomerEmail error', e && e.message ? e.message : e); result.actions.push({ paidCustomerEmailSent: false }) }
      }
      if (emailConfigured && !payment.paidAdminEmailSentAt) {
        try {
          const resAdmin = await emailService.sendBookingPaidAdminEmail(booking, payment)
          if (resAdmin) {
            await markAndSave('paidAdminEmailSentAt')
            result.actions.push({ paidAdminEmailSent: true })
          } else {
            result.actions.push({ paidAdminEmailSent: false })
            payment.paidAdminEmailError = payment.paidAdminEmailError || 'send_failed'
            await payment.save()
          }
        } catch (e) { console.error('[notificationService] paidAdminEmail error', e && e.message ? e.message : e); result.actions.push({ paidAdminEmailSent: false }) }
      }
    } else if (status === 'failed' || status === 'declined') {
      let customerResult = { ok: false }
      let adminResult = { ok: false }
      if (emailConfigured && !payment.failedCustomerEmailSentAt) {
        try {
          customerResult.ok = await emailService.sendBookingFailedCustomerEmail(booking, payment)
          if (customerResult.ok) {
            await markAndSave('failedCustomerEmailSentAt')
            result.actions.push({ failedCustomerEmailSent: true })
          } else {
            result.actions.push({ failedCustomerEmailSent: false })
            payment.failedCustomerEmailError = payment.failedCustomerEmailError || 'send_failed'
            await payment.save()
          }
        } catch (e) {
          customerResult = { ok: false, error: e && e.message ? e.message : String(e) }
          console.error('[notificationService] failedCustomerEmail error', customerResult.error)
          result.actions.push({ failedCustomerEmailSent: false })
          payment.failedCustomerEmailError = payment.failedCustomerEmailError || customerResult.error
          await payment.save()
        }
      } else if (payment.failedCustomerEmailSentAt) {
        customerResult.ok = true
      }

      if (emailConfigured && !payment.failedAdminEmailSentAt) {
        try {
          adminResult.ok = await emailService.sendBookingFailedAdminEmail(booking, payment)
          if (adminResult.ok) {
            await markAndSave('failedAdminEmailSentAt')
            result.actions.push({ failedAdminEmailSent: true })
          } else {
            result.actions.push({ failedAdminEmailSent: false })
            payment.failedAdminEmailError = payment.failedAdminEmailError || 'send_failed'
            await payment.save()
          }
        } catch (e) {
          adminResult = { ok: false, error: e && e.message ? e.message : String(e) }
          console.error('[notificationService] failedAdminEmail error', adminResult.error)
          result.actions.push({ failedAdminEmailSent: false })
          payment.failedAdminEmailError = payment.failedAdminEmailError || adminResult.error
          await payment.save()
        }
      } else if (payment.failedAdminEmailSentAt) {
        adminResult.ok = true
      }

      // Final logging: completed vs completed with errors
      if (customerResult.ok && adminResult.ok) {
        console.log('[Payment Notification] completed', { bookingId: String(booking._id), paymentId: String(payment._id), actions: result.actions })
      } else {
        console.error('[Payment Notification] completed with errors', {
          bookingId: booking?._id ? String(booking._id) : null,
          paymentId: String(payment._id),
          customerEmailOk: !!customerResult.ok,
          adminEmailOk: !!adminResult.ok,
          customerEmailError: customerResult.error || payment.failedCustomerEmailError,
          adminEmailError: adminResult.error || payment.failedAdminEmailError
        })
      }
    } else if (status === 'cancelled') {
      if (emailConfigured && !payment.cancelledCustomerEmailSentAt) {
        try { const ok = await emailService.sendBookingFailedCustomerEmail(booking); if (ok) await markAndSave('cancelledCustomerEmailSentAt'); result.actions.push({ cancelledCustomerEmailSent: !!ok }) } catch (e) { console.error('[notificationService] cancelledCustomerEmail error', e && e.message ? e.message : e); result.actions.push({ cancelledCustomerEmailSent: false }) }
      }
      if (emailConfigured && !payment.cancelledAdminEmailSentAt) {
        try { const ok = await emailService.sendBookingFailedAdminEmail(booking, payment); if (ok) await markAndSave('cancelledAdminEmailSentAt'); result.actions.push({ cancelledAdminEmailSent: !!ok }) } catch (e) { console.error('[notificationService] cancelledAdminEmail error', e && e.message ? e.message : e); result.actions.push({ cancelledAdminEmailSent: false }) }
      }
    } else if (status === 'expired') {
      if (emailConfigured && !payment.expiredCustomerEmailSentAt) {
        try { const ok = await emailService.sendBookingFailedCustomerEmail(booking); if (ok) await markAndSave('expiredCustomerEmailSentAt'); result.actions.push({ expiredCustomerEmailSent: !!ok }) } catch (e) { console.error('[notificationService] expiredCustomerEmail error', e && e.message ? e.message : e); result.actions.push({ expiredCustomerEmailSent: false }) }
      }
      if (emailConfigured && !payment.expiredAdminEmailSentAt) {
        try { const ok = await emailService.sendBookingFailedAdminEmail(booking, payment); if (ok) await markAndSave('expiredAdminEmailSentAt'); result.actions.push({ expiredAdminEmailSent: !!ok }) } catch (e) { console.error('[notificationService] expiredAdminEmail error', e && e.message ? e.message : e); result.actions.push({ expiredAdminEmailSent: false }) }
      }
    } else if (status === 'refunded') {
      if (emailConfigured && !payment.refundedCustomerEmailSentAt) {
        try { const ok = await emailService.sendMail({ from: process.env.EMAIL_FROM, to: booking.email, subject: `Booking refunded - ${booking.bookingNumber}`, html: `<p>Your booking ${booking.bookingNumber} was refunded.</p>` }); if (ok) await markAndSave('refundedCustomerEmailSentAt'); result.actions.push({ refundedCustomerEmailSent: !!ok }) } catch (e) { console.error('[notificationService] refundedCustomerEmail error', e && e.message ? e.message : e); result.actions.push({ refundedCustomerEmailSent: false }) }
      }
      if (emailConfigured && !payment.refundedAdminEmailSentAt) {
        try { const ok = await emailService.sendMail({ from: process.env.EMAIL_FROM, to: process.env.ADMIN_EMAIL, subject: `Booking refunded - ${booking.bookingNumber}`, html: `<p>Booking ${booking.bookingNumber} was refunded. Payment id: ${payment._id}</p>` }); if (ok) await markAndSave('refundedAdminEmailSentAt'); result.actions.push({ refundedAdminEmailSent: !!ok }) } catch (e) { console.error('[notificationService] refundedAdminEmail error', e && e.message ? e.message : e); result.actions.push({ refundedAdminEmailSent: false }) }
      }
    }

    return result
  } catch (e) {
    console.error('[notificationService] unexpected error', e && e.message ? e.message : e)
    return { ok: false, reason: 'exception', error: e && e.message ? e.message : String(e) }
  }
}

module.exports = { handlePaymentResultNotification }
