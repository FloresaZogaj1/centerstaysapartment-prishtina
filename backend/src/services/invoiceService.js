const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const emailService = require('./emailService')

// Simple invoice number generator (not meant for production accounting systems)
function generateInvoiceNumber(booking) {
  // YYYYMMDD-<bookingNumber>-<random4>
  const date = new Date()
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const rand = crypto.randomBytes(2).toString('hex').toUpperCase()
  const bn = booking && booking.bookingNumber ? String(booking.bookingNumber) : (booking && booking._id ? String(booking._id).slice(-6) : 'NA')
  return `${y}${m}${d}-${bn}-${rand}`
}

function formatCurrency(amount){
  try { return Number(amount).toFixed(2) + ' EUR' } catch(e){ return String(amount) }
}

function renderInvoiceHtml(booking, payment, invoiceNumber){
  const customerName = `${booking.firstName || ''} ${booking.lastName || ''}`.trim()
  const roomName = (booking.room && booking.room.name) || booking.roomName || 'N/A'
  const checkIn = booking.checkInDate ? (new Date(booking.checkInDate)).toLocaleDateString() : ''
  const checkOut = booking.checkOutDate ? (new Date(booking.checkOutDate)).toLocaleDateString() : ''

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width:700px; margin:0 auto;">
      <h2>Invoice</h2>
      <p><strong>Invoice number:</strong> ${invoiceNumber}</p>
      <p><strong>Booking number:</strong> ${booking.bookingNumber || ''}</p>
      <p><strong>Customer:</strong> ${customerName}</p>
      <hr/>
      <table width="100%" style="border-collapse: collapse;">
        <tr>
          <td><strong>Room</strong></td>
          <td>${roomName}</td>
        </tr>
        <tr>
          <td><strong>Check-in</strong></td>
          <td>${checkIn}</td>
        </tr>
        <tr>
          <td><strong>Check-out</strong></td>
          <td>${checkOut}</td>
        </tr>
        <tr>
          <td><strong>Nights</strong></td>
          <td>${booking.nights || ''}</td>
        </tr>
      </table>
      <hr/>
      <h3>Charges</h3>
      <table width="100%" style="border-collapse: collapse;">
        <tr>
          <td>Base price</td>
          <td style="text-align:right">${formatCurrency(booking.pricing && booking.pricing.baseAmount)}</td>
        </tr>
        <tr>
          <td>Taxes / fees</td>
          <td style="text-align:right">${formatCurrency(booking.pricing && booking.pricing.taxes)}</td>
        </tr>
        <tr>
          <td><strong>Total</strong></td>
          <td style="text-align:right"><strong>${formatCurrency(booking.pricing && booking.pricing.totalAmount)}</strong></td>
        </tr>
      </table>
      <hr/>
      <p><strong>Payment provider:</strong> ${payment.provider}</p>
      <p><strong>Payment id:</strong> ${payment._id}</p>
      <p><strong>Payment status:</strong> ${payment.status}</p>
      <p style="font-size:0.9em;color:#666">This is an automatically generated invoice. If you need an official invoice for accounting, please contact admin.</p>
    </div>
  `
  return html
}

async function generateAndSendInvoice(booking, payment){
  // Idempotent: if payment.invoiceSentAt exists, skip sending again
  try {
    if (!booking || !payment) return { ok: false, reason: 'missing_data' }

    if (payment.invoiceSentAt) return { ok: true, skipped: true, reason: 'already_sent', sentAt: payment.invoiceSentAt }

    if (!emailService.isEmailConfigured()) return { ok: false, reason: 'email_not_configured' }

    const invoiceNumber = generateInvoiceNumber(booking)
    const html = renderInvoiceHtml(booking, payment, invoiceNumber)

    // Send to customer
    let customerSent = false
    try {
      customerSent = !!(await emailService.sendMail({ from: process.env.EMAIL_FROM, to: booking.email, subject: `Invoice ${invoiceNumber} - Center Stays Apartments`, html }))
    } catch (e) {
      console.log('[invoiceService] customer email send failed', e && e.message ? e.message : e)
      customerSent = false
    }

    // Send admin copy
    let adminSent = false
    try {
      if (process.env.ADMIN_EMAIL) {
        adminSent = !!(await emailService.sendMail({ from: process.env.EMAIL_FROM, to: process.env.ADMIN_EMAIL, subject: `Invoice ${invoiceNumber} - ${booking.bookingNumber || ''}`, html }))
      }
    } catch (e) {
      console.log('[invoiceService] admin email send failed', e && e.message ? e.message : e)
      adminSent = false
    }

    // Update payment fields to mark invoice sent
    let sentAt = new Date()
    payment.invoiceNumber = invoiceNumber
    payment.invoiceSentAt = sentAt
    await payment.save()

    return { ok: true, invoiceNumber, sentAt, customerSent, adminSent }
  } catch (e) {
    console.error('[invoiceService] error generating or sending invoice:', e && e.message ? e.message : e)
    return { ok: false, reason: 'exception', error: e && e.message ? e.message : String(e) }
  }
}

module.exports = { generateAndSendInvoice, renderInvoiceHtml }
