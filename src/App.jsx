import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import FloatingWhatsApp from './components/FloatingWhatsApp'

import Ballina from './pages/Ballina'
import Sherbimet from './pages/Sherbimet'
import Rreth from './pages/Rreth'
import Dhomat from './pages/Dhomat'
import BlogPage from './pages/BlogPage'
import Kontakti from './pages/Kontakti'

export default function App() {
  return (
    <Router>
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
          </Routes>
        </main>
        <Footer />
        <FloatingWhatsApp />
      </div>
    </Router>
  )
}
