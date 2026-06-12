const express = require('express')
const { createBktPayment, handleBktCallback } = require('../controllers/bktPaymentController')

const router = express.Router()

router.post('/create', createBktPayment)
router.post('/callback', handleBktCallback)
router.get('/callback', (req, res) => res.json({ message: 'BKT callback endpoint (GET) placeholder. No changes made.' }))

module.exports = router
