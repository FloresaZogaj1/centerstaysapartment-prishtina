require('dotenv').config()
const mongoose = require('mongoose')
const connectDB = require('../src/config/db')
const Room = require('../src/models/Room')

async function update() {
  try {
    await connectDB()
    const res = await Room.findOneAndUpdate({ name: 'Standard Apartment' }, { $set: { basePricePerNight: 20 } }, { new: true })
    if (!res) {
      console.log('Standard Apartment not found')
    } else {
      console.log('Updated Standard Apartment price to', res.basePricePerNight)
    }
    process.exit(0)
  } catch (err) {
    console.error('Update failed:', err)
    process.exit(1)
  }
}

update()
