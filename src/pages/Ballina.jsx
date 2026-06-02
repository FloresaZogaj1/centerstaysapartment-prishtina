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

export default function Ballina() {
  return (
    <div>
      <Hero />
      <BookingStrip />
      <section className="py-16"><Rooms /></section>
      <section className="py-16"><Amenities /></section>
  <section className="py-16"><Services /></section>
  <section className="py-16"><CityExperience /></section>
  <section className="py-16"><Gallery /></section>
  <section className="py-16"><About /></section>
  <section className="py-16"><Blog /></section>
  <section className="py-16"><Contact /></section>
    </div>
  )
}
