import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'

const NAV = [
  { name: 'Ballina', to: '/' },
  { name: 'Shërbimet', to: '/sherbimet' },
  { name: 'Rreth Nesh', to: '/rreth' },
  { name: 'Dhomat', to: '/dhomat' },
  { name: 'Blog', to: '/blog' },
  { name: 'Kontakti', to: '/kontakti' }
]

export default function Header() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <header className="w-full bg-[#E4EDFF] fixed top-0 left-0 z-[9999]" style={{ height: '72px' }}>
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-4 md:px-6">
          {/* Logo left */}
          <div className="flex items-center">
            <div className="text-left">
              <NavLink to="/" className="flex flex-col">
                <div className="text-2xl font-bold text-[#0f1724] leading-tight">
                  Center<span className="inline-block bg-[#2699D6]/20 text-[#2699D6] px-1 ml-1 rounded-sm">Stays</span>
                </div>
                <div className="text-xs text-[#0f1724]/70">Apartments</div>
              </NavLink>
            </div>
          </div>

          {/* Menu button right */}
          <div>
            <button
              type="button"
              aria-label="Menu"
              onClick={() => setOpen(true)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setOpen(true) }}
              className="w-[140px] h-[40px] rounded-full border-2 border-[#2699D6] text-[#2699D6] bg-transparent flex items-center justify-center hover:bg-[#2699D6]/10 transition cursor-pointer text-sm"
            >
              Menu
            </button>
          </div>
        </div>
      </header>

      {/* Overlay menu */}
      {open && (
        <div className="fixed inset-0 z-[9998] flex pointer-events-auto">
          {/* left: dim backdrop showing hero behind (if any) */}
          <div className="w-1/2 hidden md:block bg-black/50" onClick={() => setOpen(false)} />

          {/* right: menu panel */}
          <div className="w-full md:w-1/2 bg-[#E4EDFF] p-8 md:p-12 relative pointer-events-auto">
            <button type="button" onClick={() => setOpen(false)} className="absolute top-4 right-4 md:top-6 md:right-6 w-[140px] h-[40px] rounded-full border-2 border-[#2699D6] text-[#2699D6] bg-transparent flex items-center justify-center text-sm">
              Mbyll
            </button>

            <nav className="h-full flex flex-col justify-center items-start pl-6 md:pl-8">
              {NAV.map((n) => (
                <NavLink key={n.name} to={n.to} onClick={() => setOpen(false)} className="text-3xl md:text-4xl font-medium text-[#2699D6] leading-tight mb-6 md:mb-8">
                  {n.name}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  )
}
