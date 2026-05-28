import React from 'react'

export default function Hero() {
  const bg = 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=compress&cs=tinysrgb&w=1600&h=900&fit=crop'
  return (
    <section className="w-full" style={{ marginTop: '72px' }}>
      <div className="relative w-full" style={{ minHeight: 'calc(100vh - 72px)' }}>
        <img src={bg} alt="Apartment" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/50" />

        <div className="relative z-10 h-full">
          <div className="max-w-7xl mx-auto h-full flex items-start md:items-center">
            <div className="w-full px-6 sm:px-8 md:px-12 lg:pl-[7%] mt-[12vh] md:mt-0">
              <div className="max-w-3xl mx-auto md:mx-0">
                <h1 className="text-white font-extralight leading-tight tracking-tight text-[clamp(28px,6.5vw,88px)] text-center md:text-left">
                  Përjeto qytetin — qëndro në zemër të tij
                </h1>
                <p className="mt-4 text-white text-base md:text-lg max-w-xl text-center md:text-left">Qëndro në zemër të qytetit me apartamente moderne dhe komode.</p>

                <div className="mt-8 md:mt-12 flex justify-center md:justify-start">
                  <a
                    href="#dhomat"
                    className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-white text-white text-base md:text-lg hover:bg-white hover:text-black transition"
                  >
                    Eksploro Tani
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
