import React from 'react'

export default function StickyBookingCTA() {
  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-[calc(100%-40px)] max-w-3xl md:hidden">
      <div className="bg-white/95 backdrop-blur-md rounded-xl p-3 flex items-center justify-between shadow-lg">
        <div>
          <div className="text-sm text-gray-600">Ready to book?</div>
          <div className="text-lg font-semibold">Check availability now</div>
        </div>
        <div className="flex items-center gap-3">
          <a href="https://wa.me/38344123456?text=Hello%2C%20I%20would%20like%20to%20check%20availability%20for%20CenterStays%20Apartments%20in%20Prishtina." className="px-4 py-2 bg-white rounded-md text-charcoal shadow">WhatsApp</a>
          <button className="btn-premium px-4 py-2">Book Now</button>
        </div>
      </div>
    </div>
  )
}
