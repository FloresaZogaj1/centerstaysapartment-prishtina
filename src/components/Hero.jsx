import React from 'react'

// Temporary static hero fallback to avoid runtime errors from the slider.
// Revert to the Swiper-based `HeroSlider` once HMR/import issues are resolved.
export default function Hero() {
  const slide = {
    image: '/Instagram_files/473136151_18033560417428513_1733372448230331900_n.jpg',
    title: 'Luxury Apartments in the Heart of Prishtina',
    subtitle: 'Premium comfort, elegant interiors and effortless city access.'
  }

  return (
    <section className="w-full" style={{ marginTop: '72px' }}>
      <div
        className="relative w-full h-[60vh] flex items-center justify-center bg-cover bg-center"
        style={{ backgroundImage: `url(${slide.image})` }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative text-center text-white px-6">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-heading leading-tight">{slide.title}</h1>
          <p className="mt-4 text-md md:text-lg opacity-90">{slide.subtitle}</p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button className="btn-premium">Check Availability</button>
            <button className="px-4 py-2 rounded-md border border-white/20 text-white">View Apartments</button>
            <a href={`https://wa.me/38344123456?text=${encodeURIComponent('Hello, I would like to check availability for CenterStays Apartments in Prishtina.')}`} className="px-4 py-2 rounded-md bg-white text-charcoal">Book via WhatsApp</a>
          </div>
        </div>
      </div>
    </section>
  )
}
