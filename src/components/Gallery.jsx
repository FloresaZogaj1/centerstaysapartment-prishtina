import React, { useMemo, useState } from 'react'

// Map actual folders to gallery categories. The folders exist in the project root and are served from /
const bedroomFiles = [
  '/beedrom/apartment11.jpeg', '/beedrom/apartment14.jpeg', '/beedrom/apartment12.jpeg', '/beedrom/apartment13.jpeg', '/beedrom/apartment16.jpeg', '/beedrom/apartment17.jpeg', '/beedrom/apartment9.jpeg', '/beedrom/foto10.avif', '/beedrom/foto4.avif'
]

const livingFiles = [
  '/living/apartment1.jpeg','/living/apartment10.jpeg','/living/apartment19.jpeg','/living/apartment2.jpeg','/living/apartment5.jpeg','/living/apartment6.jpeg','/living/apartment8.jpeg','/living/foto2.avif','/living/foto7.avif','/living/foto8.avif','/living/foto99.avif'
]

const kitchenFiles = [
  '/kitchen/apartment15.jpeg','/kitchen/apartment3.jpeg','/kitchen/apartment4.jpeg','/kitchen/foto1.avif','/kitchen/foto11.avif','/kitchen/foto9.avif'
]

const bathroomFiles = [
  '/bathroom/apartment7.jpeg','/bathroom/foto6.avif'
]


export default function Gallery() {
  const [filter, setFilter] = useState('All')

  // build a data array with src, category, title
  const galleryData = useMemo(() => {
    const make = (arr, category) => arr.map(src => ({ src, category, title: category }))
    return [
      ...make(bedroomFiles, 'Bedroom'),
      ...make(livingFiles, 'Living'),
      ...make(kitchenFiles, 'Kitchen'),
      ...make(bathroomFiles, 'Bathroom')
    ]
  }, [])

    const categories = ['All', 'Bedroom', 'Living', 'Kitchen', 'Bathroom']

  const list = useMemo(() => {
    if (filter === 'All') return galleryData
    return galleryData.filter(i => i.category === filter)
  }, [filter, galleryData])

  // fallback image to avoid broken icons (safe file present in public/)
  const fallback = '/foto1.avif'

  return (
    <div id="gallery" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-heading font-semibold">Galeria Premiere</h2>
        <p className="mt-3 text-gray-600">Pamje që kapin tonin dhe stilin e apartamenteve tona. Përdorni filtrat për të shfaqur kategori specifike.</p>
      </div>

      <div className="flex flex-wrap gap-3 justify-center mb-6">
        {categories.map((c) => (
          <button key={c} onClick={() => setFilter(c)} className={`px-4 py-2 rounded-full ${filter === c ? 'bg-[#CBAA6A] text-white' : 'bg-white text-charcoal border border-gray-200'}`}>
            {c}
          </button>
        ))}
      </div>

      <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
        {list.map((item, i) => (
          <figure key={item.src + i} className="break-inside-avoid overflow-hidden rounded-xl relative group">
            <img src={item.src} alt={item.title || `gallery ${i}`} onError={(e)=>{e.currentTarget.src=fallback}} className="w-full object-cover h-64 md:h-48 lg:h-64 transform group-hover:scale-105 transition duration-500" />
            <figcaption className="absolute left-3 bottom-3 bg-black/60 text-white px-3 py-1 rounded text-sm">{item.category}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}
