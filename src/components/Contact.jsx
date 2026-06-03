import React, { useState } from 'react'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }
  function handleSubmit(e) {
    e.preventDefault()
    // placeholder behavior: in production replace with send logic
    alert('Faleminderit! Mesazhi u dërgua (demo).')
    setForm({ name: '', email: '', message: '' })
  }

  return (
    <div id="kontakti" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div>
          <h2 className="text-2xl font-semibold">Kontakti</h2>
          <p className="mt-4 text-gray-700">Na kontaktoni për pyetje apo rezervime.</p>

          <div className="mt-6 space-y-4 text-gray-700">
            <div><strong>Telefon:</strong> +383 48 110 988</div>
            <div><strong>Email:</strong> centerstays@gmail.com</div>
            <div><strong>Airbnb:</strong> <a className="text-brand" href="https://www.airbnb.com/slink/lQvhOaVP" target="_blank" rel="noopener noreferrer">Rezervo në Airbnb</a></div>
          </div>

          <div className="mt-8 p-6 rounded-xl border border-gray-100 shadow-soft-blue bg-white">
            <h3 className="font-semibold">Gati për qëndrimin tuaj?</h3>
            <p className="mt-1 text-gray-600">Rezervoni tani përmes Airbnb dhe përjetoni qytetin nga zemra e tij.</p>
            <a href="https://www.airbnb.com/slink/lQvhOaVP" target="_blank" rel="noopener noreferrer" className="mt-4 inline-block px-4 py-3 bg-brand text-white rounded-lg">
              Rezervo në Airbnb
            </a>
          </div>
        </div>

        <div>
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-soft flex flex-col items-start gap-4">
            <h3 className="font-semibold">Send an inquiry</h3>
            <p className="text-gray-600">Use the availability form to send your preferred dates and we will reply quickly. Or message us on WhatsApp for instant replies.</p>
            <div className="w-full flex gap-3">
              <a href="#availability" onClick={(e)=>{e.preventDefault(); const el=document.getElementById('availability'); if(el) el.scrollIntoView({behavior:'smooth', block:'start'})}} className="inline-block px-4 py-3 bg-[#CBAA6A] text-white rounded-lg">Check Availability</a>
              <a href={`https://wa.me/38348110988?text=${encodeURIComponent('Hello, I would like to check availability for CenterStays Apartments in Prishtina.')}`} target="_blank" rel="noreferrer" className="inline-block px-4 py-3 border border-[#CBAA6A] text-[#CBAA6A] rounded-lg">Message on WhatsApp</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
