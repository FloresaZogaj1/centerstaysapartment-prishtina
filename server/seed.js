require('dotenv').config()
const connectDB = require('./config/db')
const RoomType = require('./models/RoomType')

async function seed() {
  await connectDB()
  await RoomType.deleteMany({})

  const types = [
    { name: 'Villa Standard', slug: 'villa-standard-120', pricePerNight: 120, totalRooms: 4, unitNumbers: ['120-1','120-2','120-3','120-4'], description: 'Standard villa', images: [] },
    { name: 'Villa Deluxe', slug: 'villa-deluxe-150', pricePerNight: 150, totalRooms: 6, unitNumbers: ['150-1','150-2','150-3','150-4','150-5','150-6'], description: 'Deluxe villa', images: [] },
    { name: 'Villa Premium', slug: 'villa-premium-190', pricePerNight: 190, totalRooms: 20, unitNumbers: Array.from({length:20}).map((_,i)=>`190-${i+1}`), description: 'Premium villa', images: [] }
  ]

  for (const t of types) {
    await RoomType.create(t)
  }
  console.log('Seeded RoomTypes')
  process.exit(0)
}

seed().catch(e=>{console.error(e);process.exit(1)})
