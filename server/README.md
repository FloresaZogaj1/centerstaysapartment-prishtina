CenterStays Backend

Setup

1. Copy `.env.example` to `.env` and fill values (MongoDB URI, email credentials, ADMIN_API_KEY).
2. Install dependencies and seed DB:

```
cd server
npm install
npm run seed
npm run dev
```

API Endpoints

- GET /api/rooms
- GET /api/rooms/:id
- POST /api/bookings/quote
- POST /api/bookings
- GET /api/bookings
- GET /api/bookings/:id
- GET /api/bookings/admin/all (requires ADMIN_API_KEY header)
- PATCH /api/bookings/:id/status (requires ADMIN_API_KEY header)
- POST /api/payments/bkt/create
- POST /api/payments/bkt/callback
- GET /api/payments/bkt/success
- GET /api/payments/bkt/fail

Frontend integration (simplified)

1. Quote flow (calculate price):

```js
const resp = await fetch('/api/bookings/quote', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ roomTypeId, checkIn, checkOut, meals, extras, adults, children })
})
const data = await resp.json()
// show data.pricing and data.availableCount
```

2. Create booking (after user confirms):

```js
const resp = await fetch('/api/bookings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ roomTypeId, checkIn, checkOut, meals, extras, adults, children, fullName, email, phone, specialRequests })
})
const booking = await resp.json()
// booking._id
```

3. Create BKT payment (backend returns paymentUrl):

```js
const payResp = await fetch('/api/payments/bkt/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ bookingId: booking._id })
})
const payData = await payResp.json()
window.location.href = payData.paymentUrl // redirect to BKT (placeholder)
```
