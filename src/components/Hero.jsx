import React from 'react'

export default function Hero() {
  const bg = 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=compress&cs=tinysrgb&w=1600&h=900&fit=crop'
  return (
    <section className="w-full" style={{ marginTop: '90px' }}>
      <div className="relative w-full" style={{ height: 'calc(100vh - 90px)' }}>
        <img src={bg} alt="Apartment" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/50" />

        <div className="relative z-10 h-full">
          <div className="max-w-7xl mx-auto h-full flex items-start" style={{ paddingLeft: '7%' }}>
            <div className="mt-[20vh] max-w-3xl">
              <h1 className="text-white font-extralight leading-[0.9] tracking-tight text-[clamp(48px,8vw,110px)]">
                Përjeto qytetin qëndro në zemër të tij
              </h1>
              <p className="mt-4 text-white text-[18px] max-w-xl">Qëndro në zemër të qytetit me apartamente moderne dhe komode.</p>

              <div className="mt-16">
                <a
                  href="#dhomat"
                  className="inline-flex items-center justify-center w-[185px] h-[58px] rounded-full border border-white text-white text-lg hover:bg-white hover:text-black transition"
                >
                  Eksploro Tani
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
