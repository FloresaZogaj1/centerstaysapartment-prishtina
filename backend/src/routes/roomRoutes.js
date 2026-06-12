const express = require('express')
const { getRooms, getRoomBySlug } = require('../controllers/roomController')

const router = express.Router()

router.get('/', getRooms)
router.get('/:slug', getRoomBySlug)

module.exports = router
