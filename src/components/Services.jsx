import React from 'react'

const services = [
  { title: 'Apartamente moderne', icon: 'home' },
  { title: 'Lokacion qendror', icon: 'map' },
  { title: 'Rezervim i lehtë përmes Airbnb', icon: 'calendar' },
  { title: 'Ambient i pastër dhe komod', icon: 'sparkles' },
  { title: 'Wi‑Fi dhe pajisje esenciale', icon: 'wifi' },
  { title: 'Ideale për turistë dhe udhëtime biznesi', icon: 'briefcase' }
]

function Icon({ name }) {
  const common = 'w-6 h-6 text-brand'
  switch (name) {
    case 'home':
      return (
        <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 9.5L12 3l9 6.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V9.5z"/></svg>
      )
    case 'map':
      return (
        <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A2 2 0 0 1 3 15.382V5.618a2 2 0 0 1 1.553-1.894L9 1l6 2 6-2v12a2 2 0 0 1-1.553 1.894L15 21l-6-2z"/></svg>
      )
    case 'calendar':
      return (
        <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"/></svg>
      )
    case 'sparkles':
      return (
        <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15 10.5 10.5 6 9l4.5-1.5L12 3zM4 19l.9-2.7L7.6 16 5.9 14.2 4 11.5 3.1 14.2 1.4 16 3.1 16.3 4 19z"/></svg>
      )
    case 'wifi':
      return (
        <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M8.53 16.11a4 4 0 0 1 6.94 0M5.05 12.11a8 8 0 0 1 13.9 0M1.42 8.11a12 12 0 0 1 21.16 0M12 20.5l.01-.011"/></svg>
      )
    case 'briefcase':
      return (
        <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M10 3h4a1 1 0 0 1 1 1v1h2a2 2 0 0 1 2 2v3H3V8a2 2 0 0 1 2-2h2V4a1 1 0 0 1 1-1zM3 13v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5"/></svg>
      )
    default:
      return null
  }
}

export default function Services() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-10">
        <h2 className="text-2xl font-semibold">Shërbimet tona</h2>
        <p className="mt-2 text-gray-600">Komoditet, pastërti dhe qasje e lehtë në pikat kryesore të qytetit.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((s) => (
          <div key={s.title} className="bg-white rounded-xl border border-gray-100 p-5 shadow-soft card-hover flex gap-4 items-start">
            <div className="p-3 rounded-lg bg-white border border-brand/10 text-brand">
              <Icon name={s.icon} />
            </div>
            <div>
              <h3 className="font-medium">{s.title}</h3>
              <p className="text-sm text-gray-500 mt-1">Kualitet dhe rehati për çdo qëndrim.</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
