const mongoose = require('mongoose')

const RoomTypeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  pricePerNight: { type: Number, required: true },
  totalRooms: { type: Number, required: true },
  unitNumbers: [{ type: String }],
  description: { type: String },
  images: [{ type: String }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true })

module.exports = mongoose.model('RoomType', RoomTypeSchema)
