import React from 'react'
import { Link } from 'react-router-dom'

export default function Privacy() {
  return (
    <div className="max-w-4xl mx-auto py-16 px-4">
      <div style={{background:'#60a5fa', color:'#fff', padding:'8px', borderRadius:6, marginBottom:12}}>TEST BANNER: Privacy page rendered</div>
      <h1 className="text-3xl font-semibold">Privacy & Cookies</h1>
      <p className="text-sm text-gray-600 mt-2">Updated: 06 October 2025</p>

      <div className="prose prose-lg mt-6">
        <h2>1. Who we are</h2>
        <p>CenterStays Apartments provides modern, comfortable and centrally located accommodation in Prishtina. We respect your privacy and process personal data in accordance with GDPR principles and applicable local laws.</p>

        <h2>2. What data we collect</h2>
        <p>We may collect:</p>
        <ul>
          <li>Identification and contact data, including first name, last name, email address and phone number.</li>
          <li>Reservation data, including check-in date, check-out date, number of guests and selected services.</li>
          <li>Payment data, processed securely through the payment provider. We do not store credit or debit card details.</li>
          <li>Technical data, including cookies, IP address, browser type and device information for website functionality, analytics and security.</li>
        </ul>

        <h2>3. How we use your data</h2>
        <p>We use your data to manage your reservation and accommodation, to send booking confirmations, invoices and payment-related notifications, to provide customer support, to maintain website security and prevent misuse, to improve our services and website experience, and with your consent, for marketing updates or promotional communication, where applicable.</p>

        <h2>4. Legal basis</h2>
        <p>We process your data based on contractual necessity for reservation and accommodation services, legal obligations related to invoices, accounting and reporting, legitimate interest for security, service improvement and fraud prevention, and consent for optional marketing and non-essential cookies.</p>

        <h2>5. Sharing with third parties</h2>
        <p>We only share personal data when necessary, including with payment processors, IT, hosting and website service providers, reservation platforms when reservations are made through third-party platforms, and public authorities where required by law. We do not sell or rent guest personal data.</p>

        <h2>6. Cookies</h2>
        <p>We use cookies to ensure the website works properly, improve performance and support analytics.</p>
        <p>Types of cookies: Essential cookies, Analytics cookies, Marketing cookies (used only with consent).</p>

        <h2>7. Data retention and security</h2>
        <p>Personal data is retained only for as long as necessary for reservations, customer support, accounting, legal compliance and legitimate business purposes. We apply reasonable technical and organizational measures to protect the confidentiality, integrity and availability of personal data.</p>

        <h2>8. Your rights</h2>
        <p>Depending on applicable law, you may have the right to access, correct, delete, restrict or port your personal data, withdraw consent for marketing or optional cookies, and submit a complaint to the competent data protection authority.</p>

        <h2>9. Minors</h2>
        <p>Our services are intended for adults. Reservations by minors require the presence and approval of a parent or legal guardian.</p>

        <h2>10. Contact</h2>
        <p>
          For any privacy or personal data request, contact us at:<br />
          CenterStays Apartments<br />
          Phone: +383 48 110 988<br />
          Email: <a href="mailto:centerstays@gmail.com">centerstays@gmail.com</a><br />
          Website: <a href="https://centerstays.apartments" target="_blank" rel="noreferrer">https://centerstays.apartments</a>
        </p>
      </div>

      <div className="mt-8">
        <Link to="/" className="text-blue-600 underline">Back to home</Link>
      </div>
    </div>
  )
}
