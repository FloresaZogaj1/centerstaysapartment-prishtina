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

    // Header with logo and clearer colors
    const MAIN_TEXT = '#111827'
    const SECONDARY = '#4B5563'
    const BOX_BG = '#F8F9FB'
    const BOX_BG_ALT = '#F3F4F6'
    const BORDER = '#D1D5DB'
    const ACCENT = '#C9A75D'

    const logoPaths = [
      path.resolve(__dirname, '..', 'assets', 'logo.png'),
      path.resolve(__dirname, '..', '..', 'public', 'logo.png'),
      path.resolve(__dirname, '..', '..', 'public', 'centerstays-logo.png'),
      path.resolve(__dirname, '..', '..', 'public', 'Instagram_files', '472018000_1248431362937566_3208334774464705125_n(1).jpg')
    ]
    let usedLogo = null
    for (const p of logoPaths) {
      try { if (fs.existsSync(p)) { usedLogo = p; break } } catch (e) {}
    }

    // Draw logo or business name
    if (usedLogo) {
      try { doc.image(usedLogo, startX, 30, { width: 110 }) } catch (e) {
        doc.font('Helvetica-Bold').fontSize(18).fillColor(MAIN_TEXT).text('CENTERSTAYS APARTMENTS', startX, 36)
      }
    } else {
      doc.font('Helvetica-Bold').fontSize(18).fillColor(MAIN_TEXT).text('CENTERSTAYS APARTMENTS', startX, 36)
    }

    // Business info under logo
    doc.font('Helvetica').fontSize(9).fillColor(SECONDARY)
    const headerLeftY = 60
    doc.text('Prishtina, Kosovo', startX, headerLeftY)
    doc.text('+383 48 110 988')
    doc.text('centerstays@gmail.com')
    doc.text('centerstays.apartments')

    // Right-side invoice box (visible border and bg)
    const infoBoxWidth = 230
    const infoX = doc.page.width - doc.page.margins.right - infoBoxWidth
    const infoY = 30
    doc.save()
    doc.rect(infoX, infoY, infoBoxWidth, 110).fillColor(BOX_BG).fill()
    doc.rect(infoX, infoY, infoBoxWidth, 110).lineWidth(1).strokeColor(BORDER).stroke()
    doc.fillColor(MAIN_TEXT).font('Helvetica-Bold').fontSize(14).text('INVOICE', infoX + 14, infoY + 8)
    doc.font('Helvetica-Bold').fontSize(10).fillColor(MAIN_TEXT).text('Invoice No:', infoX + 14, infoY + 34)
    doc.font('Helvetica').fontSize(10).fillColor(SECONDARY).text(safeText(invoiceNumber), infoX + 100, infoY + 34)
    doc.font('Helvetica-Bold').fontSize(10).fillColor(MAIN_TEXT).text('Date:', infoX + 14, infoY + 50)
    doc.font('Helvetica').fontSize(10).fillColor(SECONDARY).text(safeDate(payment.invoiceSentAt || payment.updatedAt || payment.createdAt), infoX + 100, infoY + 50)
    doc.font('Helvetica-Bold').fontSize(10).fillColor(MAIN_TEXT).text('Status:', infoX + 14, infoY + 66)
    // PAID badge
    const paidBadgeX = infoX + 100
    doc.rect(paidBadgeX, infoY + 62, 70, 18).fillColor(ACCENT).fill()
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff').text((payment.status || 'PAID').toString().toUpperCase(), paidBadgeX + 8, infoY + 64)
    doc.font('Helvetica-Bold').fontSize(10).fillColor(MAIN_TEXT).text('Provider:', infoX + 14, infoY + 88)
    doc.font('Helvetica').fontSize(10).fillColor(SECONDARY).text(safeText(payment.provider), infoX + 100, infoY + 88)
    doc.restore()

    // Divider under header
    y = headerLeftY + 36
    doc.moveTo(startX, y).lineTo(startX + pageWidth, y).strokeColor(BORDER).lineWidth(1).stroke()
    y += 12

    // Bill To and Reservation Details side-by-side cards
    const cardHeight = 110
    const cardGap = 16
    const cardWidth = (pageWidth - cardGap) / 2
    const card1X = startX
    const card2X = startX + cardWidth + cardGap

    // Bill To card
    doc.rect(card1X, y, cardWidth, cardHeight).fillColor(BOX_BG_ALT).fill()
    doc.rect(card1X, y, cardWidth, cardHeight).lineWidth(1).strokeColor(BORDER).stroke()
    doc.font('Helvetica-Bold').fontSize(11).fillColor(MAIN_TEXT).text('Bill To', card1X + 10, y + 8)
    doc.font('Helvetica').fontSize(10).fillColor(MAIN_TEXT)
    const clientName = `${safeText(booking.firstName)} ${safeText(booking.lastName)}`.trim() || '-'
    doc.text(clientName, card1X + 10, y + 28)
    doc.text(safeText(booking.email || '-'), card1X + 10, y + 44)
    doc.text(safeText(booking.phone || '-'), card1X + 10, y + 60)

    // Reservation Details card
    doc.rect(card2X, y, cardWidth, cardHeight).fillColor(BOX_BG_ALT).fill()
    doc.rect(card2X, y, cardWidth, cardHeight).lineWidth(1).strokeColor(BORDER).stroke()
    doc.font('Helvetica-Bold').fontSize(11).fillColor(MAIN_TEXT).text('Reservation Details', card2X + 10, y + 8)
    doc.font('Helvetica').fontSize(10).fillColor(MAIN_TEXT)
    const roomName = (booking.room && (booking.room.name || booking.room.title)) || booking.roomName || '-'
    const checkIn = booking.checkInDate ? safeDate(booking.checkInDate) : '-'
    const checkOut = booking.checkOutDate ? safeDate(booking.checkOutDate) : '-'
    const nights = booking.nights || (booking.checkInDate && booking.checkOutDate ? Math.max(0, Math.round((new Date(booking.checkOutDate) - new Date(booking.checkInDate)) / 86400000)) : '-')
    doc.text(`Apartment: ${safeText(roomName)}`, card2X + 10, y + 28)
    doc.text(`Check-in: ${checkIn}`, card2X + 10, y + 44)
    doc.text(`Check-out: ${checkOut}`, card2X + 10, y + 60)
    doc.text(`Nights: ${safeText(nights)}  Guests: ${safeText(booking.guests)}`, card2X + 10, y + 76)

    // Charges table
    y = y + cardHeight + 20
    const tableX = startX
    const tableWidth = pageWidth
    const col1 = tableX + 10
    const col2 = tableX + 220
    const col3 = tableX + tableWidth - 110

    // Table header
    doc.rect(tableX, y, tableWidth, 24).fillColor(BOX_BG).fill()
    doc.rect(tableX, y, tableWidth, 24).lineWidth(1).strokeColor(BORDER).stroke()
    doc.font('Helvetica-Bold').fontSize(10).fillColor(MAIN_TEXT)
    doc.text('Description', col1, y + 6)
    doc.text('Details', col2, y + 6)
    doc.text('Amount', col3, y + 6, { width: 90, align: 'right' })

    // Table row
    y += 28
    doc.font('Helvetica').fontSize(10).fillColor(MAIN_TEXT)
    doc.text('Apartment reservation', col1, y)
    const bookingDates = (checkIn !== '-' || checkOut !== '-') ? `${checkIn} → ${checkOut}` : '-'
    doc.text(`${safeText(roomName)} ${bookingDates}`, col2, y)
    const amount = payment.amount || (booking.pricing && booking.pricing.totalAmount) || 0
    const currency = payment.currency || (booking.pricing && booking.pricing.currency) || 'EUR'
    doc.text(`${money(amount)} ${currency}`, col3, y, { width: 90, align: 'right' })

    // Totals box bottom-right
    y += 36
    const totalsBoxW = 240
    const totalsBoxH = 82
    const totalsX = startX + pageWidth - totalsBoxW
    doc.rect(totalsX, y, totalsBoxW, totalsBoxH).fillColor(BOX_BG_ALT).fill()
    doc.rect(totalsX, y, totalsBoxW, totalsBoxH).lineWidth(1).strokeColor(BORDER).stroke()
    doc.font('Helvetica').fontSize(10).fillColor(SECONDARY)
    doc.text('Subtotal', totalsX + 12, y + 12)
    doc.text(`${money(amount)} ${currency}`, totalsX + totalsBoxW - 12, y + 12, { width: 90, align: 'right' })
    doc.text('Tax/VAT', totalsX + 12, y + 30)
    doc.text('Included', totalsX + totalsBoxW - 12, y + 30, { width: 90, align: 'right' })
    doc.font('Helvetica-Bold').fontSize(12).fillColor(MAIN_TEXT)
    doc.text('Total Paid', totalsX + 12, y + 52)
    doc.text(`${money(amount)} ${currency}`, totalsX + totalsBoxW - 12, y + 52, { width: 90, align: 'right' })

    // Payment confirmation
    y = y + totalsBoxH + 18
    doc.font('Helvetica').fontSize(10).fillColor(MAIN_TEXT)
    doc.text('This invoice confirms that the payment for this reservation has been successfully received.', startX, y, { width: pageWidth - 20 })

    // Footer
    doc.fontSize(9).fillColor(SECONDARY)
    doc.text('Thank you for choosing CenterStays Apartments.', startX, doc.page.height - 70)
    doc.text('This invoice was generated automatically after successful payment.', startX, doc.page.height - 56)

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
