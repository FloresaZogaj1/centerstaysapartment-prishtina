"use strict"

/**
 * bankartService.js
 *
 * Placeholder service for Bankart payment integration.
 * This module provides safe, server-side helper functions for creating a
 * payment session, verifying callback payloads, and mapping statuses.
 *
 * IMPORTANT:
 * - Do NOT hardcode secrets in source. Put sensitive values in backend/.env
 *   (e.g., BANKART_SHARED_SECRET) and never expose them to the frontend.
 * - This file intentionally does NOT perform live requests to the Bankart
 *   gateway. Implementations must follow Bankart's official API docs and
 *   signature requirements.
 *
 * Exposed functions:
 * - createBankartPaymentSession({ booking, payment }) => { redirectUrl }
 * - verifyBankartCallback(payload) => { valid: boolean, data }
 * - mapBankartStatus(status) => normalizedStatus
 */

/**
 * createBankartPaymentSession
 * - Prepare the payload required to initialize a Bankart payment session.
 * - Typically this includes: connector id, amount, currency, order id, return
 *   URLs, customer info, and a signature/hash computed with the shared secret.
 * - Implementation must:
 *   1) Build the request payload per Bankart docs.
 *   2) Compute signature (HMAC/SHA or other as documented) using
 *      process.env.BANKART_SHARED_SECRET.
 *   3) POST to Bankart (or generate a redirect URL the frontend should open).
 *
 * For now this returns a placeholder object. Do NOT call Bankart from here
 * until we implement the official request format and signature algorithm.
 */
async function createBankartPaymentSession ({ booking, payment }) {
  // booking: Booking mongoose document
  // payment: Payment mongoose document (local record)

  // Example of fields generally required (do NOT assume these are exact):
  // - connectorId: process.env.BANKART_CONNECTOR_ID
  // - amount: payment.amount (integer / minor units?)
  // - currency: payment.currency
  // - orderId / merchantReference: booking.bookingNumber
  // - returnUrl/successUrl/cancelUrl
  // - customer email / phone
  // - signature/hash: HMAC(sharedSecret, payloadString)

  // Placeholder return: Bankart integration pending. The frontend currently
  // expects a redirectUrl in the response; we keep returning null until the
  // live integration is implemented.
  return {
    redirectUrl: null,
    note: 'Bankart integration not implemented. Implement createBankartPaymentSession according to Bankart docs.'
  }
}

/**
 * verifyBankartCallback
 * - Bankart will POST a callback/webhook to the server when payment status
 *   changes. The payload must be verified by recomputing the signature/hash
 *   using the Shared Secret and comparing it to the signature included by
 *   Bankart in the request headers or body.
 * - This function should be called from the callback route to guarantee the
 *   request authenticity.
 */
function verifyBankartCallback (payload) {
  // Implementation notes:
  // - Extract signature from headers or payload (per Bankart docs)
  // - Build the canonical payload string exactly as Bankart expects
  // - Use crypto.createHmac('sha256', process.env.BANKART_SHARED_SECRET)
  //   .update(canonicalString).digest('hex') (or whatever algorithm is required)
  // - Compare signatures using a timing-safe compare
  // - Return { valid: true, data: parsedData } when valid

  return {
    valid: false,
    data: null,
    note: 'verifyBankartCallback is a placeholder. Implement signature verification using BANKART_SHARED_SECRET.'
  }
}

/**
 * mapBankartStatus
 * - Convert Bankart-specific status strings to internal normalized statuses
 *   (e.g., 'pending', 'paid', 'failed', 'cancelled') used by Booking/Payment
 *   models.
 */
function mapBankartStatus (status) {
  // Example mapping (update once actual statuses are known):
  const s = String(status).toLowerCase()
  if (s.includes('success') || s.includes('paid') || s === 'paid') return 'paid'
  if (s.includes('pending')) return 'pending'
  if (s.includes('cancel') || s.includes('cancelled')) return 'cancelled'
  if (s.includes('fail') || s.includes('failed') || s.includes('error')) return 'failed'
  return 'unknown'
}

module.exports = {
  createBankartPaymentSession,
  verifyBankartCallback,
  mapBankartStatus
}
