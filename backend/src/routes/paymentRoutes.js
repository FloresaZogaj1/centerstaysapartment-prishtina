const express = require('express')
const { createBankartPayment } = require('../controllers/paymentController')

const router = express.Router()

router.post('/bankart/create', createBankartPayment)
router.post('/bankart/callback', require('../controllers/paymentController').bankartCallback)

module.exports = router
