import React, { useMemo, useState } from 'react'

// Map actual folders to gallery categories. The folders exist in the project root and are served from /
const bedroomFiles = [
  'aparmtment11.jpeg', 'aparmtnetn14.jpeg', 'apartment12.jpeg', 'apartment13.jpeg', 'apartment16.jpeg', 'apartment17.jpeg', 'apartment9.jpeg', 'foto10.avif', 'foto4.avif'
].map(f => `/beedrom/${f}`)

const livingFiles = [
  'apartment1.jpeg','apartment10.jpeg','apartment19.jpeg','apartment2.jpeg','apartment5.jpeg','apartment6.jpeg','apartment8.jpeg','foto2.avif','foto7.avif','foto8.avif','foto99.avif'
].map(f => `/living/${f}`)

const kitchenFiles = [
  'apartment15.jpeg','apartment3.jpeg','apartment4.jpeg','foto1.avif','foto11.avif','foto9.avif'
].map(f => `/kitchen/${f}`)

const bathroomFiles = [
  'apartment7.jpeg','foto6.avif'
].map(f => `/bathroom/${f}`)


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

  // fallback image to avoid broken icons
  const fallback = '/Instagram_files/473136151_18033560417428513_1733372448230331900_n.jpg'

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
