const express = require('express')
const { createBankartPayment } = require('../controllers/paymentController')
const { latestPaymentsController } = require('../controllers/paymentController')

const router = express.Router()

router.post('/bankart/create', createBankartPayment)
router.post('/bankart/callback', require('../controllers/paymentController').bankartCallback)
// GET /api/payments/latest - admin protected
router.get('/latest', latestPaymentsController)

module.exports = router
