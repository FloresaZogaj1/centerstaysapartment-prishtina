const nodemailer = require('nodemailer')

const requiredEnv = ['SMTP_HOST','SMTP_PORT','SMTP_USER','SMTP_PASS','EMAIL_FROM']

function smtpConfigured() {
  return requiredEnv.every(k => !!process.env[k])
}

function createTransporter(){
  if (!smtpConfigured()) return null
  const secure = String(process.env.SMTP_SECURE || 'false') === 'true'
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  })
}

async function sendMail(opts){
  const transporter = createTransporter()
  if (!transporter) {
    console.log('Email not sent: SMTP configuration missing')
    return false
  }
  try {
    const info = await transporter.sendMail(opts)
    return info
  } catch (err) {
    console.error('Email send failed', err && err.message ? err.message : err)
    return false
  }
}

function isEmailConfigured(){
  return smtpConfigured()
}

async function sendTestEmail(to){
  if (!isEmailConfigured()) {
    console.log('Email not sent: SMTP configuration missing')
    return false
  }
  const subject = 'City Center Prishtina - SMTP test'
  const text = 'SMTP email delivery is configured correctly.'
  const result = await sendMail({ from: process.env.EMAIL_FROM, to, subject, text })
  return !!result
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
  return !!result
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
  return !!result
}

async function sendBookingFailedCustomerEmail(booking){
  if (!booking || !booking.email) return false
  if (!isEmailConfigured()) {
    console.log('Email not sent: SMTP configuration missing')
    return false
  }
  const to = booking.email
  const subject = 'Payment failed - Center Stays Apartments'
  const text = `Booking number: ${booking.bookingNumber} - Your payment was not completed. Please try again or contact us.`
  const html = `<p>${text}</p>`
  const result = await sendMail({ from: process.env.EMAIL_FROM, to, subject, text, html })
  return !!result
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
    ErrMsg: resp.ErrMsg || ''
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
      <tr><td><strong>Failure Response</strong></td><td>Response: ${safeResp.Response}<br/>ProcReturnCode: ${safeResp.ProcReturnCode}<br/>mdStatus: ${safeResp.mdStatus}<br/>ErrMsg: ${safeResp.ErrMsg}</td></tr>
    </table>
  `

  const result = await sendMail({ from: process.env.EMAIL_FROM, to, subject, html })
  return !!result
}

module.exports = {
  sendBookingPaidCustomerEmail,
  sendBookingPaidAdminEmail,
  sendBookingFailedCustomerEmail,
  sendBookingFailedAdminEmail,
  isEmailConfigured,
  sendTestEmail
}
