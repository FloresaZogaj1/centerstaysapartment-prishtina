const nodemailer = require('nodemailer')

const requiredEnv = ['SMTP_HOST','SMTP_PORT','SMTP_USER','SMTP_PASS','EMAIL_FROM']

function smtpConfigured() {
  return requiredEnv.every(k => !!process.env[k])
}

function createTransporter(){
  if (!smtpConfigured()) return null
  const secure = String(process.env.SMTP_SECURE || 'false') === 'true'
  const host = process.env.SMTP_HOST || process.env.EMAIL_HOST || process.env.MAIL_HOST
  const port = process.env.SMTP_PORT || process.env.EMAIL_PORT || process.env.MAIL_PORT || 587
  const user = process.env.SMTP_USER || process.env.EMAIL_USER || process.env.GMAIL_USER
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.GMAIL_PASS
  return nodemailer.createTransport({
    host: host,
    port: Number(port),
    secure: secure,
    auth: {
      user: user,
      pass: pass
    },
    // explicit timeouts to fail fast and surface clear errors
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  })
}

async function sendMail(opts){
  const transporter = createTransporter()
  if (!transporter) {
    console.log('Email not sent: SMTP configuration missing')
    return { ok: false, error: 'smtp_not_configured' }
  }
  try {
    const info = await transporter.sendMail(opts)
    return { ok: true, messageId: info && info.messageId ? info.messageId : null, info }
  } catch (err) {
    // structured logging for operator diagnostics
    console.error('[Email] send failed', {
      to: opts && opts.to,
      subject: opts && opts.subject,
      message: err && err.message,
      code: err && err.code,
      command: err && err.command
    })
    return { ok: false, error: err && err.message ? err.message : String(err), code: err && err.code, command: err && err.command }
  }
}

async function verifyTransporter(){
  const transporter = createTransporter()
  if (!transporter) {
    // Explicitly log missing configuration
    console.error('[BOOT] SMTP transporter verify failed', { message: 'smtp_not_configured' })
    return { ok: false, reason: 'smtp_not_configured' }
  }
  try {
    await transporter.verify()
    console.log('[BOOT] SMTP transporter verified')
    return { ok: true }
  } catch (err) {
    // Log a standardized failure object for Render
    try {
      console.error('[BOOT] SMTP transporter verify failed', {
        message: err && err.message ? err.message : String(err),
        code: err && err.code,
        command: err && err.command
      })
    } catch (e) {}
    return { ok: false, error: err && err.message ? err.message : String(err), code: err && err.code, command: err && err.command }
  }
}

function isEmailConfigured(){
  return smtpConfigured()
}

async function sendTestEmail(to){
  // Returns:
  // - false when SMTP missing
  // - true when sent
  // - throws when send fails
  if (!isEmailConfigured()) {
    console.log('Email not sent: SMTP configuration missing')
    return false
  }

  const transporter = createTransporter()
  if (!transporter) {
    console.log('Email not sent: SMTP configuration missing')
    return false
  }

  const subject = 'City Center Prishtina - SMTP test'
  const text = 'SMTP email delivery is configured correctly.'

  // Let errors bubble up so callers can distinguish send failures
  const info = await transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject, text })
  return true
}

function formatDate(d){
  if (!d) return ''
  try { return (new Date(d)).toISOString() } catch(e){ return String(d) }
}

function safeNumber(n){
  if (n == null) return ''
  return Number(n).toFixed(2)
}

async function sendBookingPaidCustomerEmail(booking){
  if (!booking || !booking.email) return false
  if (!isEmailConfigured()) {
    console.log('Email not sent: SMTP configuration missing')
    return false
  }
  const to = booking.email
  const subject = 'Booking confirmed - Center Stays Apartments'
  const text = `Booking number: ${booking.bookingNumber} - Your payment was received and your booking is confirmed.`
  const html = `<p>${text}</p>`
  const result = await sendMail({ from: process.env.EMAIL_FROM, to, subject, text, html })
  if (result && result.ok) return true
  console.error('[Email] booking paid customer send failed', { to, subject, error: result && result.error, code: result && result.code })
  return false
}

