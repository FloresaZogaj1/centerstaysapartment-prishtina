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
// Capture raw request body for webhook signature verification
app.use(express.json({
	verify: (req, res, buf) => {
		try {
			req.rawBody = buf && buf.toString && buf.toString('utf8')
		} catch (e) {
			req.rawBody = undefined
		}
	}
}))
// Required for parsing form POSTS from payment gateways
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))
// Allow specific frontend origins (production and local dev) and payment provider origins
const allowedOrigins = [
	process.env.FRONTEND_URL,
	'https://centerstays.apartments',
	'https://www.centerstays.apartments',
	'https://centerstaysapartments-prishtina.netlify.app',
	'http://localhost:5173',
	'http://localhost:3000',
	// Payment gateway origins
	'https://pgw.bkt-ks.com',
	'https://gateway.bankart.si'
].filter(Boolean)

app.use(cors({
	origin: function (origin, callback) {
		// 1) Allow requests with no Origin header (typically server-to-server or redirects from payment gateways)
		if (!origin) return callback(null, true)

		// 2) Allow known origins
		if (allowedOrigins.includes(origin)) {
			return callback(null, true)
		}

		// 3) Not allowed — log safely and return an error for browser clients
		console.warn('[CORS] blocked origin:', origin)
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
