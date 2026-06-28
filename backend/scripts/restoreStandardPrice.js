require('dotenv').config()
const mongoose = require('mongoose')
const connectDB = require('../src/config/db')
const Room = require('../src/models/Room')

async function restore() {
  try {
    await connectDB()
    const res = await Room.updateOne({ name: 'Standard Apartment' }, { $set: { basePricePerNight: 120 } })
    if (!res || res.matchedCount === 0) {
      console.log('Standard Apartment not found or not updated', res)
    } else {
      console.log('Restored Standard Apartment price to 120')
    }
    process.exit(0)
  } catch (err) {
    console.error('Restore failed:', err)
    process.exit(1)
  }
}

restore()