async function sendBookingPaidAdminEmail(booking, payment){
  if (!process.env.ADMIN_EMAIL) {
    console.log('Email not sent: ADMIN_EMAIL missing')
    return false
  }
  if (!isEmailConfigured()) {
    console.log('Email not sent: SMTP configuration missing')
    return false
  }

  const to = process.env.ADMIN_EMAIL
  const subject = 'New paid booking - Center Stays Apartments'

  const roomObj = booking.room || {}
  const roomName = (roomObj && roomObj.name) ? roomObj.name : (booking.roomName || (roomObj && roomObj.toString && roomObj.toString()) || 'N/A')
  const roomId = (roomObj && roomObj._id) ? roomObj._id : (booking.room ? booking.room : '')

  const addons = booking.addons || {}

  const html = `
    <h3>New paid booking</h3>
    <table border="0" cellpadding="4" cellspacing="0">
      <tr><td><strong>Booking status</strong></td><td>paid</td></tr>
      <tr><td><strong>Payment status</strong></td><td>${payment.status}</td></tr>
      <tr><td><strong>Booking number</strong></td><td>${booking.bookingNumber}</td></tr>
      <tr><td><strong>Customer</strong></td><td>${booking.firstName} ${booking.lastName}</td></tr>
      <tr><td><strong>Customer email</strong></td><td>${booking.email}</td></tr>
      <tr><td><strong>Customer phone</strong></td><td>${booking.phone}</td></tr>
      <tr><td><strong>Room name</strong></td><td>${roomName}</td></tr>
      <tr><td><strong>Room ID</strong></td><td>${roomId}</td></tr>
      <tr><td><strong>Check-in</strong></td><td>${formatDate(booking.checkInDate)}</td></tr>
      <tr><td><strong>Check-out</strong></td><td>${formatDate(booking.checkOutDate)}</td></tr>
      <tr><td><strong>Nights</strong></td><td>${booking.nights}</td></tr>
      <tr><td><strong>Guests</strong></td><td>${booking.guests}</td></tr>
      <tr><td><strong>Base price per night</strong></td><td>${roomObj && roomObj.basePricePerNight ? safeNumber(roomObj.basePricePerNight) : ''}</td></tr>
      <tr><td><strong>Addons</strong></td><td>
        Breakfast: ${addons.breakfast ? 'Yes' : 'No'}<br/>
        Lunch: ${addons.lunch ? 'Yes' : 'No'}<br/>
        Dinner: ${addons.dinner ? 'Yes' : 'No'}<br/>
        Airport transport: ${addons.airportTransport ? 'Yes' : 'No'}<br/>
        Rent car Golf 7: ${addons.rentCarGolf7 ? 'Yes' : 'No'}
      </td></tr>
      <tr><td><strong>Total amount</strong></td><td>${safeNumber(booking.pricing?.totalAmount)} EUR</td></tr>
      <tr><td><strong>Payment provider</strong></td><td>${payment.provider}</td></tr>
      <tr><td><strong>Payment ID</strong></td><td>${payment._id}</td></tr>
      <tr><td><strong>Payment created</strong></td><td>${formatDate(payment.createdAt)}</td></tr>
      <tr><td><strong>Booking created</strong></td><td>${formatDate(booking.createdAt)}</td></tr>
    </table>
  `

  const result = await sendMail({ from: process.env.EMAIL_FROM, to, subject, html })
  if (result && result.ok) return true
  console.error('[Email] booking paid admin send failed', { to, subject, error: result && result.error, code: result && result.code })
  return false
}

async function sendBookingFailedCustomerEmail(booking, payment){
  if (!booking || !booking.email) return false
  if (!isEmailConfigured()) {
    console.log('Email not sent: SMTP configuration missing')
    return false
  }
  const to = booking.email
  const subject = 'Payment was not completed - Center Stays Apartments'

  const providerResp = payment && payment.rawResponse ? payment.rawResponse : {}
  const safeResp = {
    ErrorCode: providerResp.ErrorCode || providerResp.ErrorCode || '',
    ErrMsg: providerResp.ErrMsg || providerResp.Errmsg || providerResp.ErrMsg || '',
    ProcReturnCode: providerResp.ProcReturnCode || '',
    Response: providerResp.Response || providerResp.response || ''
  }

  const text = `Dear ${booking.firstName || ''},\n\nYour payment attempt for booking ${booking.bookingNumber || ''} was not completed.\n\nAmount attempted: ${safeNumber(booking.pricing?.totalAmount)} ${booking.pricing?.currency || 'EUR'}\nProvider: BKT\nStatus: Failed / Declined\nReason: ${safeResp.ErrorCode} - ${safeResp.ErrMsg} (ProcReturnCode: ${safeResp.ProcReturnCode}, Response: ${safeResp.Response})\n\nYour booking is not confirmed as paid. You may try again with another card or contact us for assistance.\n\nBest regards,\nCenter Stays Apartments`

  const html = `
    <p>Dear ${booking.firstName || ''},</p>
    <p>Your payment attempt for booking <strong>${booking.bookingNumber || ''}</strong> was not completed.</p>
    <table>
      <tr><td><strong>Apartment</strong></td><td>${(booking.room && booking.room.name) || booking.roomName || 'N/A'}</td></tr>
      <tr><td><strong>Check-in</strong></td><td>${formatDate(booking.checkInDate)}</td></tr>
      <tr><td><strong>Check-out</strong></td><td>${formatDate(booking.checkOutDate)}</td></tr>
      <tr><td><strong>Guests</strong></td><td>${booking.guests || ''}</td></tr>
      <tr><td><strong>Attempted amount</strong></td><td>${safeNumber(booking.pricing?.totalAmount)} ${booking.pricing?.currency || 'EUR'}</td></tr>
      <tr><td><strong>Provider</strong></td><td>BKT</td></tr>
      <tr><td><strong>Status</strong></td><td>Failed / Declined</td></tr>
      <tr><td><strong>Reason</strong></td><td>ErrorCode: ${safeResp.ErrorCode}<br/>ErrMsg: ${safeResp.ErrMsg}<br/>ProcReturnCode: ${safeResp.ProcReturnCode}<br/>Response: ${safeResp.Response}</td></tr>
    </table>
    <p>Your booking is not confirmed as paid. You may try again with another card or contact us for assistance.</p>
    <p>Best regards,<br/>Center Stays Apartments</p>
  `

  const result = await sendMail({ from: process.env.EMAIL_FROM, to, subject, text, html })
  if (result && result.ok) return true
  console.error('[Email] booking failed customer send failed', { to, subject, error: result && result.error, code: result && result.code })
  return false
}

