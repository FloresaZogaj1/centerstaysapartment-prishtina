import React from 'react'

export default function FloatingWhatsApp({ phone = '+38344123456', message = 'Hello, I would like to check availability for CenterStays Apartments in Prishtina.' }) {
  const href = `https://wa.me/${phone.replace(/[^0-9]/g,'')}?text=${encodeURIComponent(message)}`
  return (
    <a href={href} target="_blank" rel="noreferrer" aria-label="Contact us on WhatsApp" className="fixed right-4 bottom-6 z-50">
      <div className="w-14 h-14 rounded-full whatsapp-premium shadow-lg flex items-center justify-center text-white text-xl border border-white/20">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-white">
          <path d="M20.52 3.48A11.86 11.86 0 0012 0C5.37 0 .07 4.61.07 10.3c0 1.82.47 3.6 1.37 5.18L0 24l8.9-2.34a11.92 11.92 0 005.1 1.09c6.63 0 11.93-4.61 11.93-10.3 0-2.76-1.05-5.33-3.41-7.17zM12 21.5c-1.66 0-3.29-.3-4.78-.9l-.34-.13-5.3 1.4 1.47-4.13-.15-.28A8.85 8.85 0 013.17 10.3c0-4.54 4.52-8.25 8.83-8.25 2.36 0 4.52.87 6.15 2.44 1.62 1.56 2.5 3.7 2.5 5.9 0 4.54-4.52 8.25-8.83 8.25z"/>
        </svg>
      </div>
    </a>
  )
}
