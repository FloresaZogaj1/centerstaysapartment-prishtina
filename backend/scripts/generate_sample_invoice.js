// Small script to generate a sample invoice for a given paymentId-like sample
const path = require('path')
const fs = require('fs')
const { generateInvoicePdf } = require('../src/services/pdfInvoiceService')

async function run() {
  // Minimal sample booking and payment data
  const booking = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+383 44 555 666',
    roomName: 'Standard Apartment',
    checkInDate: new Date().toISOString().split('T')[0],
    checkOutDate: new Date(Date.now() + 2*24*60*60*1000).toISOString().split('T')[0],
    guests: 2,
    nights: 2,
    bookingNumber: 'BKG-123456'
  }

  const payment = {
    _id: '605c3f9f1c9d440000a1b2c3',
    invoiceNumber: 'INV-20260709-001',
    amount: 220,
    currency: 'EUR',
    provider: 'BKT',
    status: 'paid',
    invoiceSentAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  }

  const result = await generateInvoicePdf(booking, payment)
  console.log('generate sample invoice result:', result)
  if (result && result.ok) console.log('Sample invoice written to:', result.path)
}

run().catch(err => {
  console.error('error generating sample invoice', err)
  process.exit(1)
})
