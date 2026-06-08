import React from 'react'

export default function PageHero({ title, subtitle, ctaText, ctaHref, bg }) {
  const bgImg = bg || '/foto1.avif'
  return (
  // reduced top margin so header and hero sit closer
  // Small gap to account for fixed header (72px) but keep content visually tight
  <section className="w-full" style={{ marginTop: '8px' }}>
      <div className="relative w-full" style={{ height: '48vh' }}>
        <img src={bgImg} alt={title} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/45" />

        <div className="relative z-10 h-full flex items-center">
          <div className="max-w-6xl mx-auto px-6">
            <div className="max-w-3xl">
              <h1 className="text-white font-extralight leading-snug tracking-tight text-[clamp(28px,6vw,56px)]">{title}</h1>
              {subtitle && <p className="mt-4 text-white text-lg max-w-xl">{subtitle}</p>}

              {ctaText && (
                <div className="mt-6">
                  <a href={ctaHref || '#'} className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-brand text-white shadow">{ctaText}</a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
