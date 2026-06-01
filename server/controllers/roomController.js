const RoomType = require('../models/RoomType')
const asyncHandler = require('express-async-handler')

exports.getAll = asyncHandler(async (req, res) => {
  const rooms = await RoomType.find({ isActive: true })
  res.json(rooms)
})

exports.getById = asyncHandler(async (req, res) => {
  const room = await RoomType.findById(req.params.id)
  if (!room) return res.status(404).json({ message: 'RoomType not found' })
  res.json(room)
})
