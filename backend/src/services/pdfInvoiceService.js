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

  // Create PDF document with margin 45 (A4 width ~595pt)
  const doc = new PDFDocument({ size: 'A4', margin: 45 })
    const stream = fs.createWriteStream(filepath)
    doc.pipe(stream)

    // Styles & layout helpers
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right // ~505 with margin 45
    const startX = 45
    let y = 35

    // Header with logo and clearer colors
    const MAIN_TEXT = '#111827'
    const SECONDARY = '#4B5563'
    const BOX_BG = '#F8F9FB'
    const BOX_BG_ALT = '#F3F4F6'
    const BORDER = '#D1D5DB'
    const ACCENT = '#C9A75D'

    // Helper functions as requested
    function formatDate(d) { return safeDate(d) }
    function moneyFmt(n, c) { return `${money(n)} ${c || 'EUR'}` }
    function drawLabelValue(label, value, x, yv, labelWidth, valueWidth) {
      doc.font('Helvetica-Bold').fontSize(9).fillColor(MAIN_TEXT).text(label, x, yv, { width: labelWidth })
      // value may need smaller font if too long
      let fs = 9
      doc.font('Helvetica').fontSize(fs)
      const valWidth = doc.widthOfString(String(value || '-'))
      if (valWidth > valueWidth) {
        fs = 7
        doc.font('Helvetica').fontSize(fs)
      }
      doc.fillColor(SECONDARY).text(String(value || '-'), x + labelWidth + 6, yv, { width: valueWidth })
      // restore default font
      doc.font('Helvetica').fontSize(10).fillColor(MAIN_TEXT)
    }

    const logoPaths = [
      // prefer an explicit backend asset the laser expects
      path.resolve(__dirname, '..', 'assets', 'centerstays-logo.png'),
      path.resolve(__dirname, '..', 'assets', 'logo.png'),
      path.resolve(__dirname, '..', '..', 'public', 'centerstays-logo.png'),
      path.resolve(__dirname, '..', '..', 'public', 'logo.png'),
      path.resolve(__dirname, '..', '..', 'public', 'Instagram_files', '472018000_1248431362937566_3208334774464705125_n(1).jpg'),
      // exact Instagram file path provided by user
      path.resolve(__dirname, '..', '..', 'public', 'Instagram_files', '472018000_1248431362937566_3208334774464705125_n.jpg')
    ]
    let usedLogo = null
    for (const p of logoPaths) {
      try { if (fs.existsSync(p)) { usedLogo = p; break } } catch (e) {}
    }

    // Draw logo (left) and business text (to the right) with precise coordinates
    const logoX = 45
    const logoY = 35
    const logoW = 85
    const businessTextX = 145
    const businessTextY = 38

    if (usedLogo) {
      try {
        doc.image(usedLogo, logoX, logoY, { width: logoW })
      } catch (e) {
        // fall back to text if image cannot be rendered
        doc.font('Helvetica-Bold').fontSize(16).fillColor(MAIN_TEXT).text('CENTERSTAYS APARTMENTS', logoX, logoY)
      }
    } else {
      doc.font('Helvetica-Bold').fontSize(16).fillColor(MAIN_TEXT).text('CENTERSTAYS APARTMENTS', logoX, logoY)
    }

    // Business info to the right of the logo
    doc.font('Helvetica-Bold').fontSize(16).fillColor(MAIN_TEXT).text('CENTERSTAYS APARTMENTS', businessTextX, businessTextY)
    doc.font('Helvetica').fontSize(9).fillColor(SECONDARY)
    doc.text('Prishtina, Kosovo', businessTextX, businessTextY + 22)
    doc.text('+383 48 110 988', businessTextX, businessTextY + 36)
    doc.text('centerstays@gmail.com', businessTextX, businessTextY + 50)
    doc.text('centerstays.apartments', businessTextX, businessTextY + 64)

    // Right-side invoice box at requested coordinates
    const infoBoxX = 365
    const infoBoxY = 35
    let infoBoxW = 185
    const infoBoxH = 125

    // keep inside printable area
    if (infoBoxX + infoBoxW > 550) infoBoxW = 550 - infoBoxX

    // label/value column setup inside the info box
    const innerPad = 8
    const labelColX = infoBoxX + innerPad
    const valueColX = infoBoxX + infoBoxW - innerPad - 10
    const labelWidth = 60
    const valueWidth = valueColX - (labelColX + labelWidth) - 6

    doc.save()
    doc.rect(infoBoxX, infoBoxY, infoBoxW, infoBoxH).fillColor(BOX_BG).fill()
    doc.rect(infoBoxX, infoBoxY, infoBoxW, infoBoxH).lineWidth(1).strokeColor(BORDER).stroke()
    doc.font('Helvetica-Bold').fontSize(14).fillColor(MAIN_TEXT).text('INVOICE', infoBoxX + innerPad, infoBoxY + innerPad)

    // Invoice number: put on its own line and use a tiny font if it's long
    const invLabelY = infoBoxY + 30
    const invVal = safeText(invoiceNumber)
    if (invVal.length > 20) {
      doc.font('Helvetica-Bold').fontSize(7).fillColor(MAIN_TEXT).text('Invoice No:', labelColX, invLabelY)
      doc.font('Helvetica').fontSize(7).fillColor(SECONDARY).text(invVal, labelColX + labelWidth + 6, invLabelY, { width: infoBoxW - (labelWidth + innerPad + 12) })
    } else {
      drawLabelValue('Invoice No:', invVal, labelColX, invLabelY, labelWidth, valueWidth)
    }

    drawLabelValue('Date:', formatDate(payment.invoiceSentAt || payment.updatedAt || payment.createdAt), labelColX, infoBoxY + 52, labelWidth, valueWidth)

    // Status row with PAID badge placed near the right edge of the box
    doc.font('Helvetica-Bold').fontSize(9).fillColor(MAIN_TEXT).text('Status:', labelColX, infoBoxY + 74)
    const badgeW = 60
    const badgeH = 16
    const badgeX = infoBoxX + infoBoxW - badgeW - innerPad
    const badgeY = infoBoxY + 72
    doc.roundedRect ? doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 3).fillColor(ACCENT).fill() : doc.rect(badgeX, badgeY, badgeW, badgeH).fillColor(ACCENT).fill()
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff').text((payment.status || 'PAID').toString().toUpperCase(), badgeX + 6, badgeY + 3)

    drawLabelValue('Provider:', safeText(payment.provider), labelColX, infoBoxY + 96, labelWidth, valueWidth)
    doc.restore()

  // Header divider removed to avoid crossing the logo/business details
  // (kept intentionally empty here — no replacement line)
  const headerBottomY = (typeof businessTextY !== 'undefined') ? businessTextY + 36 : (logoY + 36)
  y = headerBottomY

  // Bill To and Reservation Details side-by-side cards at requested Y ~165
  y = 165
  const cardHeight = 115
  const leftCardX = 45
  const rightCardX = 305
  const cardW = 245

  // Bill To card
  doc.rect(leftCardX, y, cardW, cardHeight).fillColor(BOX_BG_ALT).fill()
  doc.rect(leftCardX, y, cardW, cardHeight).lineWidth(1).strokeColor(BORDER).stroke()
  doc.font('Helvetica-Bold').fontSize(11).fillColor(MAIN_TEXT).text('Bill To', leftCardX + 10, y + 8)
  doc.font('Helvetica').fontSize(10).fillColor(MAIN_TEXT)
  const clientName = `${safeText(booking.firstName)} ${safeText(booking.lastName)}`.trim() || '-'
  doc.text(clientName, leftCardX + 10, y + 28)
  doc.text(safeText(booking.email || '-'), leftCardX + 10, y + 44)
  doc.text(safeText(booking.phone || '-'), leftCardX + 10, y + 60)

  // Reservation Details card
  doc.rect(rightCardX, y, cardW, cardHeight).fillColor(BOX_BG_ALT).fill()
  doc.rect(rightCardX, y, cardW, cardHeight).lineWidth(1).strokeColor(BORDER).stroke()
  doc.font('Helvetica-Bold').fontSize(11).fillColor(MAIN_TEXT).text('Reservation Details', rightCardX + 10, y + 8)
  doc.font('Helvetica').fontSize(10).fillColor(MAIN_TEXT)
  const roomName = (booking.room && (booking.room.name || booking.room.title)) || booking.roomName || '-'
  const checkIn = booking.checkInDate ? safeDate(booking.checkInDate) : '-'
  const checkOut = booking.checkOutDate ? safeDate(booking.checkOutDate) : '-'
  const nights = booking.nights || (booking.checkInDate && booking.checkOutDate ? Math.max(0, Math.round((new Date(booking.checkOutDate) - new Date(booking.checkInDate)) / 86400000)) : '-')
  doc.text(`Apartment: ${safeText(roomName)}`, rightCardX + 10, y + 28)
  doc.text(`Check-in: ${checkIn}`, rightCardX + 10, y + 44)
  doc.text(`Check-out: ${checkOut}`, rightCardX + 10, y + 60)
  doc.text(`Nights: ${safeText(nights)}`, rightCardX + 10, y + 76)
  doc.text(`Guests: ${safeText(booking.guests)}`, rightCardX + 10, y + 92)

    // Charges table
  y = 315
  const tableX = 45
  const tableWidth = 505
  const descW = 190
  const detailsW = 220
  const amountW = 95
  const col1 = tableX
  const col2 = tableX + descW + 10
  const col3 = col2 + detailsW + 10

  // Table header
  doc.rect(tableX, y, tableWidth, 26).fillColor(BOX_BG).fill()
  doc.rect(tableX, y, tableWidth, 26).lineWidth(1).strokeColor(BORDER).stroke()
  doc.font('Helvetica-Bold').fontSize(10).fillColor(MAIN_TEXT)
  doc.text('Description', col1 + 6, y + 8, { width: descW })
  doc.text('Details', col2 + 6, y + 8, { width: detailsW })
  doc.text('Amount', col3 + 6, y + 8, { width: amountW, align: 'right' })

  // Table row
  y += 34
  doc.font('Helvetica').fontSize(10).fillColor(MAIN_TEXT)
  doc.text('Apartment reservation', col1 + 6, y, { width: descW })
  const bookingDates = (checkIn !== '-' || checkOut !== '-') ? `${checkIn} - ${checkOut}` : '-'
  doc.text(`${safeText(roomName)} ${bookingDates}`, col2 + 6, y, { width: detailsW })
  const amount = payment.amount || (booking.pricing && booking.pricing.totalAmount) || 0
  const currency = payment.currency || (booking.pricing && booking.pricing.currency) || 'EUR'
  // Ensure amount stays inside table
  doc.text(`${money(amount)} ${currency}`, col3 + 6, y, { width: amountW - 6, align: 'right' })

    // Totals box bottom-right
  // Totals box as requested: x 355 width 195
  y += 36
  const totalsX = 355
  const totalsW = 195
  const totalsH = 82
  doc.rect(totalsX, y, totalsW, totalsH).fillColor(BOX_BG_ALT).fill()
  doc.rect(totalsX, y, totalsW, totalsH).lineWidth(1).strokeColor(BORDER).stroke()
  // labels left, values right
  const labelX = totalsX + 12
  const valueX = totalsX + totalsW - 12
  doc.font('Helvetica').fontSize(10).fillColor(MAIN_TEXT).text('Subtotal', labelX, y + 12)
  doc.text(`${money(amount)} ${currency}`, valueX - 90, y + 12, { width: 90, align: 'right' })
  doc.text('Tax/VAT', labelX, y + 30)
  doc.text('Included', valueX - 90, y + 30, { width: 90, align: 'right' })
  doc.font('Helvetica-Bold').fontSize(12).fillColor(MAIN_TEXT)
  doc.text('Total Paid', labelX, y + 52)
  doc.text(`${money(amount)} ${currency}`, valueX - 90, y + 52, { width: 90, align: 'right' })

  // Payment confirmation
  y = y + totalsH + 18
    doc.font('Helvetica').fontSize(10).fillColor(MAIN_TEXT)
    doc.text('This invoice confirms that the payment for this reservation has been successfully received.', startX, y, { width: pageWidth - 20 })

  // Footer — keep a single clean line. Removed automated-generation sentence per request.
  doc.fontSize(9).fillColor(SECONDARY)
  // Position the single footer line a bit above the bottom to avoid collisions
  const footerY = doc.page.height - 62
  doc.text('Thank you for choosing CenterStays Apartments.', startX, footerY)

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
