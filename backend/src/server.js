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
app.listen(PORT, () => {
	try { console.log(`Server listening on ${PORT}`) } catch (e) {}
	// Boot marker for verifying deployed instances contain BKT logging changes
	try { console.log('[BOOT] BKT provider-values logging version active') } catch (e) {}
	// Boot marker for Bankart immediate-OK/refund-safe callback version
	try { console.log('[BOOT] Bankart callback immediate-OK refund-safe version active') } catch (e) {}
	// Boot marker for payment result notifications
	try { console.log('[BOOT] Payment result notification automation active') } catch (e) {}
	try {
		const emailService = require('./services/emailService')
		console.log('[BOOT] Notification service wiring active - emailConfigured=', emailService.isEmailConfigured())
		console.log('[BOOT] Email config', {
			smtpHost: process.env.SMTP_HOST || process.env.EMAIL_HOST || null,
			smtpPort: process.env.SMTP_PORT || process.env.EMAIL_PORT || null,
			smtpSecure: process.env.SMTP_SECURE || process.env.EMAIL_SECURE || null,
			smtpUserExists: !!(process.env.SMTP_USER || process.env.EMAIL_USER || process.env.GMAIL_USER),
			smtpPassExists: !!(process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.GMAIL_PASS),
			adminEmailExists: !!process.env.ADMIN_EMAIL
		})
		// Safe Bankart / NLB config boot log (do NOT print secrets)
		try {
			console.log('[BOOT] Bankart config', {
				mode: process.env.NLB_BANKART_MODE,
				postUrlHost: process.env.NLB_BANKART_POST_URL ? (function () { try { return new URL(process.env.NLB_BANKART_POST_URL).host } catch (e) { return null } })() : null,
				apiKeyExists: !!process.env.NLB_BANKART_API_KEY,
				sharedSecretExists: !!process.env.NLB_BANKART_SHARED_SECRET,
				publicIntegrationKeyExists: !!process.env.NLB_BANKART_PUBLIC_INTEGRATION_KEY,
				callbackUrl: process.env.NLB_BANKART_CALLBACK_URL,
				successUrl: process.env.NLB_BANKART_SUCCESS_URL,
				failUrl: process.env.NLB_BANKART_FAIL_URL,
				cancelUrl: process.env.NLB_BANKART_CANCEL_URL
			})
		} catch (e) {}
		// Verify transporter without throwing
		try {
			if (emailService && emailService.verifyTransporter) {
				emailService.verifyTransporter().then(v => {
					if (v && v.ok) console.log('[BOOT] SMTP transporter verified')
					else console.error('[BOOT] SMTP transporter verify failed', { message: v && v.error, code: v && v.code, command: v && v.command })
				}).catch(err => console.error('[BOOT] SMTP transporter verify promise rejected', { message: err && err.message }))
			}
		} catch (e) { console.error('[BOOT] SMTP verify error', e && e.message ? e.message : e) }
	} catch (e) {}
})
