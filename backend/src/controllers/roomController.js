const Room = require('../models/Room')

const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ isActive: true }).sort({ basePricePerNight: 1 })
    res.json(rooms)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const getRoomBySlug = async (req, res) => {
  try {
    const room = await Room.findOne({
      slug: req.params.slug,
      isActive: true,
    })

    if (!room) {
      return res.status(404).json({ message: 'Room not found' })
    }

    res.json(room)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = {
  getRooms,
  getRoomBySlug,
}
