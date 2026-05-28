import React from 'react'

const highlights = [
  { title: 'Afër qendrës', desc: 'Shkurt distanca në këmbë drejt atraksioneve kryesore.' },
  { title: 'Qasje e lehtë', desc: 'Transport dhe lidhje praktike me pjesën tjetër të qytetit.' },
  { title: 'Përvojë urbane', desc: 'Kafene, restorante dhe jetë nate afër.' }
]

export default function CityExperience() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold">Qëndro në zemër të qytetit</h2>
        <p className="mt-2 text-gray-600">Me CenterStays Apartments, je afër pikave kryesore të qytetit, kafeneve, restoranteve dhe vendeve më të vizituara. Ideale për ata që duan komoditet, qasje të shpejtë dhe eksperiencë urbane.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {highlights.map((h) => (
          <div key={h.title} className="bg-white p-6 rounded-2xl shadow-soft card-hover">
            <h3 className="font-semibold text-lg text-charcoal">{h.title}</h3>
            <p className="mt-2 text-gray-600">{h.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
