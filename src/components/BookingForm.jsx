import React, { useState, useEffect } from 'react'

export default function BookingForm({ initial = {}, onSubmit }) {
  const [checkin, setCheckin] = useState(initial.checkin || '')
  const [checkout, setCheckout] = useState(initial.checkout || '')
  const [guests, setGuests] = useState(initial.guests || 2)
  const [apartment, setApartment] = useState(initial.apartment || '')
  const [name, setName] = useState(initial.name || '')
  const [phone, setPhone] = useState(initial.phone || '')
  const [email, setEmail] = useState(initial.email || '')
  const [message, setMessage] = useState(initial.message || '')
  const [errors, setErrors] = useState({})

  useEffect(() => {
    // keep initial values in sync if modal opens with data
    setCheckin(initial.checkin || '')
    setCheckout(initial.checkout || '')
    setGuests(initial.guests || 2)
    setApartment(initial.apartment || '')
    setName(initial.name || '')
    setPhone(initial.phone || '')
    setEmail(initial.email || '')
    setMessage(initial.message || '')
  }, [initial])

  function validate() {
    const e = {}
    if (!checkin) e.checkin = 'Please select a check-in date'
    if (!checkout) e.checkout = 'Please select a check-out date'
    if (checkin && checkout && new Date(checkout) <= new Date(checkin)) e.checkout = 'Check-out must be after check-in'
    if (!name) e.name = 'Full name required'
    if (!phone) e.phone = 'Phone or WhatsApp required'
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Invalid email'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    const payload = { checkin, checkout, guests, apartment, name, phone, email, message }
    // call parent
    if (onSubmit) onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <label className="flex flex-col">
          <span className="text-sm text-gray-600">Guests</span>
          <select value={guests} onChange={(e) => setGuests(e.target.value)} className="mt-1 p-3 rounded-md border border-gray-200">
            {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} guest{n>1?'s':''}</option>)}
          </select>
        </label>

        <label className="flex flex-col md:col-span-2">
          <span className="text-sm text-gray-600">Apartment type</span>
          <input placeholder="e.g. Studio, 1BR, 2BR" value={apartment} onChange={(e) => setApartment(e.target.value)} className="mt-1 p-3 rounded-md border border-gray-200" />
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

      <label className="flex flex-col">
        <span className="text-sm text-gray-600">Email</span>
        <input value={email} onChange={(e) => setEmail(e.target.value)} className={`mt-1 p-3 rounded-md border ${errors.email ? 'border-red-400' : 'border-gray-200'}`} />
        {errors.email && <span className="text-xs text-red-500 mt-1">{errors.email}</span>}
      </label>

      <label className="flex flex-col">
        <span className="text-sm text-gray-600">Message</span>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} className="mt-1 p-3 rounded-md border border-gray-200" />
      </label>

      <div className="flex items-center gap-3">
        <button type="submit" className="btn-premium px-5 py-3">Check Availability</button>
      </div>
    </form>
  )
}
