import React from 'react'
import Hero from '../components/Hero'
import BookingStrip from '../components/BookingStrip'
import Rooms from '../components/Rooms'
import Services from '../components/Services'
import CityExperience from '../components/CityExperience'
import Amenities from '../components/Amenities'
import About from '../components/About'
import Blog from '../components/Blog'
import Contact from '../components/Contact'
import Gallery from '../components/Gallery'
import InquiryForm from '../components/InquiryForm'

export default function Ballina() {
  return (
    <div>
      <Hero />
      <BookingStrip />
  <section id="apartments" className="py-16"><Rooms /></section>
      <section className="py-16"><Amenities /></section>
  <section className="py-16"><Services /></section>
  <section className="py-16"><CityExperience /></section>
  <section className="py-16"><Gallery /></section>
  <section className="py-16"><About /></section>
  <section className="py-16"><Blog /></section>
  <section className="py-16"><Contact /></section>

      <section className="py-16 bg-ivory">
    <div className="max-w-4xl mx-auto px-6">
      <div className="p-6">
        {/* Compact inquiry section replaces the large booking engine */}
        <InquiryForm />
      </div>
    </div>
  </section>
    </div>
  )
}
