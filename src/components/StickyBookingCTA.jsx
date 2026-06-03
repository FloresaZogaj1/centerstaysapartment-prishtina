import React from 'react'
export default function StickyBookingCTA() {
  function scrollToAvailability() {
    const el = document.getElementById('availability')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  function scrollToApartments() {
    const el = document.getElementById('apartments')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      {/* Mobile: minimal bottom bar */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-[calc(100%-40px)] max-w-3xl md:hidden">
        <div className="bg-white/95 backdrop-blur-md rounded-xl p-3 flex items-center justify-between shadow-lg">
          <div>
            <div className="text-sm text-gray-600">Explore</div>
            <div className="text-lg font-semibold">Find your stay</div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={scrollToApartments} className="px-4 py-2 bg-white rounded-md text-charcoal shadow">View Apartments</button>
            <a href={`https://wa.me/38348110988?text=${encodeURIComponent('Hello, I would like to check availability for CenterStays Apartments in Prishtina.')}`} className="px-4 py-2 bg-white rounded-md text-charcoal shadow">WhatsApp</a>
          </div>
        </div>
      </div>

      {/* Desktop: small floating CTA */}
      <div className="hidden md:block fixed right-6 bottom-6 z-50">
        <div className="bg-white rounded-xl p-4 shadow-lg w-56">
          <div className="text-sm text-gray-600">Need availability?</div>
          <div className="font-semibold text-lg text-charcoal mt-1">Check Availability</div>
          <div className="mt-3 flex gap-2">
            <button onClick={scrollToAvailability} className="btn-premium w-full">Check Availability</button>
          </div>
          <div className="mt-2 text-center">
            <a href={`https://wa.me/38348110988?text=${encodeURIComponent('Hello, I would like to check availability for CenterStays Apartments in Prishtina.')}`} className="text-sm text-[#CBAA6A]">Message on WhatsApp</a>
          </div>
        </div>
      </div>
    </>
  )
}
