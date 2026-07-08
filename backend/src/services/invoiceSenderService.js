const Payment = require('../models/Payment')
const invoiceService = require('./invoiceService')
const pdfInvoiceService = require('./pdfInvoiceService')
const emailService = require('./emailService')

// Send invoice for a single paid payment. Idempotent: will not resend when
// payment.paidCustomerEmailSentAt exists unless force=true.
async function sendInvoiceForPayment(payment, { force = false } = {}) {
  try {
    if (!payment) return { ok: false, reason: 'missing_payment' }
    if (payment.status !== 'paid') return { ok: false, reason: 'not_paid' }
    if (payment.paidCustomerEmailSentAt && !force) return { ok: true, skipped: true, reason: 'already_sent' }

    // Populate booking and room if needed
    let full = payment
    if (!payment.booking || !payment.booking.firstName) {
      full = await Payment.findById(payment._id).populate({ path: 'booking', populate: { path: 'room' } })
    }
    const booking = full.booking
    if (!booking) return { ok: false, reason: 'missing_booking' }

    // Ensure invoiceNumber exists
    if (!full.invoiceNumber) {
      full.invoiceNumber = invoiceService.generateInvoiceNumber(booking)
    }

    // Generate PDF
    const pdf = await pdfInvoiceService.generateInvoicePdf(booking, full)
    if (!pdf || !pdf.ok) return { ok: false, reason: 'pdf_failed', error: pdf && pdf.error }

    // Prepare email body
    const customerName = `${booking.firstName || ''} ${booking.lastName || ''}`.trim()
    const subject = 'Invoice for your Center Stay Apartments reservation'
    const html = `
      <p>Hello ${customerName || 'Guest'},</p>
      <p>Thank you for your reservation at Center Stay Apartments Prishtina.</p>
      <p>Your payment has been received successfully. Attached you can find your invoice PDF.</p>
      <h4>Reservation details:</h4>
      <ul>
        <li><strong>Apartment:</strong> ${(booking.room && (booking.room.name || booking.room.title)) || booking.roomName || 'N/A'}</li>
        <li><strong>Check-in:</strong> ${booking.checkInDate ? (new Date(booking.checkInDate)).toLocaleDateString() : ''}</li>
        <li><strong>Check-out:</strong> ${booking.checkOutDate ? (new Date(booking.checkOutDate)).toLocaleDateString() : ''}</li>
        <li><strong>Guests:</strong> ${booking.guests || ''}</li>
        <li><strong>Amount paid:</strong> ${Number(payment.amount || booking.pricing?.totalAmount || 0).toFixed(2)} ${payment.currency || booking.pricing?.currency || 'EUR'}</li>
        <li><strong>Order ID:</strong> ${payment.orderId || payment.providerOrderId || ''}</li>
      </ul>
      <p>Best regards,<br/>Center Stay Apartments Prishtina</p>
    `

    // Attach PDF
    const attachments = [
      {
        filename: pdf.filename,
        path: pdf.path,
        contentType: 'application/pdf'
      }
    ]

    // Validate customer email presence
    const to = booking.email
    if (!to) return { ok: false, reason: 'missing_customer_email' }

    // Send email using emailService.sendMail which prefers Brevo when configured
    const sendResult = await emailService.sendMail({ from: process.env.EMAIL_FROM, to, toName: `${booking.firstName || ''} ${booking.lastName || ''}`.trim(), subject, html, attachments })

    if (!sendResult || !sendResult.ok) {
      // Persist error info to payment
      try {
        full.paidCustomerEmailError = sendResult && sendResult.error ? String(sendResult.error) : 'send_failed'
        full.lastNotificationStatus = 'paid'
        full.lastNotificationAt = new Date()
        await full.save()
      } catch (e) {}

      // Prepare detailed failure info when Brevo returns structured error
      const failure = { id: full._id, error: sendResult && sendResult.error ? String(sendResult.error) : 'send_failed' }
      if (sendResult && sendResult.statusCode) failure.statusCode = sendResult.statusCode
      if (sendResult && sendResult.brevoError) failure.brevoError = sendResult.brevoError
      // Attach attachment info if available
      try {
        const fs = require('fs')
        if (attachments && attachments[0] && attachments[0].path && fs.existsSync(attachments[0].path)) {
          const st = fs.statSync(attachments[0].path)
          failure.attachment = { filename: attachments[0].filename, size: st.size }
          console.error('[invoiceSenderService] Brevo send failed for', { to, from: process.env.EMAIL_FROM, filename: attachments[0].filename, size: st.size })
        }
      } catch (e) {}

      return { ok: false, reason: 'send_failed', failure }
    }

    // Mark as sent
    const now = new Date()
    full.paidCustomerEmailSentAt = now
    full.invoiceNumber = full.invoiceNumber || invoiceService.generateInvoiceNumber(booking)
    full.invoiceSentAt = full.invoiceSentAt || now
    full.lastNotificationStatus = 'paid'
    full.lastNotificationAt = now
    await full.save()

    return { ok: true, sentAt: now }
  } catch (e) {
    console.error('[invoiceSenderService] error', e && e.message ? e.message : e)
    return { ok: false, reason: 'exception', error: e && e.message }
  }
}

// Bulk send for multiple payments (array of payment documents or ids). Only processes paid payments
async function sendInvoicesForPayments(payments, { force = false } = {}) {
  const results = { processed: 0, sent: 0, skipped: 0, failed: 0, failedItems: [] }
  for (const p of payments) {
    results.processed++
    try {
      // Accept either id or doc
      let paymentDoc = p
      if (typeof p === 'string' || (p && p._id && !p.booking)) {
        paymentDoc = await Payment.findById(p)
      }
      if (!paymentDoc) {
        results.failed++
        results.failedItems.push({ id: p && (p._id || p), error: 'not_found' })
        continue
      }
      if (paymentDoc.status !== 'paid') {
        results.skipped++
        continue
      }
      if (paymentDoc.paidCustomerEmailSentAt && !force) {
        results.skipped++
        continue
      }

      const r = await sendInvoiceForPayment(paymentDoc, { force })
      if (r && r.ok) results.sent++
      else {
        results.failed++
        // r may contain a structured failure under r.failure
        if (r && r.failure) results.failedItems.push({ id: paymentDoc._id, ...r.failure })
        else results.failedItems.push({ id: paymentDoc._id, error: r && r.error ? r.error : r && r.reason ? r.reason : 'unknown' })
      }
    } catch (e) {
      results.failed++
      results.failedItems.push({ id: p && (p._id || p), error: e && e.message ? e.message : String(e) })
    }
  }
  return results
}

module.exports = { sendInvoiceForPayment, sendInvoicesForPayments }
