import React, { useState } from 'react'
import BookingFormV2 from './BookingFormV2'

export default function BookingModal({ isOpen, onClose, initialData }) {
  const [submitted, setSubmitted] = useState(false)

  if (!isOpen) return null

  function handleSubmit(payload) {
    // handled inside BookingFormV2
    console.log('Booking payload', payload)
  }

  const phone = (initialData && initialData.phone) || '+38348110988'
  const waMessage = `Hello, I would like to check availability for CenterStays Apartments in Prishtina.%0A${initialData?.apartment?`Apartment: ${initialData.apartment}%0A`:''}${initialData?.checkin?`Check-in: ${initialData.checkin}%0A`:''}${initialData?.checkout?`Check-out: ${initialData.checkout}%0A`:''}${initialData?.guests?`Guests: ${initialData.guests}%0A`:''}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative max-w-3xl w-full mx-4 bg-gradient-to-br from-ivory to-white rounded-xl shadow-xl p-6" style={{border: '1px solid rgba(203,170,106,0.12)'}}>
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-600">✕</button>

        {!submitted ? (
          <div>
            <h3 className="text-2xl font-semibold text-charcoal">Book your stay — CenterStays</h3>
            <p className="text-sm text-gray-600 mt-1">Fill the form to check availability or contact us via WhatsApp.</p>

            <div className="mt-6">
              <BookingFormV2 selectedRoom={initialData?.room || initialData} onClose={onClose} />
            </div>

            <div className="mt-4 flex items-center gap-3">
              <a target="_blank" rel="noreferrer" href={`https://wa.me/${phone.replace(/[^0-9]/g,'')}?text=${waMessage}`} className="px-4 py-2 rounded-md bg-[#CBAA6A] text-white">Book via WhatsApp</a>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <h4 className="text-xl font-semibold">Thank you</h4>
            <p className="mt-2 text-gray-600">Your request has been prepared. We will contact you shortly. You can also message us on WhatsApp.</p>
            <div className="mt-4">
              <a target="_blank" rel="noreferrer" href={`https://wa.me/${phone.replace(/[^0-9]/g,'')}?text=${waMessage}`} className="px-4 py-2 rounded-md bg-[#CBAA6A] text-white">Open WhatsApp</a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
