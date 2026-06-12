import React from 'react'

export default function PaymentFail() {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Payment failed or cancelled</h1>
      <p className="text-gray-700">Payment failed or was cancelled. Please try again or contact support.</p>
    </div>
  )
}
