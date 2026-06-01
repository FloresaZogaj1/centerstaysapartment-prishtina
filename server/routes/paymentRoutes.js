const express = require('express')
const router = express.Router()
const paymentController = require('../controllers/paymentController')

router.post('/bkt/create', paymentController.createBkt)
router.post('/bkt/callback', paymentController.callbackBkt)
router.get('/bkt/success', paymentController.success)
router.get('/bkt/fail', paymentController.fail)

module.exports = router
