import React, { useEffect, useState } from 'react'
import { calculateBookingTotal, createBooking, createBktPayment, createBankartPayment } from '../api/bookingApi'
import submitPaymentForm from '../utils/submitPaymentForm'

export default function BookingFormV2({ selectedRoom, onClose, termsAccepted, setTermsAccepted, termsError, setTermsError, requireTerms }) {
  const [checkInDate, setCheckInDate] = useState('')
  const [checkOutDate, setCheckOutDate] = useState('')
  const [guests, setGuests] = useState(2)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [addons, setAddons] = useState({ breakfast: false, lunch: false, dinner: false, airportTransport: false, rentCarGolf7: false })
  const [pricing, setPricing] = useState(null)
  const [loadingPricing, setLoadingPricing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState(null)
  const [pendingPaymentForm, setPendingPaymentForm] = useState(null)

  useEffect(() => {
    async function calc() {
      if (!selectedRoom || !checkInDate || !checkOutDate || !guests) return
      setLoadingPricing(true)
      try {
        const data = {
          roomId: selectedRoom._id || selectedRoom.id,
          checkInDate,
          checkOutDate,
          guests: Number(guests),
          addons,
        }
        const res = await calculateBookingTotal(data)
        setPricing(res.pricing || res)
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingPricing(false)
      }
    }
    calc()
  }, [selectedRoom, checkInDate, checkOutDate, guests, addons])

  async function handleSubmit(e) {
    e.preventDefault()
    // Validate terms via parent helper when available
    if (requireTerms) {
      if (!requireTerms()) return
    } else {
      // fallback: ensure local termsAccepted is checked
      if (!termsAccepted) {
        setTermsError('Please accept the Terms and Conditions before continuing.')
        return
      }
    }
    setSubmitting(true)
    setMessage(null)
    try {
      const bookingPayload = {
        roomId: selectedRoom._id || selectedRoom.id,
        firstName,
        lastName,
        email,
        phone,
        checkInDate,
        checkOutDate,
        guests: Number(guests),
        addons,
        termsAccepted: !!termsAccepted,
      }
      const booking = await createBooking(bookingPayload)

      // Create BKT payment form (3D_PAY_HOSTING)
      try {
        const bktRes = await createBktPayment(booking._id)
        if (bktRes && bktRes.form && bktRes.form.action && bktRes.form.fields) {
          const form = { action: bktRes.form.action, method: bktRes.form.method || 'POST', fields: bktRes.form.fields }
          // Auto-submit only when VITE_AUTO_SUBMIT_PAYMENT is enabled in environment (production).
          // Keep manual confirmation in development to avoid accidental redirects to the bank.
          const shouldAutoSubmit = import.meta.env.VITE_AUTO_SUBMIT_PAYMENT === 'true'
          if (shouldAutoSubmit) {
            // Do not modify any booking/payment status here; backend will mark payment after callback verification.
            submitPaymentForm(form)
            // Inform the user that they're being redirected to the bank
            setMessage('Booking saved. Redirecting to bank for payment...')
            return
          }

          // Development / manual flow: keep the form in state and show confirmation button
          setPendingPaymentForm(form)
          setMessage('Booking saved. Payment form is ready.')
          return
        }
      } catch (err) {
        console.error('BKT payment creation failed:', err)
        // fallback: show Bankart placeholder message
        const paymentRes = await createBankartPayment(booking._id)
        if (paymentRes.redirectUrl) {
          window.location.href = paymentRes.redirectUrl
          return
        }
        setMessage('Booking saved. Bankart payment integration is pending.')
      }
    } catch (err) {
      console.error(err)
      setMessage('Error: ' + (err.message || 'Unable to create booking'))
    } finally {
      setSubmitting(false)
    }
  }

  if (!selectedRoom) return <div className="p-4">No room selected</div>

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h4 className="text-lg font-semibold">Booking — {selectedRoom.name}</h4>
        <p className="text-sm text-gray-600">Price per night: {selectedRoom.basePricePerNight ? `${selectedRoom.basePricePerNight} EUR` : selectedRoom.price}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="flex flex-col">
          <span className="text-sm text-gray-600">Check-in</span>
          <input type="date" value={checkInDate} onChange={(e) => setCheckInDate(e.target.value)} className="mt-1 p-3 rounded-md border border-gray-200" />
        </label>
        <label className="flex flex-col">
          <span className="text-sm text-gray-600">Check-out</span>
          <input type="date" value={checkOutDate} onChange={(e) => setCheckOutDate(e.target.value)} className="mt-1 p-3 rounded-md border border-gray-200" />
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
          <span className="text-sm text-gray-600">First name</span>
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="mt-1 p-3 rounded-md border border-gray-200" />
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="flex flex-col">
          <span className="text-sm text-gray-600">Last name</span>
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="mt-1 p-3 rounded-md border border-gray-200" />
        </label>
        <label className="flex flex-col">
          <span className="text-sm text-gray-600">Email</span>
          <input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 p-3 rounded-md border border-gray-200" />
        </label>
      </div>

      <label className="flex flex-col">
        <span className="text-sm text-gray-600">Phone</span>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 p-3 rounded-md border border-gray-200" />
      </label>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="flex items-center gap-3"><input type="checkbox" checked={addons.breakfast} onChange={(e)=>setAddons({...addons, breakfast: e.target.checked})} /> Breakfast</label>
        <label className="flex items-center gap-3"><input type="checkbox" checked={addons.lunch} onChange={(e)=>setAddons({...addons, lunch: e.target.checked})} /> Lunch</label>
        <label className="flex items-center gap-3"><input type="checkbox" checked={addons.dinner} onChange={(e)=>setAddons({...addons, dinner: e.target.checked})} /> Dinner</label>
        <label className="flex items-center gap-3"><input type="checkbox" checked={addons.airportTransport} onChange={(e)=>setAddons({...addons, airportTransport: e.target.checked})} /> Airport transport</label>
        <label className="flex items-center gap-3"><input type="checkbox" checked={addons.rentCarGolf7} onChange={(e)=>setAddons({...addons, rentCarGolf7: e.target.checked})} /> Rent car (Golf 7)</label>
      </div>

      <div className="p-3 bg-gray-50 rounded">
        {loadingPricing ? (
          <div>Calculating...</div>
        ) : pricing ? (
          <div>
            <div>Nights: {pricing.nights}</div>
            <div>Room total: {pricing.roomTotal} EUR</div>
            <div>Guest extra: {pricing.guestExtraTotal} EUR</div>
            <div>Meals total: {pricing.mealsTotal} EUR</div>
            <div>Transport: {pricing.transportTotal} EUR</div>
            <div>Rent car: {pricing.rentCarTotal} EUR</div>
            <div className="font-semibold">Total: {pricing.totalAmount} EUR</div>
          </div>
        ) : (
          <div className="text-sm text-gray-500">Complete dates and guests to calculate price</div>
        )}
      </div>

        <div className="mt-3">
          <label className="flex items-start gap-3">
            <input type="checkbox" checked={termsAccepted} onChange={(e) => { setTermsAccepted(e.target.checked); if (e.target.checked) setTermsError('') }} />
            <span className="text-sm">I accept the <a href="/terms" className="text-blue-600 underline">Terms and Conditions</a> and <a href="/privacy" className="text-blue-600 underline">Privacy Policy</a>.</span>
          </label>
          {termsError && <div className="text-sm text-red-600 mt-1">{termsError}</div>}
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={submitting} className="btn-premium px-5 py-3">{submitting ? 'Saving...' : 'Continue to Payment'}</button>
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
        </div>

      {pendingPaymentForm && (
        <div className="mt-4 p-3 bg-yellow-50 rounded">
          <div className="mb-2 font-medium">BKT payment form is ready. Continue to bank payment.</div>
          <div className="flex gap-3">
            <button type="button" onClick={() => {
              try {
                console.log('Preparing to submit BKT form', { action: pendingPaymentForm.action, method: pendingPaymentForm.method, fieldNames: Object.keys(pendingPaymentForm.fields || {}) })
              } catch (e) {}
              // Ensure we use POST form submit
              submitPaymentForm(pendingPaymentForm)
            }} className="px-4 py-2 bg-blue-600 text-white rounded">Continue to bank payment</button>
            <button type="button" onClick={() => { setPendingPaymentForm(null); setMessage('Payment cancelled by user.') }} className="px-4 py-2 border rounded">Cancel</button>
          </div>
        </div>
      )}

      {message && <div className="mt-3 text-sm text-green-600">{message}</div>}
    </form>
  )
}
