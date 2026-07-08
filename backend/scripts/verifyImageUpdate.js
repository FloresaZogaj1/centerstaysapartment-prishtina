require('dotenv').config()
const connectDB = require('../src/config/db')
const Room = require('../src/models/Room')
const fs = require('fs')
const path = require('path')

;(async()=>{
  await connectDB()
  const rooms = await Room.find({}).select('name imageUrl gallery').lean()
  console.log('TOTAL_ROOMS', rooms.length)
  const missing = []
  const mainCounts = {}
  const publicDir = path.resolve(__dirname, '..', '..', 'public')
  function exists(p){
    if(!p) return false
    const fp = path.join(publicDir, p.replace(/^\//,'').replace(/\//g,path.sep))
    return fs.existsSync(fp)
  }
  for(const r of rooms){
    if(!r.imageUrl) missing.push({ name: r.name, reason: 'no main image' })
    if(!r.gallery || !Array.isArray(r.gallery) || r.gallery.length===0) missing.push({ name: r.name, reason: 'no gallery' })
    if(r.imageUrl){ mainCounts[r.imageUrl] = (mainCounts[r.imageUrl]||0)+1 }
    if(r.imageUrl && !exists(r.imageUrl)) missing.push({ name: r.name, reason: 'main missing file', path: r.imageUrl })
    for(const g of (r.gallery||[])) if(!exists(g)) missing.push({ name: r.name, reason: 'gallery missing file', path: g })
  }
  console.log('ROOMS_WITHOUT_IMAGE_OR_GALLERY', missing.length)
  if(missing.length>0) console.log('MISSING_DETAIL', JSON.stringify(missing.slice(0,20),null,2))
  const dups = Object.entries(mainCounts).filter(([p,c])=>c>1)
  console.log('DUPLICATE_MAIN_IMAGES_COUNT', dups.length)
  if(dups.length>0) console.log('DUPS', JSON.stringify(dups.slice(0,20),null,2))
  process.exit(0)
})().catch(e=>{ console.error(e); process.exit(1) })
