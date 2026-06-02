import React from 'react'

export default function ApartmentCard({ room, images = [], onOpenGallery = () => {} }) {
  const hasImages = images && images.length > 0

  return (
    <article className="group bg-white rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-transform transform hover:-translate-y-2">
      <div className="relative h-56 md:h-64 lg:h-72 bg-gray-100">
        {hasImages ? (
          <div className="w-full h-full relative">
            <img src={images[0]} alt={room.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            {images.length > 1 && (
              <div className="absolute left-3 bottom-3 bg-white/80 text-sm text-charcoal rounded-full px-3 py-1 shadow">{images.length} bilder</div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-charcoal">{room.name}</h3>
            <p className="text-sm text-gray-600 mt-1">{room.description}</p>
          </div>
          <div className="text-right ml-4">
            <div className="text-brand font-medium">{room.price}</div>
            <div className="mt-1 text-xs text-gray-500">{room.guests || '2'} mysafirë</div>
          </div>
        </div>

        <ul className="mt-3 flex flex-wrap gap-2">
          {(room.features || []).slice(0, 4).map((f) => (
            <li key={f} className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">{f}</li>
          ))}
        </ul>

        <div className="mt-4 flex items-center gap-3">
          <button onClick={() => onOpenGallery()} className="btn-premium px-4 py-2">Shiko Detajet</button>
          <a href={`https://wa.me/38344123456?text=${encodeURIComponent(`Hello, I'd like to book ${room.name}`)}`} className="px-4 py-2 rounded-md bg-[#CBAA6A] text-white">Book Now</a>
        </div>
      </div>
    </article>
  )
}
