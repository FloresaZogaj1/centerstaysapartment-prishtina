import React from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import SwiperCore, { Autoplay, EffectFade, Navigation, Pagination } from 'swiper'
import 'swiper/css'
import 'swiper/css/effect-fade'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

SwiperCore.use([Autoplay, EffectFade, Navigation, Pagination])

const slides = [
  { image: '/Instagram_files/473136151_18033560417428513_1733372448230331900_n.jpg', title: 'Luxury Apartments in the Heart of Prishtina', subtitle: 'Premium comfort, elegant interiors and effortless city access.' },
  { image: '/Instagram_files/472444962_18033090281428513_3178507849621599111_n.jpg', title: 'Modern interiors & refined service', subtitle: 'Stay central with boutique comforts.' },
  { image: '/Instagram_files/473072333_18033104654428513_7026816142457014555_n.jpg', title: 'Designed for comfort', subtitle: 'Large spaces, thoughtful amenities and easy access.' }
]

export default function HeroSlider() {
  return (
    <div className="hero-slide relative overflow-hidden">
      <Swiper
        effect="fade"
        spaceBetween={0}
        slidesPerView={1}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        loop
        navigation
        pagination={{ clickable: true }}
        className="h-full"
      >
        {slides.map((s, i) => (
          <SwiperSlide key={i}>
            <div className="w-full h-full relative" style={{ backgroundImage: `url(${s.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
              <div className="absolute inset-0 bg-black/50" />
              <div className="absolute inset-0 flex items-center justify-center px-6">
                <div className="text-center max-w-3xl text-white">
                  <h1 className="text-3xl md:text-5xl lg:text-6xl font-heading leading-tight">{s.title}</h1>
                  <p className="mt-4 text-md md:text-lg opacity-90">{s.subtitle}</p>
                  <div className="mt-6 flex items-center justify-center gap-3">
                    <button className="btn-premium">Check Availability</button>
                    <button className="px-4 py-2 rounded-md border border-white/20 text-white">View Apartments</button>
                    <a href={`https://wa.me/38344123456?text=${encodeURIComponent('Hello, I would like to check availability for CenterStays Apartments in Prishtina.')}`} className="px-4 py-2 rounded-md bg-white text-charcoal">Book via WhatsApp</a>
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  )
}
