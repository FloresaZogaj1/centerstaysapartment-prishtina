const express = require('express')
const router = express.Router()
const emailService = require('../services/emailService')
const Payment = require('../models/Payment')
const Booking = require('../models/Booking')
const invoiceService = require('../services/invoiceService')
const pdfInvoiceService = require('../services/pdfInvoiceService')
const path = require('path')
const invoiceSenderService = require('../services/invoiceSenderService')

// POST /api/admin/test-email
router.post('/test-email', async (req, res) => {
  try {
    const apiKey = req.headers['x-admin-api-key']
    if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const { to } = req.body || {}
    if (!to) return res.status(400).json({ message: 'Missing recipient email.' })

    // SMTP missing -> return 400
    if (!emailService.isEmailConfigured()) {
      console.log('SMTP configuration missing')
      return res.status(400).json({ message: 'SMTP configuration missing.' })
    }

    try {
      const result = await emailService.sendTestEmail(to)
      // sendTestEmail returns true when sent, false when SMTP missing
      if (result === true) return res.status(200).json({ message: 'Test email sent.' })
      if (result === false) return res.status(400).json({ message: 'SMTP configuration missing.' })
      // otherwise treat as server error
      return res.status(500).json({ message: 'Failed to send test email.' })
    } catch (err) {
      console.error('Test email failed:', err && err.message ? err.message : err)
      return res.status(500).json({ message: 'Failed to send test email.' })
    }
  } catch (err) {
    console.error('Admin test-email handler error:', err && err.message ? err.message : err)
    return res.status(500).json({ message: 'Internal server error.' })
  }
})

