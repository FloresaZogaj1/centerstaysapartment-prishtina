import React from 'react'
import Hero from '../components/Hero'
import Services from '../components/Services'
import About from '../components/About'
import Rooms from '../components/Rooms'
import Blog from '../components/Blog'
import BookingStrip from '../components/BookingStrip'
import CityExperience from '../components/CityExperience'

export default function Home() {
  return (
    <div>
      <Hero />
      <BookingStrip />
      <section className="py-16"><Rooms /></section>
      <section className="py-16"><Services /></section>
      <section className="py-16"><CityExperience /></section>
      <section className="py-16"><About /></section>
      <section className="py-16"><Blog /></section>
    </div>
  )
}
