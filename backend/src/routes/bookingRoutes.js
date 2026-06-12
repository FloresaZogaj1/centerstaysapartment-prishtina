const express = require('express')
const { calculateBookingTotalController, createBookingController } = require('../controllers/bookingController')

const router = express.Router()

router.post('/calculate', calculateBookingTotalController)
router.post('/', createBookingController)

module.exports = router