// GET /api/admin/payments/latest  - return latest 3 payments (admin protected)
router.get('/payments/latest', async (req, res) => {
  try {
    const apiKey = req.headers['x-admin-api-key']
    if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    // Find latest 3 payments, newest first
    const payments = await Payment.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('booking')
      .lean()

    const mapped = payments.map(p => ({
      paymentId: p._id,
      bookingId: p.booking ? p.booking._id : p.booking,
      guestName: p.booking ? `${p.booking.firstName || ''} ${p.booking.lastName || ''}`.trim() : '',
      email: p.booking ? p.booking.email || '' : '',
      phone: p.booking ? p.booking.phone || '' : '',
      amount: p.amount || 0,
      currency: p.currency || '',
      paymentMethod: p.provider || '',
      paymentStatus: p.status || '',
      transactionId: p.providerTransactionId || p.providerOrderId || p.bankartTransactionId || p.merchantTransactionId || '',
      createdAt: p.createdAt || null,
      paidAt: p.callbackReceivedAt || null
    }))

    return res.json(mapped)
  } catch (err) {
    console.error('[admin/payments/latest] error', err && err.message ? err.message : err)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// GET /api/admin/payments/:paymentId/invoice - generate or return invoice PDF for a paid payment
router.get('/payments/:paymentId/invoice', async (req, res) => {
  try {
    const apiKey = req.headers['x-admin-api-key']
    if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) return res.status(401).json({ message: 'Unauthorized' })

    const paymentId = req.params.paymentId
    if (!paymentId) return res.status(400).json({ message: 'paymentId required' })

    const payment = await Payment.findById(paymentId).lean()
    if (!payment) return res.status(404).json({ message: 'Payment not found' })
    if (payment.status !== 'paid') return res.status(400).json({ message: 'Payment is not paid' })

    // Populate booking and room fully
    const fullPayment = await Payment.findById(paymentId).populate({ path: 'booking', populate: { path: 'room' } })
    const booking = fullPayment.booking

    // If invoice metadata not present, generate and update via invoiceService (idempotent)
    try {
      if (!fullPayment.invoiceSentAt) {
        const inv = await invoiceService.generateAndSendInvoice(booking, fullPayment)
        // ignore result here — invoiceService persists invoiceNumber and invoiceSentAt
      }
    } catch (e) {}

    // Generate PDF file
    const pdfRes = await pdfInvoiceService.generateInvoicePdf(booking, fullPayment)
    if (!pdfRes || !pdfRes.ok) return res.status(500).json({ message: 'Failed to generate PDF', error: pdfRes && pdfRes.error })

    // Stream the PDF to client
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${pdfRes.filename}"`)
    const stream = require('fs').createReadStream(pdfRes.path)
    stream.pipe(res)
  } catch (err) {
    console.error('[admin/payments/:paymentId/invoice] error', err && err.message ? err.message : err)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// GET /api/admin/payments/latest-paid-invoices - return latest 3 paid payments with invoice URL (admin protected)
router.get('/payments/latest-paid-invoices', async (req, res) => {
  try {
    const apiKey = req.headers['x-admin-api-key']
    if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) return res.status(401).json({ message: 'Unauthorized' })

    const payments = await Payment.find({ status: 'paid' })
      .sort({ updatedAt: -1 })
      .limit(3)
      .populate({ path: 'booking', populate: { path: 'room' } })
      .lean()

    const mapped = await Promise.all(payments.map(async p => {
      const paymentId = p._id
      const invoicePath = p.invoiceSentAt ? `/invoices/invoice-${p.invoiceNumber || String(paymentId).slice(-8)}-${String(paymentId).slice(-6)}.pdf` : null
      // If invoice not present, we won't generate here; client can request invoice endpoint to generate
      return {
        paymentId,
        bookingId: p.booking ? p.booking._id : null,
        guestName: p.booking ? `${p.booking.firstName || ''} ${p.booking.lastName || ''}`.trim() : '',
        amount: p.amount || 0,
        currency: p.currency || 'EUR',
        paymentStatus: p.status || '',
        paymentMethod: p.provider || '',
        transactionId: p.providerTransactionId || p.providerOrderId || '',
        paidAt: p.updatedAt || p.callbackReceivedAt || p.createdAt,
        invoiceUrl: invoicePath
      }
    }))

    return res.json(mapped)
  } catch (err) {
    console.error('[admin/payments/latest-paid-invoices] error', err && err.message ? err.message : err)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// POST /api/admin/payments/send-paid-invoices - bulk send invoices for all paid payments without paidCustomerEmailSentAt
router.post('/payments/send-paid-invoices', async (req, res) => {
  try {
    const apiKey = req.headers['x-admin-api-key']
    if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) return res.status(401).json({ message: 'Unauthorized' })

    // Find all paid payments where customer email not sent
  // Find payments where status is paid and no paidCustomerEmailSentAt timestamp
  const payments = await Payment.find({ status: 'paid', $or: [ { paidCustomerEmailSentAt: { $exists: false } }, { paidCustomerEmailSentAt: null } ] }).lean()

    // Use invoiceSenderService on ids to avoid loading everything into memory twice
    const ids = payments.map(p => p._id)
    const results = await invoiceSenderService.sendInvoicesForPayments(ids)

    return res.json({ processed: results.processed, sent: results.sent, skipped: results.skipped, failed: results.failed, failedItems: results.failedItems })
  } catch (err) {
    console.error('[admin/payments/send-paid-invoices] error', err && err.message ? err.message : err)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// POST /api/admin/payments/:paymentId/send-invoice - send invoice for a single payment
router.post('/payments/:paymentId/send-invoice', async (req, res) => {
  try {
    const apiKey = req.headers['x-admin-api-key']
    if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) return res.status(401).json({ message: 'Unauthorized' })

    const paymentId = req.params.paymentId
    if (!paymentId) return res.status(400).json({ message: 'paymentId required' })

    const force = String(req.query.force || '').toLowerCase() === 'true'

    const payment = await Payment.findById(paymentId)
    if (!payment) return res.status(404).json({ message: 'Payment not found' })
    if (payment.status !== 'paid') return res.status(400).json({ message: 'Payment is not paid' })

    // If already sent and not forced, skip
    if (payment.paidCustomerEmailSentAt && !force) return res.json({ ok: true, skipped: true, reason: 'already_sent' })

    const result = await invoiceSenderService.sendInvoiceForPayment(payment, { force })
    if (result && result.ok) return res.json({ ok: true, sentAt: result.sentAt })
    return res.status(500).json({ ok: false, error: result && result.error ? result.error : result && result.reason ? result.reason : 'failed' })
  } catch (err) {
    console.error('[admin/payments/:paymentId/send-invoice] error', err && err.message ? err.message : err)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

module.exports = router


