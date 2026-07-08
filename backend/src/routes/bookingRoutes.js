const express = require('express')
const { calculateBookingTotalController, createBookingController, latestBookingsController } = require('../controllers/bookingController')

const router = express.Router()

router.post('/calculate', calculateBookingTotalController)
router.post('/', createBookingController)
// GET /api/bookings/latest - admin protected, returns latest 3 bookings
router.get('/latest', latestBookingsController)

module.exports = router
