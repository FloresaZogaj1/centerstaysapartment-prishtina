const nodemailer = require('nodemailer')

async function sendEmail({ to, subject, html }) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  })

  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER

  const info = await transporter.sendMail({ from, to, subject, html })
  return info
}

module.exports = sendEmail
