const mongoose = require('mongoose')

const connectDB = async () => {
  try {
    // Prefer MONGO_URI (used in Render and other hosts), fall back to MONGODB_URI for local compatibility
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI
    if (!uri) throw new Error('MONGO_URI or MONGODB_URI not defined in environment')
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
