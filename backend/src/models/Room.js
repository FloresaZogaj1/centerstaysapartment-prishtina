const mongoose = require('mongoose')

const RoomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    basePricePerNight: { type: Number, required: true },
    maxGuests: { type: Number, default: 2 },
    imageUrl: { type: String },
    gallery: [{ type: String }],
    amenities: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Room', RoomSchema)
