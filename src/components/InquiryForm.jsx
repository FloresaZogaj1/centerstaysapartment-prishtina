import React, { useState } from 'react'

export default function InquiryForm({ onSubmit }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [checkin, setCheckin] = useState('')
  const [checkout, setCheckout] = useState('')
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState({})

  function validate() {
    const e = {}
    if (!name) e.name = 'Please enter your full name'
    if (!phone) e.phone = 'Please enter a phone or WhatsApp number'
    if (!checkin) e.checkin = 'Please select a check-in date'
    if (!checkout) e.checkout = 'Please select a check-out date'
    if (checkin && checkout && new Date(checkout) <= new Date(checkin)) e.checkout = 'Check-out must be after check-in'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    const payload = { name, phone, checkin, checkout, message }
    // frontend-only inquiry: call parent or show a temporary success
    if (onSubmit) onSubmit(payload)
    else alert('Thank you — your inquiry was prepared. We will contact you shortly.')
    setName('')
    setPhone('')
    setCheckin('')
    setCheckout('')
    setMessage('')
  }

  const waHref = `https://wa.me/38348110988?text=${encodeURIComponent(`Hello, I would like to check availability for CenterStays Apartments in Prishtina.\nName: ${name || '-'}\nCheck-in: ${checkin || '-'}\nCheck-out: ${checkout || '-'}\nMessage: ${message || '-'}`)}`

  return (
    <form id="availability" onSubmit={handleSubmit} className="max-w-3xl mx-auto bg-ivory p-6 rounded-xl shadow-lg" aria-label="Availability inquiry">
      <h3 className="text-2xl font-semibold text-charcoal">Check Availability</h3>
      <p className="text-gray-600 mt-1">Send us your preferred dates and we’ll confirm availability shortly.</p>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="flex flex-col">
          <span className="text-sm text-gray-600">Full name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className={`mt-1 p-3 rounded-md border ${errors.name ? 'border-red-400' : 'border-gray-200'}`} />
          {errors.name && <span className="text-xs text-red-500 mt-1">{errors.name}</span>}
        </label>

        <label className="flex flex-col">
          <span className="text-sm text-gray-600">Phone / WhatsApp</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className={`mt-1 p-3 rounded-md border ${errors.phone ? 'border-red-400' : 'border-gray-200'}`} />
          {errors.phone && <span className="text-xs text-red-500 mt-1">{errors.phone}</span>}
        </label>
      </div>

      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="flex flex-col">
          <span className="text-sm text-gray-600">Check-in</span>
          <input type="date" value={checkin} onChange={(e) => setCheckin(e.target.value)} className={`mt-1 p-3 rounded-md border ${errors.checkin ? 'border-red-400' : 'border-gray-200'}`} />
          {errors.checkin && <span className="text-xs text-red-500 mt-1">{errors.checkin}</span>}
        </label>

        <label className="flex flex-col">
          <span className="text-sm text-gray-600">Check-out</span>
          <input type="date" value={checkout} onChange={(e) => setCheckout(e.target.value)} className={`mt-1 p-3 rounded-md border ${errors.checkout ? 'border-red-400' : 'border-gray-200'}`} />
          {errors.checkout && <span className="text-xs text-red-500 mt-1">{errors.checkout}</span>}
        </label>
      </div>

      <label className="flex flex-col mt-3">
        <span className="text-sm text-gray-600">Message</span>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} className="mt-1 p-3 rounded-md border border-gray-200" />
      </label>

      <div className="mt-4 flex flex-col sm:flex-row gap-3">
        <button type="submit" className="px-5 py-3 bg-[#CBAA6A] text-white rounded-md font-medium">Send Inquiry</button>
        <a href={waHref} target="_blank" rel="noreferrer" className="px-5 py-3 border border-[#CBAA6A] text-[#CBAA6A] rounded-md text-center">Message on WhatsApp</a>
      </div>
    </form>
  )
}