async function sendBookingFailedAdminEmail(booking, payment){
  if (!process.env.ADMIN_EMAIL) {
    console.log('Email not sent: ADMIN_EMAIL missing')
    return false
  }
  if (!isEmailConfigured()) {
    console.log('Email not sent: SMTP configuration missing')
    return false
  }

  const to = process.env.ADMIN_EMAIL
  const subject = 'Payment failed booking - Center Stays Apartments'

  const roomObj = booking.room || {}
  const roomName = (roomObj && roomObj.name) ? roomObj.name : (booking.roomName || (roomObj && roomObj.toString && roomObj.toString()) || 'N/A')
  const roomId = (roomObj && roomObj._id) ? roomObj._id : (booking.room ? booking.room : '')

  const resp = payment && payment.rawResponse ? payment.rawResponse : {}
  // Safe selected response fields only
  const safeResp = {
    Response: resp.Response || resp.response || '',
    ProcReturnCode: resp.ProcReturnCode || '',
    mdStatus: resp.mdStatus || '',
    ErrMsg: resp.ErrMsg || resp.Errmsg || ''
  }

  // Additional useful provider fields if available
  const extra = {
    ErrorCode: resp.ErrorCode || '',
    traceId: resp.traceId || resp.trace_id || ''
  }

  const html = `
    <h3>Payment failed booking</h3>
    <table border="0" cellpadding="4" cellspacing="0">
      <tr><td><strong>Booking status</strong></td><td>failed</td></tr>
      <tr><td><strong>Payment status</strong></td><td>${payment.status}</td></tr>
      <tr><td><strong>Booking number</strong></td><td>${booking.bookingNumber}</td></tr>
      <tr><td><strong>Customer</strong></td><td>${booking.firstName} ${booking.lastName}</td></tr>
      <tr><td><strong>Customer email</strong></td><td>${booking.email}</td></tr>
      <tr><td><strong>Customer phone</strong></td><td>${booking.phone}</td></tr>
      <tr><td><strong>Room name</strong></td><td>${roomName}</td></tr>
      <tr><td><strong>Room ID</strong></td><td>${roomId}</td></tr>
      <tr><td><strong>Check-in</strong></td><td>${formatDate(booking.checkInDate)}</td></tr>
      <tr><td><strong>Check-out</strong></td><td>${formatDate(booking.checkOutDate)}</td></tr>
      <tr><td><strong>Nights</strong></td><td>${booking.nights}</td></tr>
      <tr><td><strong>Guests</strong></td><td>${booking.guests}</td></tr>
      <tr><td><strong>Total amount</strong></td><td>${safeNumber(booking.pricing?.totalAmount)} EUR</td></tr>
      <tr><td><strong>Payment provider</strong></td><td>${payment.provider}</td></tr>
      <tr><td><strong>Payment ID</strong></td><td>${payment._id}</td></tr>
  <tr><td><strong>Failure Response</strong></td><td>Response: ${safeResp.Response}<br/>ProcReturnCode: ${safeResp.ProcReturnCode}<br/>mdStatus: ${safeResp.mdStatus}<br/>ErrMsg: ${safeResp.ErrMsg}<br/>ErrorCode: ${extra.ErrorCode}<br/>traceId: ${extra.traceId}</td></tr>
    </table>
  `

  const result = await sendMail({ from: process.env.EMAIL_FROM, to, subject, html })
  if (result && result.ok) return true
  console.error('[Email] booking failed admin send failed', { to, subject, error: result && result.error, code: result && result.code })
  return false
}

module.exports = {
  sendBookingPaidCustomerEmail,
  sendBookingPaidAdminEmail,
  sendBookingFailedCustomerEmail,
  sendBookingFailedAdminEmail,
  // lower-level sendMail used by invoice service
  sendMail,
  isEmailConfigured,
  sendTestEmail,
  verifyTransporter
}
