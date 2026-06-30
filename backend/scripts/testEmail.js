require('dotenv').config()
const path = require('path')
const emailService = require('../src/services/emailService')

async function run() {
  console.log('[Email Test] starting')
  const admin = process.env.ADMIN_EMAIL
  if (!admin) {
    console.error('[Email Test] ADMIN_EMAIL not set in environment')
    process.exit(2)
  }

  console.log('[Email Test] sending test email to', admin)
  try {
    const ok = await emailService.sendTestEmail(admin)
    if (ok) {
      console.log('[Email] sent')
      console.log('[Email Test] completed')
      process.exit(0)
    } else {
      console.error('[Email Test] SMTP not configured or sendTestEmail returned false')
      process.exit(3)
    }
  } catch (err) {
    console.error('[Email Test] failed with error', {
      message: err && err.message,
      code: err && err.code,
      command: err && err.command
    })
    process.exit(1)
  }
}

run()
