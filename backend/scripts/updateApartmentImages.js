require('dotenv').config()
const fs = require('fs')
const path = require('path')
const connectDB = require('../src/config/db')
const Room = require('../src/models/Room')

const publicDir = path.resolve(__dirname, '..', '..', 'public')
const exts = ['.jpeg', '.jpg', '.png', '.avif', '.webp']

function listImages(dir) {
  const res = []
  function walk(d, rel = ''){
    const items = fs.readdirSync(d)
    for (const it of items){
      const full = path.join(d, it)
      const stat = fs.statSync(full)
      if (stat.isDirectory()){
        walk(full, path.join(rel, it))
      } else {
        const e = path.extname(it).toLowerCase()
        if (exts.includes(e)) res.push({ name: it, rel: path.join(rel, it).replace(/\\/g,'/') })
      }
    }
  }
  walk(dir)
  return res
}

function ensurePublicPath(p){
  if (!p) return false
  const fp = path.join(publicDir, p.replace(/^\//,'').replace(/\//g, path.sep))
  return fs.existsSync(fp)
}

async function run(){
  const dry = process.argv.includes('--dry-run')
  console.log('[updateImages] scanning public folder for images...')
  const imgs = listImages(publicDir)
  const byName = imgs.reduce((acc,i)=>{ acc[i.rel]=true; return acc }, {})

  console.log('[updateImages] total images found in public:', imgs.length)

  await connectDB()
  console.log('[updateImages] connected to DB')

  const rooms = await Room.find({}).sort({ name: 1 }).lean()
  const roomMap = {}
  rooms.forEach(r => { roomMap[r.name] = r })

  // Keep existing images for the original 3
    // preserve existing images for the original 3, but replace missing mains with safe existing files
    const keepNames = ['Standard Apartment','Deluxe Apartment','Premium City Stay']
    // replacements to ensure no broken mains in production
    const replacements = {
      'Standard Apartment': '/apartment1.jpeg',
      'Deluxe Apartment': '/apartment15.jpeg',
      'Premium City Stay': '/apartment13.jpeg'
    }

  // Gather candidate main images: prefer files named apartmentX.jpeg in public root or subfolders
  const apartmentImgs = imgs.filter(i => /apartment\d+\./i.test(path.basename(i.rel)))
  // sort by the number in filename if present
  apartmentImgs.sort((a,b)=>{
    const na = Number((path.basename(a.rel).match(/apartment(\d+)/i)||[])[1]||0)
    const nb = Number((path.basename(b.rel).match(/apartment(\d+)/i)||[])[1]||0)
    return na - nb
  })

  // also collect foto images
  const fotoImgs = imgs.filter(i => /foto/i.test(i.name))

  // Build assignment list for City Apartment 04..30
  const targetRooms = rooms.filter(r => r.name.startsWith('City Apartment'))
  // sort by numeric index
  targetRooms.sort((a,b)=>{
    const na = Number((a.name.match(/City Apartment (\d+)/)||[])[1]||0)
    const nb = Number((b.name.match(/City Apartment (\d+)/)||[])[1]||0)
    return na-nb
  })

  // prepare candidate main paths, prefer unique filenames
  const mainCandidates = apartmentImgs.map(i=> '/' + i.rel)
  // fallback to living/bedroom/kitchen/bathroom files if needed
  const otherCandidates = imgs.map(i=> '/' + i.rel).filter(p=>!mainCandidates.includes(p))

  // create mapping ensuring unique main images where possible
  const mapping = {}
  const usedMain = new Set()

  // preserve existing main images for keepNames
    // preserve existing main images for keepNames, but apply replacements if original mains are missing
    for (const name of keepNames){
      if (roomMap[name]){
        const currentMain = roomMap[name].imageUrl || null
        // if replacement exists, use it; otherwise keep current
        const replacement = replacements[name]
        const chosenMain = replacement || currentMain
        mapping[name] = { old: currentMain, newMain: chosenMain, gallery: roomMap[name].gallery || [] }
        if (chosenMain) usedMain.add(chosenMain)
      }
    }

  // assign mains for city apartments
  let mcIndex = 0
  for (const r of targetRooms){
    // skip if already has a reasonable image that's unique
    const current = r.imageUrl
    if (current && !usedMain.has(current) && ensurePublicPath(current)){
      mapping[r.name] = { old: current, newMain: current, gallery: r.gallery || [] }
      usedMain.add(current)
      continue
    }
    // find next unused mainCandidate
    let chosen = null
    while (mcIndex < mainCandidates.length){
      const cand = mainCandidates[mcIndex++]
      if (!usedMain.has(cand) && ensurePublicPath(cand)) { chosen = cand; break }
    }
    if (!chosen){
      // try other candidates
      for (const c of otherCandidates){ if (!usedMain.has(c) && ensurePublicPath(c)){ chosen = c; break } }
    }
    if (!chosen){
      // fallback to foto1.avif
      chosen = fotoImgs.length>0 ? '/' + fotoImgs[0].rel : null
    }
    mapping[r.name] = { old: r.imageUrl || null, newMain: chosen, gallery: [] }
    if (chosen) usedMain.add(chosen)
  }

  // Build galleries: include main + up to 5 additional images (prefer foto*, then otherCandidates)
  const allFotos = fotoImgs.map(i=> '/' + i.rel)
  const remainingOthers = otherCandidates.slice()

  for (const name of Object.keys(mapping)){
    const m = mapping[name]
    const gallery = []
    if (m.newMain) gallery.push(m.newMain)
    // pick up to 5 more unique images
    // try fotos first
    for (const f of allFotos){ if (gallery.length>=6) break; if (!gallery.includes(f)) gallery.push(f) }
    for (const o of remainingOthers){ if (gallery.length>=6) break; if (!gallery.includes(o)) gallery.push(o) }
    m.gallery = gallery
  }

  // Validation: check duplicates among newMain
  const dupMap = {}
  for (const [name, val] of Object.entries(mapping)){
    const m = val.newMain
    if (!m) continue
    dupMap[m] = dupMap[m] ? dupMap[m].concat(name) : [name]
  }
  const duplicates = Object.entries(dupMap).filter(([k,v])=>v.length>1)

  // Validation: missing files
  const missing = []
  for (const [name,val] of Object.entries(mapping)){
    if (!val.newMain || !ensurePublicPath(val.newMain)) missing.push({ name, path: val.newMain })
    for (const g of val.gallery){ if (!ensurePublicPath(g)) missing.push({ name, path: g }) }
  }

  // Print dry-run summary
  console.log('[updateImages] roomsChecked:', rooms.length)
  const updates = Object.entries(mapping).filter(([n,v])=> v.old !== v.newMain || (v.gallery && v.gallery.length && JSON.stringify(v.gallery) !== JSON.stringify((roomMap[n]&&roomMap[n].gallery)||[])))
  console.log('[updateImages] roomsToUpdate:', updates.length)
  console.log('[updateImages] duplicateMainImages:', duplicates.length)
  if (duplicates.length>0) console.log('[updateImages] duplicates detail:', JSON.stringify(duplicates,null,2))
  console.log('[updateImages] missingFiles:', missing.length)
  if (missing.length>0) console.log('[updateImages] missing detail (first 10):', JSON.stringify(missing.slice(0,10),null,2))

  // Print per-room before/after
  for (const [name,val] of Object.entries(mapping)){
    console.log(`${name}: old -> ${val.old} ; newMain -> ${val.newMain}; gallery -> ${JSON.stringify(val.gallery)}`)
  }

  if (dry){
    console.log('[updateImages] dry-run complete. No DB changes made.')
    process.exit(0)
  }

  // Enforce that no missing files exist before applying changes in real run
  if (missing.length > 0) {
    console.error('[updateImages] Aborting: missing image files detected. Fix the missing files or update mapping before running without --dry-run.')
    console.error('[updateImages] Missing details:', JSON.stringify(missing.slice(0,20), null, 2))
    process.exit(2)
  }

  // Apply updates to DB
  let applied = 0
  for (const [name,val] of Object.entries(mapping)){
    if (!roomMap[name]) continue
    try{
      await Room.updateOne({ name }, { $set: { imageUrl: val.newMain, gallery: val.gallery } })
      applied++
      console.log('[updateImages] applied', name)
    }catch(e){ console.error('[updateImages] error applying for', name, e && e.message?e.message:e) }
  }
  console.log('[updateImages] appliedCount', applied)
  process.exit(0)
}

run().catch(e=>{ console.error('[updateImages] runner error', e && e.message?e.message:e); process.exit(1) })
