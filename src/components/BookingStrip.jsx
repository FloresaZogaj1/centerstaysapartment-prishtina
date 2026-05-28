import React from 'react'

export default function BookingStrip() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
      <div className="bg-white rounded-2xl shadow-soft p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex gap-6 text-sm text-gray-700">
          <div><strong>Lokacioni:</strong> Qendër e qytetit</div>
          <div><strong>Lloji:</strong> Apartamente moderne</div>
          <div><strong>Qëndrimi:</strong> Afatshkurtër</div>
          <div><strong>Rezervimi:</strong> Përmes Airbnb</div>
        </div>

        <div>
          <a href="https://www.airbnb.com/slink/lQvhOaVP" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-brand text-white rounded-lg shadow">Kontrollo Disponueshmërinë</a>
        </div>
      </div>
    </div>
  )
}
