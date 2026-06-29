#!/usr/bin/env node
// Add apartments idempotently to Room collection
// Usage:
//  node addApartments.js --dry-run
//  node addApartments.js

require('dotenv').config()
const connectDB = require('../src/config/db')
const Room = require('../src/models/Room')

const apartments = []

// Existing 3 are kept; we'll add 27 more named City Apartment 04..30
const basePrices = {
  standard: 120,
  deluxe: 150,
  premium: 190
}

function makeName(i){
  return `City Apartment ${String(i).padStart(2,'0')}`
}

// Prepare image mapping from public folder
// We'll use /apartmentX.jpeg for main image when exists and foto*.avif as gallery extras
const availableMain = [1,2,3,4,5,6,7,8,9,10,12,13,15,16,17,19]
const availableFotos = ['foto1.avif','foto2.avif','foto4.avif','foto6.avif','foto7.avif','foto8.avif','foto9.avif','foto10.avif','foto11.avif','foto99.avif']
// Ensure original three mains map to valid public images on fresh installs
const replacements = {
  'Standard Apartment': '/apartment1.jpeg',
  'Deluxe Apartment': '/apartment15.jpeg',
  'Premium City Stay': '/apartment13.jpeg'
}

for (let i = 4; i <= 30; i++){
  const name = makeName(i)
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')
  // assign category by index
  const category = (i % 3 === 1) ? 'premium' : (i % 3 === 2) ? 'deluxe' : 'standard'
  const price = basePrices[category]
  const mainIndex = (i <= 19 && availableMain.includes(i)) ? i : ((i%19)+1)
  const imageUrl = `/apartment${mainIndex}.jpeg`
  const gallery = [imageUrl].concat(availableFotos.map(f => `/${f}`))
  const apt = {
    name,
    slug,
    description: (category === 'standard') ? 'Zgjedhje praktike dhe komode për qëndrime të shkurtra në qytet.' : (category === 'deluxe') ? 'Apartament modern me ambient të ndriçuar dhe hapësirë të rehatshme.' : 'Qëndrim premium në lokacion qendror me komoditet të plotë.',
    basePricePerNight: price,
    maxGuests: 2,
    imageUrl,
    gallery,
    amenities: ['Wi-Fi','Kuzhinë','Banjo private','TV'],
    isActive: true
  }
  apartments.push(apt)
}

async function run(){
  const dry = process.argv.includes('--dry-run')
  await connectDB()
  console.log('[addApartments] connected to DB')
  let inserted = 0
  let updated = 0
  for (const a of apartments){
    console.log('[addApartments] processing', a.name)
    const existing = await Room.findOne({ name: a.name })
    if (existing){
      console.log('[addApartments] exists - skipping insert for', a.name)
      // Optionally update safe fields if you want to sync images/prices (commented)
      // await Room.updateOne({ name: a.name }, { $set: { imageUrl: a.imageUrl, gallery: a.gallery, basePricePerNight: a.basePricePerNight } })
      updated++
      continue
    }
    if (dry){
      console.log('[addApartments] dry-run - would insert', a.name)
      inserted++
      continue
    }
    try{
      await Room.updateOne({ name: a.name }, { $setOnInsert: a }, { upsert: true })
      console.log('[addApartments] inserted', a.name)
      inserted++
    } catch (e){
      console.error('[addApartments] error inserting', a.name, e && e.message ? e.message : e)
    }
  }
  console.log('[addApartments] completed', { inserted, updated, total: apartments.length + updated })
  process.exit(0)
}

run().catch(e => { console.error('[addApartments] runner error', e); process.exit(1) })
