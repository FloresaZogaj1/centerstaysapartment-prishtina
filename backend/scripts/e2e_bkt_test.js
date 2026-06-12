#!/usr/bin/env node
// LOCAL TEST ONLY - DO NOT RUN IN PRODUCTION
// E2E BKT test script. This helper creates test bookings on a local
// backend and simulates bank callbacks. It reads secrets from
// backend/.env and should never be run against production systems.
/*
  E2E BKT test script (local only)
  - Creates two bookings via POST /api/bookings
  - Calls POST /api/payments/bkt/create for each booking
  - Simulates Approved callback for first booking, Declined for second
  - Uses nestpayService.generateHashV3 and process.env.BKT_STORE_KEY to compute HASH (store key is never printed)
  - Prints concise results and final DB statuses
*/

(async function(){
  try{
    require('dotenv').config({path: './.env'});
    const fetch = global.fetch;
    const nestpay = require('../src/services/nestpayService');
    const mongoose = require('mongoose');
    const Booking = require('../src/models/Booking');
    const Payment = require('../src/models/Payment');

    const apiBase = 'http://127.0.0.1:5000/api';

    async function postJson(path, body){
      const res = await fetch(path, {method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body)});
      const text = await res.text();
      try { return { status: res.status, body: JSON.parse(text) }; } catch(e) { return { status: res.status, body: text }; }
    }

    async function runScenario(label, firstNameSuffix, responseValue, procReturnCode){
      console.log(`\n--- Running scenario: ${label}`);
      const bookingPayload = {
        roomId: '6a27eea298e72305d8eb4bd5',
        firstName: `E2E-${firstNameSuffix}`,
        lastName: 'Test',
        email: `e2e-${firstNameSuffix}@example.com`,
        phone: '+38344111223',
        checkInDate: '2026-06-10',
        checkOutDate: '2026-06-13',
        guests: 2,
        addons: { breakfast: true, lunch: false, dinner: true, airportTransport: true, rentCarGolf7: false }
      };

      // 1) Create booking
      const bRes = await postJson(`${apiBase}/bookings`, bookingPayload);
      if (bRes.status !== 201) throw new Error(`Booking create failed: ${bRes.status} ${JSON.stringify(bRes.body)}`);
      const booking = bRes.body;
      console.log(`Booking created: id=${booking._id} bookingNumber=${booking.bookingNumber}`);

      // 2) Create BKT payment form
      const pRes = await postJson(`${apiBase}/payments/bkt/create`, { bookingId: booking._id });
      if (pRes.status !== 200) throw new Error(`BKT create failed: ${pRes.status} ${JSON.stringify(pRes.body)}`);
      const form = pRes.body.form;
      console.log(`BKT form returned: action=${form.action}`);

      // 3) Build callback payload based on the form fields and desired response
      const callbackPayload = Object.assign({}, form.fields);
      // ensure oid uses the real booking.bookingNumber
      callbackPayload.oid = booking.bookingNumber;
      callbackPayload.Response = responseValue;
      callbackPayload.ProcReturnCode = procReturnCode;
      // Make sure amount is a string with two decimals (form.fields should already have this)
      if (callbackPayload.amount && typeof callbackPayload.amount === 'number') callbackPayload.amount = callbackPayload.amount.toFixed(2);

      // Remove HASH if present to ensure generateHashV3 calculates it
      delete callbackPayload.HASH;
      delete callbackPayload.hash;

      // 4) Generate valid Hashv3 using server-side store key (not printed)
      const hash = nestpay.generateHashV3(callbackPayload, process.env.BKT_STORE_KEY);
      callbackPayload.HASH = hash;

      // 5) POST callback
      const cbRes = await postJson(`${apiBase}/payments/bkt/callback`, callbackPayload);
      console.log(`Callback POST response: http=${cbRes.status} body=${JSON.stringify(cbRes.body)}`);

      // 6) Query DB for final statuses
      await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
      const freshBooking = await Booking.findById(booking._id).lean().exec();
      const payments = await Payment.find({ booking: booking._id }).sort({ createdAt: -1 }).lean().exec();
      const latestPayment = payments && payments.length ? payments[0] : null;

      console.log(`Final Booking status: id=${booking._id} bookingNumber=${booking.bookingNumber} status=${freshBooking.status} paymentStatus=${freshBooking.paymentStatus}`);
      if (latestPayment) console.log(`Final Payment: id=${latestPayment._id} provider=${latestPayment.provider} status=${latestPayment.status}`);
      else console.log('No payment document found for booking');

      // Close mongoose connection
      await mongoose.disconnect();

      return { booking, payment: latestPayment, cbResponse: cbRes };
    }

    // Run Approved scenario
    const approved = await runScenario('Approved', 'paid', 'Approved', '00');

    // Run Declined scenario (new booking)
    const declined = await runScenario('Declined', 'failed', 'Declined', '99');

    console.log('\n--- Summary ---');
    console.log(`Paid booking: id=${approved.booking._id} bookingNumber=${approved.booking.bookingNumber} paymentId=${approved.payment? approved.payment._id : 'N/A'}`);
    console.log(`Paid callback response: ${JSON.stringify(approved.cbResponse.body)}`);
    console.log(`Failed booking: id=${declined.booking._id} bookingNumber=${declined.booking.bookingNumber} paymentId=${declined.payment? declined.payment._id : 'N/A'}`);
    console.log(`Failed callback response: ${JSON.stringify(declined.cbResponse.body)}`);

    process.exit(0);
  }catch(err){
    console.error('E2E script error:', err);
    process.exit(1);
  }
})();
