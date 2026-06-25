const express = require('express')
const { createBktPayment, handleBktCallback, bktOkHandler, bktFailHandler } = require('../controllers/bktPaymentController')

const router = express.Router()

router.post('/create', createBktPayment)
router.post('/callback', handleBktCallback)
router.get('/callback', (req, res) => res.json({ message: 'BKT callback endpoint (GET) placeholder. No changes made.' }))

// BKT frontend return endpoints (BKT will redirect customers here after 3DS)
router.get('/ok', bktOkHandler)
router.post('/ok', bktOkHandler)
router.get('/fail', bktFailHandler)
router.post('/fail', bktFailHandler)

module.exports = router
