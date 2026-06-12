const mongoose = require('mongoose')

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI
    if (!uri) throw new Error('MONGODB_URI not defined in .env')
    const conn = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    console.log(`MongoDB connected: ${conn.connection.host}`)
  } catch (err) {
    console.error(`Error connecting MongoDB: ${err.message}`)
    process.exit(1)
  }
}

module.exports = connectDB
