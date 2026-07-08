require('dotenv').config()
const connectDB = require('../src/config/db')
const Room = require('../src/models/Room')
;(async()=>{
  await connectDB()
  const rooms = await Room.find({}).select('name imageUrl gallery').lean()
  console.log(JSON.stringify(rooms,null,2))
  process.exit(0)
})().catch(e=>{ console.error(e); process.exit(1) })
