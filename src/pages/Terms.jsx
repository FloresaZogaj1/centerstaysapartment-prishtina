import React from 'react'
import { Link } from 'react-router-dom'

export default function Terms() {
  return (
    <div className="max-w-4xl mx-auto py-16 px-4">
      <h1 className="text-3xl font-semibold">Terms & Conditions</h1>
  <p className="text-sm text-gray-600 mt-2">Updated: 20 June 2026</p>

      <div className="prose prose-lg mt-6">
        <h2>1. Reservation Policy</h2>
        <p>All reservations made through CenterStays Apartments are considered final upon confirmation and successful payment. By completing a reservation, the guest acknowledges and agrees to all terms outlined in this Cancellation, Refund & Privacy Policy.</p>

        <h2>2. Strict Non-Refundable Policy</h2>
        <p>All reservations are strictly non-refundable. Once a reservation has been confirmed and payment has been received:</p>
        <ul>
          <li>No full or partial refunds will be issued under any circumstances.</li>
          <li>No deposits, advance payments, or reservation fees will be returned.</li>
          <li>No refunds will be provided for cancellations made by the guest, regardless of the reason.</li>
          <li>No refunds will be provided in cases of no-show.</li>
          <li>No refunds will be provided for early departures or unused nights.</li>
          <li>No refunds will be provided due to weather conditions, illness, personal emergencies, travel disruptions, transportation issues, documentation problems, border restrictions, changes in plans, or any other circumstance beyond the control of CenterStays Apartments.</li>
        </ul>
        <p>By making a reservation, the guest expressly agrees that all payments are final and non-refundable.</p>

        <h2>3. Reservation Changes</h2>
        <p>CenterStays Apartments is under no obligation to modify, reschedule, transfer, or alter any reservation after confirmation. Any request for changes may be considered solely at the discretion of CenterStays Apartments and may be accepted or declined without explanation.</p>

        <h2>4. Privacy & Data Protection</h2>
        <p>CenterStays Apartments is committed to protecting the privacy of its guests. Personal information is collected solely for the purpose of processing reservations and providing accommodation services.</p>
        <p>Guest information will never be sold, rented, or shared with third parties for marketing, advertising, or commercial purposes. Personal information will not be disclosed to any third party except where required by applicable law or governmental authorities. CenterStays Apartments does not use guest information for unsolicited marketing communications without consent. Personal data is retained only for as long as necessary to complete reservations, provide services, and comply with legal obligations. After the required retention period, personal information may be securely deleted or anonymized.</p>

        <h2>5. Limitation of Liability</h2>
        <p>CenterStays Apartments shall not be held responsible for any losses, expenses, cancellations, delays, travel disruptions, personal injuries, damages, or inconveniences arising before, during, or after a reservation, except where required by applicable law. Guests are responsible for obtaining any travel insurance they deem necessary.</p>

        <h2>6. Acceptance of Terms</h2>
        <p>By accessing the website, making a reservation, or submitting payment, the guest confirms that they have read, understood, and accepted this Cancellation, Refund & Privacy Policy in its entirety. If a guest does not agree with these terms, they should not proceed with a reservation.</p>

        <h2>7. Contact Information</h2>
        <p>
          CenterStays Apartments<br />
          Website: <a href="https://centerstays.apartments" target="_blank" rel="noreferrer">https://centerstays.apartments</a><br />
          Phone: +383 48 110 988<br />
          Email: <a href="mailto:centerstays@gmail.com">centerstays@gmail.com</a>
        </p>
      </div>

      <div className="mt-8">
        <Link to="/" className="text-blue-600 underline">Back to home</Link>
      </div>
    </div>
  )
}
