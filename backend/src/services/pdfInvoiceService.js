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
  if (!d) return '-'
  try { return (new Date(d)).toISOString().split('T')[0] } catch(e){ return String(d) }
}

function safeText(v) {
  if (v == null || v === '') return '-'
  return String(v)
}

function money(n) {
  try { return Number(n || 0).toFixed(2) } catch(e) { return '0.00' }
}

async function generateInvoicePdf(booking, payment) {
  try {
    if (!booking || !payment) return { ok: false, reason: 'missing_data' }

    ensureInvoicesDir()

    const invoiceNumber = payment.invoiceNumber || (`INV-${String(payment._id).slice(-8)}`)
    const filename = `invoice-${invoiceNumber}-${String(payment._id).slice(-6)}.pdf`
    const filepath = path.join(invoicesDir, filename)

    // Create PDF document
    const doc = new PDFDocument({ size: 'A4', margin: 40 })
    const stream = fs.createWriteStream(filepath)
    doc.pipe(stream)

    // Styles & layout helpers
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right
    const startX = doc.page.margins.left
    let y = 40

    // Header with optional logo
    const logoPaths = [
      path.resolve(__dirname, '..', 'assets', 'logo.png'),
      path.resolve(__dirname, '..', '..', 'public', 'logo.png'),
      path.resolve(__dirname, '..', '..', 'public', 'centerstays-logo.png'),
      // user-provided Instagram image path (safe to try)
      path.resolve(__dirname, '..', '..', 'public', 'Instagram_files', '472018000_1248431362937566_3208334774464705125_n(1).jpg')
    ]
    let usedLogo = null
    for (const p of logoPaths) {
      try { if (fs.existsSync(p)) { usedLogo = p; break } } catch (e) {}
    }

    if (usedLogo) {
      try {
        // Draw logo at x:50, y:35, width:100
        doc.image(usedLogo, 50, 35, { width: 100 })
      } catch (e) {
        // fallback to text if image load fails
        doc.font('Helvetica-Bold').fontSize(18).fillColor('#222').text('CENTERSTAYS APARTMENTS', startX, y)
      }
    } else {
      doc.font('Helvetica-Bold').fontSize(18).fillColor('#222').text('CENTERSTAYS APARTMENTS', startX, y)
    }

    doc.font('Helvetica').fontSize(10).fillColor('#666')
    const headerLeftY = y + 22
    doc.text('Prishtina, Kosovo', startX, headerLeftY)
    doc.text('+383 48 110 988')
    doc.text('centerstays@gmail.com')
    doc.text('centerstays.apartments')

    // Right info box
    const infoBoxWidth = 220
    const infoX = doc.page.width - doc.page.margins.right - infoBoxWidth
    const infoY = y
    doc.rect(infoX, infoY, infoBoxWidth, 80).fillOpacity(0.03).fillAndStroke('#f0f0f0', '#e0e0e0')
    doc.fillColor('#000').font('Helvetica-Bold').fontSize(12).text('INVOICE', infoX + 10, infoY + 8)
    doc.font('Helvetica').fontSize(9).fillColor('#333')
    const infoLineY = infoY + 28
    doc.text(`Invoice No: ${safeText(invoiceNumber)}`, infoX + 10, infoLineY)
    doc.text(`Date: ${safeDate(payment.invoiceSentAt || payment.updatedAt || payment.createdAt)}`, infoX + 10, infoLineY + 14)
    doc.text(`Status: ${safeText((payment.status || '').toString().toUpperCase() || 'PAID')}`, infoX + 10, infoLineY + 28)

    // small provider info under box
    doc.fontSize(9).fillColor('#444')
    doc.text(`Provider: ${safeText(payment.provider)}`, infoX + 10, infoLineY + 44)
    if (payment.orderId) doc.text(`Order ID: ${safeText(payment.orderId)}`, infoX + 10, infoLineY + 58)

    // Divider
    y = headerLeftY + 70
    doc.moveTo(startX, y).lineTo(startX + pageWidth, y).strokeColor('#e0e0e0').lineWidth(1).stroke()
    y += 12

    // Bill To
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#222').text('Bill To:', startX, y)
    doc.font('Helvetica').fontSize(10).fillColor('#444')
    const billToY = y + 16
    const clientName = `${safeText(booking.firstName)} ${safeText(booking.lastName)}`.trim()
    doc.text(clientName || '-', startX, billToY)
    doc.text(safeText(booking.email || '-'), startX, billToY + 14)
    doc.text(safeText(booking.phone || '-'), startX, billToY + 28)

    // Reservation details on right side (beside Bill To)
    const resX = startX + 300
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#222').text('Reservation Details:', resX, y)
    doc.font('Helvetica').fontSize(10).fillColor('#444')
    const resY = y + 16
    const roomName = (booking.room && (booking.room.name || booking.room.title)) || booking.roomName || '-'
    const checkIn = booking.checkInDate ? safeDate(booking.checkInDate) : '-'
    const checkOut = booking.checkOutDate ? safeDate(booking.checkOutDate) : '-'
    const nights = booking.nights || (booking.checkInDate && booking.checkOutDate ? Math.max(0, Math.round((new Date(booking.checkOutDate) - new Date(booking.checkInDate)) / 86400000)) : '-')
    doc.text(`Apartment: ${safeText(roomName)}`, resX, resY)
    doc.text(`Check-in: ${checkIn}`, resX, resY + 14)
    doc.text(`Check-out: ${checkOut}`, resX, resY + 28)
    doc.text(`Nights: ${safeText(nights)}`, resX, resY + 42)
    doc.text(`Guests: ${safeText(booking.guests)}`, resX, resY + 56)
    doc.text(`Booking No: ${safeText(booking.bookingNumber || booking._id)}`, resX, resY + 70)

    // Charges table
    y = billToY + 80
    doc.moveTo(startX, y).lineTo(startX + pageWidth, y).strokeColor('#e0e0e0').lineWidth(1).stroke()
    y += 8
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#222')
    doc.text('Description', startX + 2, y)
    doc.text('Details', startX + 220, y)
    doc.text('Amount', startX + pageWidth - 90, y, { width: 80, align: 'right' })
    y += 18
    doc.font('Helvetica').fontSize(10).fillColor('#444')

    const amount = payment.amount || (booking.pricing && booking.pricing.totalAmount) || 0
    const currency = payment.currency || (booking.pricing && booking.pricing.currency) || 'EUR'
    const descX = startX + 2
    const detailsX = startX + 220
    const amountX = startX + pageWidth - 90

    // Row: Apartment reservation
    doc.text('Apartment reservation', descX, y)
    doc.text(safeText(roomName), detailsX, y)
    doc.text(`${money(amount)} ${currency}`, amountX, y, { width: 80, align: 'right' })
    y += 18

    // Divider before totals
    y += 6
    doc.moveTo(startX, y).lineTo(startX + pageWidth, y).strokeColor('#f0f0f0').lineWidth(1).stroke()
    y += 12

    // Totals box on right
    const totalsX = startX + pageWidth - 240
    doc.font('Helvetica').fontSize(10).fillColor('#444')
    doc.text('Subtotal:', totalsX, y)
    doc.text(`${money(amount)} ${currency}`, totalsX + 120, y, { width: 100, align: 'right' })
    y += 16
    doc.text('Tax/VAT:', totalsX, y)
    doc.text('Included', totalsX + 120, y, { width: 100, align: 'right' })
    y += 16
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#000')
    doc.text('Total Paid:', totalsX, y)
    doc.text(`${money(amount)} ${currency}`, totalsX + 120, y, { width: 100, align: 'right' })

    // Payment confirmation
    y += 36
    doc.font('Helvetica').fontSize(10).fillColor('#333')
    doc.text('This invoice confirms that the payment for this reservation has been successfully received.', startX, y, { width: pageWidth - 20 })

    // Footer
    doc.fontSize(9).fillColor('#666')
    doc.text('Thank you for choosing CenterStays Apartments.', startX, doc.page.height - 80)
    doc.text('This invoice was generated automatically after successful payment.', startX, doc.page.height - 64)

    // End PDF
    doc.end()

    // Wait for stream
    await new Promise((resolve, reject) => {
      stream.on('finish', resolve)
      stream.on('error', reject)
    })

    // Verify file exists
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
