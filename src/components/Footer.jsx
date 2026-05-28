import React from 'react'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h4 className="text-lg font-semibold">CenterStays Apartments</h4>
            <p className="mt-2 text-gray-600">Qëndrim modern, komod dhe qendror për udhëtarë, turistë dhe vizitorë biznesi.</p>
          </div>

          <div>
            <h5 className="font-medium">Quick links</h5>
            <ul className="mt-2 text-gray-600 space-y-1">
              <li><a href="#dhomat" className="hover:text-brand">Dhomat</a></li>
              <li><a href="#sherbimet" className="hover:text-brand">Shërbimet</a></li>
              <li><a href="#kontakti" className="hover:text-brand">Kontakti</a></li>
            </ul>
          </div>

          <div>
            <h5 className="font-medium">Kontakti</h5>
            <p className="mt-2 text-gray-600">+383 48 110 988</p>
            <p className="mt-1 text-gray-600">centerstays@gmail.com</p>
            <a className="mt-2 inline-block text-brand" href="https://www.airbnb.com/slink/lQvhOaVP" target="_blank" rel="noopener noreferrer">Rezervo në Airbnb</a>
          </div>
        </div>

        <div className="mt-10 text-center text-sm text-gray-500">
          © 2026 CenterStays Apartments. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
