import React, { useMemo, useState } from 'react'

const allPics = [
  '/Instagram_files/473136151_18033560417428513_1733372448230331900_n.jpg',
  '/Instagram_files/473141833_18033568253428513_5936350848935318016_n.jpg',
  '/Instagram_files/472444962_18033090281428513_3178507849621599111_n.jpg',
  '/Instagram_files/472018000_1248431362937566_3208334774464705125_n.jpg',
  '/Instagram_files/472015822_18032991689428513_6833907839299376487_n.jpg',
  '/Instagram_files/473072333_18033104654428513_7026816142457014555_n.jpg',
  '/Instagram_files/473374918_18033498602428513_5607206984285640050_n.jpg'
]
export default function Gallery() {
  const [filter, setFilter] = useState('All')

  // naive categories for demo mapping
  const categories = useMemo(() => ({
    All: allPics,
    Bedroom: [allPics[0], allPics[2], allPics[4]],
    Living: [allPics[1], allPics[5]],
    Kitchen: [allPics[3]],
    Bathroom: [allPics[6]],
    Details: [allPics[1], allPics[6]],
    City: [allPics[0], allPics[3]]
  }), [])

  const list = categories[filter] || allPics

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-heading font-semibold">Galeria Premiere</h2>
        <p className="mt-3 text-gray-600">Pamje që kapin tonin dhe stilin e apartamenteve tona. Përdorni filtrat për të shfaqur kategori specifike.</p>
      </div>

      <div className="flex flex-wrap gap-3 justify-center mb-6">
        {Object.keys(categories).map((c) => (
          <button key={c} onClick={() => setFilter(c)} className={`px-4 py-2 rounded-full ${filter === c ? 'bg-[#CBAA6A] text-white' : 'bg-white text-charcoal border border-gray-200'}`}>
            {c}
          </button>
        ))}
      </div>

      <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
        {list.map((src, i) => (
          <figure key={src + i} className="break-inside-avoid overflow-hidden rounded-xl relative group">
            <img src={src} alt={`gallery ${i}`} className="w-full object-cover transform group-hover:scale-105 transition duration-500" />
            <figcaption className="absolute left-3 bottom-3 bg-black/60 text-white px-3 py-1 rounded text-sm">{filter !== 'All' ? filter : 'Interiors'}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}
