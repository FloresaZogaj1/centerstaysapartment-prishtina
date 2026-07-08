const fs = require('fs')
const path = require('path')
const PDFDocument = require('pdfkit')

const invoicesDir = path.resolve(__dirname, '..', '..', 'invoices')

function ensureInvoicesDir() {
  try {
    if (!fs.existsSync(invoicesDir)) fs.mkdirSync(invoicesDir, { recursive: true })
  } catch (e) {}
}

function safeDate(d) {
  if (!d) return ''
  try { return (new Date(d)).toISOString().split('T')[0] } catch(e){ return String(d) }
}

async function generateInvoicePdf(booking, payment) {
  try {
    if (!booking || !payment) return { ok: false, reason: 'missing_data' }

    ensureInvoicesDir()

    const invoiceNumber = payment.invoiceNumber || (`INV-${String(payment._id).slice(-8)}`)
    const filename = `invoice-${invoiceNumber}-${String(payment._id).slice(-6)}.pdf`
    const filepath = path.join(invoicesDir, filename)

    // Create PDF
    const doc = new PDFDocument({ size: 'A4', margin: 50 })
    const stream = fs.createWriteStream(filepath)
    doc.pipe(stream)

    // Header
    doc.fontSize(20).text('Center Stays Apartments', { align: 'left' })
    doc.moveDown(0.5)
    doc.fontSize(12).text(`Invoice: ${invoiceNumber}`)
    doc.text(`Payment ID: ${String(payment._id)}`)
    doc.text(`Invoice Date: ${safeDate(payment.invoiceSentAt || payment.updatedAt || payment.createdAt)}`)
    doc.moveDown()

    // Payment/provider info
    doc.fontSize(12).text(`Payment provider: ${payment.provider || ''}`)
    doc.text(`Payment status: ${payment.status || ''}`)
    doc.text(`Order ID: ${payment.orderId || ''}`)
    doc.text(`Provider Order ID: ${payment.providerOrderId || ''}`)
    doc.moveDown()

    // Client
    const clientName = `${booking.firstName || ''} ${booking.lastName || ''}`.trim()
    doc.fontSize(14).text('Bill To:', { underline: true })
    doc.fontSize(12).text(clientName)
    doc.text(booking.email || '')
    doc.text(booking.phone || '')
    doc.moveDown()

    // Booking details
    const roomName = (booking.room && (booking.room.name || booking.room.title)) || booking.roomName || 'N/A'
    doc.fontSize(12).text(`Apartment/Room: ${roomName}`)
    doc.text(`Check-in: ${safeDate(booking.checkInDate)}`)
    doc.text(`Check-out: ${safeDate(booking.checkOutDate)}`)
    doc.text(`Guests: ${booking.guests || ''}`)
    doc.moveDown()

    // Amounts
    const amount = payment.amount || (booking.pricing && booking.pricing.totalAmount) || 0
    const currency = payment.currency || (booking.pricing && booking.pricing.currency) || 'EUR'
    doc.fontSize(12).text('Charges:', { underline: true })
    doc.moveDown(0.2)
    doc.text(`Total: ${Number(amount).toFixed(2)} ${currency}`, { align: 'right' })
    doc.moveDown(2)

    doc.fontSize(10).text('Thank you for your booking.', { align: 'left' })

    doc.end()

    // Wait for stream to finish
    await new Promise((resolve, reject) => {
      stream.on('finish', resolve)
      stream.on('error', reject)
    })

    // Verify file exists before returning
    try {
      if (!fs.existsSync(filepath)) {
        console.error('[pdfInvoiceService] file not found after write', { filepath })
        return { ok: false, reason: 'file_missing_after_write', path: filepath }
      }
    } catch (e) {
      console.error('[pdfInvoiceService] exists check failed', { message: e && e.message })
      return { ok: false, error: e && e.message }
    }

    return { ok: true, path: filepath, filename }
  } catch (e) {
    console.error('[pdfInvoiceService] error', e && e.message ? e.message : e)
    return { ok: false, error: e && e.message }
  }
}

module.exports = { generateInvoicePdf }
