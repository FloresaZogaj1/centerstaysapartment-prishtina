const express = require('express')
const router = express.Router()
const emailService = require('../services/emailService')

// POST /api/admin/test-email
router.post('/test-email', async (req, res) => {
  try {
    const apiKey = req.headers['x-admin-api-key']
    if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const { to } = req.body || {}
    if (!to) return res.status(400).json({ message: 'Missing recipient email.' })

    // SMTP missing -> return 400
    if (!emailService.isEmailConfigured()) {
      console.log('SMTP configuration missing')
      return res.status(400).json({ message: 'SMTP configuration missing.' })
    }

    try {
      const result = await emailService.sendTestEmail(to)
      // sendTestEmail returns true when sent, false when SMTP missing
      if (result === true) return res.status(200).json({ message: 'Test email sent.' })
      if (result === false) return res.status(400).json({ message: 'SMTP configuration missing.' })
      // otherwise treat as server error
      return res.status(500).json({ message: 'Failed to send test email.' })
    } catch (err) {
      console.error('Test email failed:', err && err.message ? err.message : err)
      return res.status(500).json({ message: 'Failed to send test email.' })
    }
  } catch (err) {
    console.error('Admin test-email handler error:', err && err.message ? err.message : err)
    return res.status(500).json({ message: 'Internal server error.' })
  }
})

module.exports = router
