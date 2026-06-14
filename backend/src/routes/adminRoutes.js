const express = require('express')
const router = express.Router()
const emailService = require('../services/emailService')

// POST /api/admin/test-email
router.post('/test-email', async (req, res) => {
  const apiKey = req.headers['x-admin-api-key']
  if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const { to } = req.body || {}
  if (!to) return res.status(400).json({ message: 'Missing "to" in body' })

  if (!emailService.isEmailConfigured()) {
    console.log('SMTP configuration missing')
    return res.status(400).json({ message: 'SMTP configuration missing.' })
  }

  try {
    const ok = await emailService.sendTestEmail(to)
    if (!ok) return res.status(500).json({ message: 'Failed to send test email.' })
    return res.status(200).json({ message: 'Test email sent.' })
  } catch (err) {
    console.error('Test email failed:', err && err.message ? err.message : err)
    return res.status(500).json({ message: 'Failed to send test email.' })
  }
})

module.exports = router
