require('dotenv').config()
const email = require('./src/services/emailService')

;(async () => {
  console.log('[Email Test] starting')
  const to = process.env.ADMIN_EMAIL
  if (!to) {
    console.error('[Email Test] ADMIN_EMAIL missing')
    process.exit(2)
  }

  try {
    console.log('[Email][Brevo API] sending')
    const r = await email.sendEmailWithBrevoApi({ to, subject: 'City Center Prishtina - Brevo test', text: 'Brevo API test' })
    if (r && r.ok) {
      console.log('[Email][Brevo API] sent')
      console.log('[Email Test] completed')
      process.exit(0)
    }
    console.error('[Email][Brevo API] send failed (returned)', r)
    // If returned object includes status/response, print them
    if (r && (r.status || r.response)) {
      console.error('[Email][Brevo API] status:', r.status)
      console.error('[Email][Brevo API] response:', JSON.stringify(r.response))
    }
    process.exit(1)
  } catch (err) {
    console.error('[Email][Brevo API] send failed (exception)', { message: err && err.message })
    if (err && err.response) {
      console.error('[Email][Brevo API] error status:', err.response.status)
      console.error('[Email][Brevo API] error response:', JSON.stringify(err.response.data))
    }
    process.exit(1)
  }
})()
