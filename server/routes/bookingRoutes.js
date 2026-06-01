const express = require('express')
const router = express.Router()
const controller = require('../controllers/bookingController')

router.post('/quote', controller.quote)
router.post('/', controller.create)
router.get('/', controller.list)
router.get('/:id', controller.get)
router.get('/admin/all', controller.adminAll)
router.patch('/:id/status', controller.updateStatus)

module.exports = router
