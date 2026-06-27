require('dotenv').config()
const mongoose = require('mongoose')
const connectDB = require('./config/db')
const Room = require('./models/Room')

async function seed() {
  try {
    await connectDB()

    // Clear existing rooms
    await Room.deleteMany({})

    const rooms = [
      {
        name: 'Standard Apartment',
        slug: 'standard-apartment',
        description: 'Zgjidhje praktike dhe komode për qëndrime të shkurtra në qytet.',
        basePricePerNight: 20,
        maxGuests: 2,
        imageUrl: '/images/standard-apartment.jpg',
        amenities: ['1 dhomë gjumi', 'Wi-Fi', 'Kuzhinë e vogël', 'Banjo private'],
      },
      {
        name: 'Deluxe Apartment',
        slug: 'deluxe-apartment',
        description: 'Apartament më i gjerë me dizajn modern dhe më shumë rehati.',
        basePricePerNight: 150,
        maxGuests: 2,
        imageUrl: '/images/deluxe-apartment.jpg',
        amenities: ['1-2 dhoma', 'Ambient i ndriçuar', 'Kuzhinë', 'TV'],
      },
      {
        name: 'Premium City Stay',
        slug: 'premium-city-stay',
        description: 'Qëndrim premium në lokacion qendror për eksperiencë më të kompletuar.',
        basePricePerNight: 190,
        maxGuests: 2,
        imageUrl: '/images/premium-city-stay.jpg',
        amenities: ['Pamje qyteti', 'Hapësirë më e madhe', 'Stil modern', 'Pajisje të plota'],
      },
    ]

    const inserted = await Room.insertMany(rooms)
    console.log(`Inserted ${inserted.length} rooms`) // expected 3

    process.exit(0)
  } catch (err) {
    console.error('Seed error:', err)
    process.exit(1)
  }
}

seed()
