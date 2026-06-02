import React from 'react'

const AMENITIES = [
  { name: 'Central location', icon: '📍' },
  { name: 'Fast Wi‑Fi', icon: '📶' },
  { name: 'Smart TV', icon: '📺' },
  { name: 'Fully equipped kitchen', icon: '🍳' },
  { name: 'Comfortable beds', icon: '🛏️' },
  { name: 'Clean & sanitized', icon: '🧼' },
  { name: 'Self check-in', icon: '🔑' },
  { name: 'Air conditioning', icon: '❄️' },
  { name: 'Workspace', icon: '💻' },
  { name: 'Parking nearby', icon: '🅿️' },
  { name: 'Airport transfer', icon: '✈️' }
]

export default function Amenities() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-heading font-semibold">Komoditetet tona</h2>
        <p className="mt-2 text-gray-600 max-w-2xl mx-auto">Përgatitur për t'ju ofruar rehati maksimale gjatë qëndrimit tuaj.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {AMENITIES.map((a) => (
          <div key={a.name} className="bg-white rounded-lg p-4 flex flex-col items-center text-center shadow hover:shadow-lg transition">
            <div className="text-3xl mb-2">{a.icon}</div>
            <div className="text-sm font-medium text-charcoal">{a.name}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
