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
  return transporter.sendMail(opts)
}

function isEmailConfigured(){
  return smtpConfigured()
}

async function sendTestEmail(to){
  if (!isEmailConfigured()) return false
  const subject = 'City Center Prishtina - SMTP test'
  const text = 'SMTP email delivery is configured correctly.'
  return sendMail({ from: process.env.EMAIL_FROM, to, subject, text })
}

async function sendBookingPaidCustomerEmail(booking){
  const to = booking.email
  const subject = 'Booking confirmed - City Center Prishtina'
  const body = `Booking number: ${booking.bookingNumber}\nCustomer: ${booking.firstName} ${booking.lastName}\nCheck-in: ${booking.checkInDate}\nCheck-out: ${booking.checkOutDate}\nNights: ${booking.nights}\nGuests: ${booking.guests}\nTotal: ${booking.pricing?.totalAmount || ''} EUR\n\nYour payment was received and your booking is confirmed.`
  return sendMail({ from: process.env.EMAIL_FROM, to, subject, text: body })
}

async function sendBookingPaidAdminEmail(booking, payment){
  const to = process.env.ADMIN_EMAIL
  const subject = 'New paid booking - City Center Prishtina'
  const room = booking.roomName || booking.room || 'N/A'
  const body = `Booking number: ${booking.bookingNumber}\nCustomer: ${booking.firstName} ${booking.lastName}\nEmail: ${booking.email}\nPhone: ${booking.phone}\nRoom: ${room}\nCheck-in: ${booking.checkInDate}\nCheck-out: ${booking.checkOutDate}\nNights: ${booking.nights}\nGuests: ${booking.guests}\nTotal: ${booking.pricing?.totalAmount || ''} EUR\nAddons: ${JSON.stringify(booking.addons || {})}\nPayment status: ${payment.status}`
  return sendMail({ from: process.env.EMAIL_FROM, to, subject, text: body })
}

async function sendBookingFailedCustomerEmail(booking){
  const to = booking.email
  const subject = 'Payment failed - City Center Prishtina'
  const body = `Booking number: ${booking.bookingNumber}\nYour payment was not completed. Please try again or contact us.`
  return sendMail({ from: process.env.EMAIL_FROM, to, subject, text: body })
}

async function sendBookingFailedAdminEmail(booking, payment){
  const to = process.env.ADMIN_EMAIL
  const subject = 'Payment failed booking - City Center Prishtina'
  const body = `Booking number: ${booking.bookingNumber}\nCustomer: ${booking.firstName} ${booking.lastName}\nEmail: ${booking.email}\nPhone: ${booking.phone}\nTotal: ${booking.pricing?.totalAmount || ''} EUR\nPayment status: ${payment.status}`
  return sendMail({ from: process.env.EMAIL_FROM, to, subject, text: body })
}

module.exports = {
  sendBookingPaidCustomerEmail,
  sendBookingPaidAdminEmail,
  sendBookingFailedCustomerEmail,
  sendBookingFailedAdminEmail
  , isEmailConfigured, sendTestEmail
}
