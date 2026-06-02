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
  <header className="w-full bg-bg-warm fixed top-0 left-0 z-[9999] border-b border-transparent backdrop-blur-sm" style={{ height: '72px' }}>
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-4 md:px-6">
          {/* Logo left */}
          <div className="flex items-center">
            <div className="text-left">
              <NavLink to="/" className="flex flex-col">
                <div className="text-2xl font-heading font-bold text-charcoal leading-tight">
                  Center<span className="inline-block logo-highlight ml-1">Stays</span>
                </div>
                <div className="text-xs text-charcoal/70">Apartments</div>
              </NavLink>
            </div>
          </div>

          {/* Menu button right */}
          <div className="flex items-center">
            {/* Desktop: rounded Menu button */}
            <div className="hidden md:block">
              <button
                type="button"
                aria-label="Menu"
                onClick={() => setOpen(true)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setOpen(true) }}
                className="w-[140px] h-[40px] rounded-full border border-charcoal text-charcoal bg-transparent flex items-center justify-center hover:bg-charcoal/5 transition cursor-pointer text-sm font-medium"
              >
                Menu
              </button>
            </div>

            {/* Mobile: compact hamburger icon like attachment */}
            <div className="md:hidden">
              <button
                type="button"
                aria-label="Open menu"
                onClick={() => setOpen(true)}
                className="w-10 h-10 flex items-center justify-center"
              >
                <span className="sr-only">Open menu</span>
                <div className="space-y-1">
                  <span className="block w-6 h-0.5 bg-[#1E40AF] rounded"></span>
                  <span className="block w-6 h-0.5 bg-[#1E40AF] rounded"></span>
                  <span className="block w-6 h-0.5 bg-[#1E40AF] rounded"></span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Overlay menu */}
      {open && (
        // Full-screen overlay for mobile and split for desktop
        <div className="fixed inset-0 z-[9998]">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 md:hidden" onClick={() => setOpen(false)} />

          {/* Mobile: centered full-screen menu */}
          <div className="md:hidden fixed inset-0 flex items-center justify-center">
            <div className="bg-white w-full h-full p-8 flex flex-col items-center justify-center">
              <button type="button" onClick={() => setOpen(false)} className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full border border-gray-200">
                <span className="sr-only">Close</span>
                <svg className="w-5 h-5 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18"></path><path d="M6 6l12 12"></path></svg>
              </button>

              <nav className="flex flex-col items-center space-y-6">
                {NAV.map((n) => (
                  <NavLink key={n.name} to={n.to} onClick={() => setOpen(false)} className="text-2xl font-semibold text-[#2699D6]">
                    {n.name}
                  </NavLink>
                ))}
              </nav>
            </div>
          </div>

          {/* Desktop: split panel like before */}
          <div className="hidden md:flex h-full">
            <div className="w-1/2 bg-black/50" onClick={() => setOpen(false)} />
            <div className="w-1/2 bg-[#E4EDFF] p-12 relative flex items-center">
              <button type="button" onClick={() => setOpen(false)} className="absolute top-6 right-6 w-[140px] h-[40px] rounded-full border-2 border-[#2699D6] text-[#2699D6] bg-transparent flex items-center justify-center text-sm">
                Mbyll
              </button>
              <nav className="w-full flex flex-col items-start pl-8">
                {NAV.map((n) => (
                  <NavLink key={n.name} to={n.to} onClick={() => setOpen(false)} className="text-4xl font-medium text-[#2699D6] mb-6">
                    {n.name}
                  </NavLink>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
