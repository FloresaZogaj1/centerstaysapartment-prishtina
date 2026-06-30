const nodemailer = require('nodemailer')
const dns = require('dns')

// Attempt to prefer IPv4 on platforms that support it
try {
  if (typeof dns.setDefaultResultOrder === 'function') {
    dns.setDefaultResultOrder('ipv4first')
    console.log('[BOOT] DNS default result order set to ipv4first (server utils)')
  }
} catch (e) {}

async function sendEmail({ to, subject, html }) {
  const host = process.env.EMAIL_HOST || process.env.SMTP_HOST
  const port = process.env.EMAIL_PORT || process.env.SMTP_PORT
  const secure = String(process.env.EMAIL_SECURE || process.env.SMTP_SECURE || '').toLowerCase() === 'true'

  const transporter = nodemailer.createTransport({
    host: host,
    port: Number(port),
    secure: secure,
    auth: {
      user: process.env.EMAIL_USER || process.env.SMTP_USER,
      pass: process.env.EMAIL_PASS || process.env.SMTP_PASS
    },
    family: 4,
    tls: { servername: host },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
  })

  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER || process.env.SMTP_USER

  const info = await transporter.sendMail({ from, to, subject, html })
  return info
}

module.exports = sendEmail
