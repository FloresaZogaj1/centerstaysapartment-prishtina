const Booking = require('../models/Booking')
const Payment = require('../models/Payment')
const { verifyBankartCallback } = require('../services/bankartService')

const createBankartPayment = async (req, res) => {
  try {
    const { bookingId } = req.body
    if (!bookingId) return res.status(400).json({ message: 'bookingId is required' })

    const booking = await Booking.findById(bookingId)
    if (!booking) return res.status(404).json({ message: 'Booking not found' })

    const paymentData = {
      booking: booking._id,
      provider: 'BANKART',
      amount: booking.pricing.totalAmount,
      currency: 'EUR',
      status: 'pending',
    }

    const payment = await Payment.create(paymentData)

    // Update booking paymentStatus
    booking.paymentStatus = 'pending'
    await booking.save()

    return res.json({
      message: 'Payment created locally. Bankart integration pending.',
      payment,
      redirectUrl: null,
    })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

module.exports = {
  createBankartPayment,
}

// Placeholder handler for Bankart callback/webhook
const bankartCallback = async (req, res) => {
  try {
    const payload = req.body

    // Log that we received a Bankart callback
    console.log('[Bankart Callback] received payload:', JSON.stringify(payload))

    // Call the placeholder verification function from the service.
    // The service currently returns { valid: false, data: null, note: ... }
    const verification = verifyBankartCallback(payload)

    if (!verification || !verification.valid) {
      // Do not update any payment/booking state unless verification passes.
      console.log('[Bankart Callback] verification failed or not implemented:', verification && verification.note)
      return res.json({ message: 'Bankart callback placeholder received. Real verification pending official documentation.' })
    }

    // If verification becomes implemented and valid, the next steps would be:
    // - Map Bankart status to internal status (using mapBankartStatus)
    // - Update Payment and Booking records accordingly
    // For now we stop here.

    return res.json({ message: 'Bankart callback placeholder received. Real verification pending official documentation.' })
  } catch (error) {
    console.error('[Bankart Callback] error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

module.exports.bankartCallback = bankartCallback

