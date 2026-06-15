const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"

async function getRooms() {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 12000)

  try {
    const response = await fetch(`${API_BASE_URL}/rooms`, {
      signal: controller.signal,
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`Rooms request failed with status ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Rooms request timed out. The server may be waking up. Please retry.')
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

async function calculateBookingTotal(data) {
  const res = await fetch(`${API_BASE_URL}/bookings/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || 'Failed to calculate booking')
  }
  return res.json()
}

async function createBooking(data) {
  const res = await fetch(`${API_BASE_URL}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || 'Failed to create booking')
  }
  return res.json()
}

async function createBankartPayment(bookingId) {
  const res = await fetch(`${API_BASE_URL}/payments/bankart/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookingId }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || 'Failed to create payment')
  }
  return res.json()
}

async function createBktPayment(bookingId) {
  const res = await fetch(`${API_BASE_URL}/payments/bkt/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookingId }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || 'Failed to create BKT payment')
  }
  return res.json()
}

export { getRooms, calculateBookingTotal, createBooking, createBankartPayment, createBktPayment }
