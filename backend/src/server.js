require('dotenv').config()
const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const helmet = require('helmet')
const connectDB = require('./config/db')

// route placeholders
const roomRoutes = require('./routes/roomRoutes')
const bookingRoutes = require('./routes/bookingRoutes')
const paymentRoutes = require('./routes/paymentRoutes')
const bktPaymentRoutes = require('./routes/bktPaymentRoutes')
const adminRoutes = require('./routes/adminRoutes')

const app = express()

// Middleware
app.use(helmet())
app.use(express.json())
// Required for parsing form POSTS from payment gateways
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))
// Allow specific frontend origins (production and local dev). Do NOT allow '*'.
// Includes runtime value from process.env.FRONTEND_URL plus explicit production URLs and local dev URLs.
const allowedOrigins = [
	process.env.FRONTEND_URL,
	'https://centerstays.apartments',
	'https://centerstaysapartments-prishtina.netlify.app',
	'http://localhost:5173',
	'http://localhost:3001',
].filter(Boolean)

app.use(cors({
	origin: function (origin, callback) {
		if (!origin) return callback(null, true)

		if (allowedOrigins.includes(origin)) {
			return callback(null, true)
		}

		return callback(new Error('Not allowed by CORS'))
	},
	credentials: true,
}))

// Connect DB
connectDB()

// Routes
app.use('/api/rooms', roomRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/payments', paymentRoutes)
// BKT / NestPay routes
app.use('/api/payments/bkt', bktPaymentRoutes)
app.use('/api/admin', adminRoutes)

app.get('/health', (req, res) => res.json({ ok: true }))

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server listening on ${PORT}`))
