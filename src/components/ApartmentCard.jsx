import React, { useState, useEffect } from 'react'

export default function ApartmentCard({ room, images = [], onOpenGallery = () => {} }) {
  // fallback image choices
  const instagramFallback = '/Instagram_files/473136151_18033560417428513_1733372448230331900_n.jpg'
  const safeFallback = '/foto1.avif'
  const initialSrc = (images && images[0]) || room.image || instagramFallback
  const [src, setSrc] = useState(initialSrc)

  useEffect(() => {
    const img = new Image()
    img.onload = () => setSrc(initialSrc)
    img.onerror = () => setSrc(room.image || safeFallback)
    img.src = initialSrc
  }, [initialSrc, room.image])

  function handleImageError(e) {
    e.currentTarget.src = room.image || safeFallback
  }

  function handleOpenGallery() {
    // open the gallery/lightbox
    if (onOpenGallery) onOpenGallery()
    // ensure gallery section is visible
    const gallery = document.querySelector('#gallery')
    if (gallery) gallery.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <article className="group bg-white rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-transform transform hover:-translate-y-2 h-full flex flex-col">
      <div className="relative h-72 bg-gray-100 overflow-hidden">
        <button aria-label={`Open gallery for ${room.name}`} onClick={handleOpenGallery} className="absolute inset-0 p-0 m-0 border-0 bg-transparent cursor-pointer">
          <img src={src} alt={room.name} onError={handleImageError} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 rounded-t-xl" />
        </button>

        {images && images.length > 1 && (
          <button onClick={handleOpenGallery} className="absolute left-3 bottom-3 bg-white/90 text-sm text-charcoal rounded-full px-3 py-1 shadow">
            {images.length} imazhe
          </button>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-charcoal">{room.name}</h3>
            <p className="text-sm text-gray-600 mt-1 min-h-[48px]">{room.description}</p>
          </div>

          <div className="text-right ml-4 flex-shrink-0">
            <div className="text-brand font-medium whitespace-nowrap">{room.price}</div>
            <div className="mt-1 text-xs text-gray-500">{room.guests || '2'} mysafirë</div>
          </div>
        </div>

        <ul className="mt-3 flex flex-wrap gap-2">
          {(room.features || []).slice(0, 4).map((f) => (
            <li key={f} className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">{f}</li>
          ))}
        </ul>

        <div className="mt-auto flex items-center justify-center pt-4">
          <button onClick={() => { const el = document.getElementById('availability') || document.getElementById('kontakti') || document.getElementById('contact'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }) }} className="px-4 py-2 rounded-md bg-[#CBAA6A] text-white">Check Availability</button>
        </div>
      </div>
    </article>
  )
}
