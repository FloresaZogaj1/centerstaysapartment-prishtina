import React from 'react'

const rooms = [
  {
    id: 'standard',
    name: 'Standard Apartment',
    price: 'Nga €45 / nata',
    description: 'Zgjidhje praktike dhe komode për qëndrime të shkurtra në qytet.',
    features: ['1 dhomë gjumi', 'Wi‑Fi', 'Kuzhinë e vogël', 'Banjo private'],
  image: '/Instagram_files/659025397_18076753307428513_1454559748560419820_n.jpg'
  },
  {
    id: 'deluxe',
    name: 'Deluxe Apartment',
    price: 'Nga €60 / nata',
    description: 'Apartament më i gjerë me dizajn modern dhe më shumë rehati.',
    features: ['1–2 dhoma', 'Ambient i ndriçuar', 'Kuzhinë', 'TV', 'Wi‑Fi'],
  image: '/Instagram_files/656314906_18076753487428513_4009666761995664575_n.jpg'
  },
  {
    id: 'premium',
    name: 'Premium City Stay',
    price: 'Nga €80 / nata',
    description: 'Qëndrim premium në lokacion qendror për eksperiencë më të kompletuar.',
    features: ['Pamje qyteti', 'Hapësirë më e madhe', 'Stil modern', 'Pajisje të plota'],
  image: '/Instagram_files/648631785_18074365370428513_4289514915533021647_n.jpg'
  }
]

export default function Rooms() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-10">
        <h2 className="text-2xl font-semibold">Dhomat dhe Apartamentet</h2>
        <p className="mt-2 text-gray-600">Zgjidhni nga kategoritë tona dhe rezervoni lehtësisht.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {rooms.map((r) => (
          <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-5 shadow-soft card-hover flex flex-col">
            <div className="w-full h-44 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
              <img src={r.image} alt={r.name} className="w-full h-full object-cover" />
            </div>

            <div className="mt-4 flex-1">
              <h3 className="text-lg font-semibold">{r.name}</h3>
              <p className="text-brand font-medium mt-1">{r.price}</p>
              <p className="text-sm text-gray-600 mt-2">{r.description}</p>

              <ul className="mt-3 text-sm text-gray-600 space-y-1">
                {r.features.map((f) => <li key={f}>• {f}</li>)}
              </ul>
            </div>

            <div className="mt-4">
              <a href="https://www.airbnb.com/slink/lQvhOaVP" target="_blank" rel="noopener noreferrer" className="inline-block w-full text-center px-4 py-3 bg-brand text-white rounded-lg shadow hover:brightness-95 transition">Rezervo tani</a>
            </div>

          </div>
        ))}
      </div>
    </div>
  )
}
