import React from 'react'
import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import FloatingWhatsApp from './components/FloatingWhatsApp'
import BookingProvider from './components/BookingProvider'

import Ballina from './pages/Ballina'
import Sherbimet from './pages/Sherbimet'
import Rreth from './pages/Rreth'
import Dhomat from './pages/Dhomat'
import BlogPage from './pages/BlogPage'
import Kontakti from './pages/Kontakti'
import PaymentSuccess from './pages/PaymentSuccess'
import PaymentFail from './pages/PaymentFail'
import PaymentCancel from './pages/PaymentCancel'

export default function App() {
  return (
    <Router>
      <BookingProvider>
        <div className="min-h-screen bg-white text-charcoal">
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<Ballina />} />
              <Route path="/sherbimet" element={<Sherbimet />} />
              <Route path="/rreth" element={<Rreth />} />
              <Route path="/dhomat" element={<Dhomat />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/kontakti" element={<Kontakti />} />
              <Route path="/payment/success" element={<PaymentSuccess />} />
              <Route path="/payment/fail" element={<PaymentFail />} />
              <Route path="/payment/cancel" element={<PaymentCancel />} />
            </Routes>
          </main>
          <Footer />
          <FloatingWhatsApp />
        </div>
      </BookingProvider>
    </Router>
  )
}
