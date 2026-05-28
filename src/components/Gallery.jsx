import React from 'react'

const pics = [
  '/Instagram_files/473136151_18033560417428513_1733372448230331900_n.jpg',
  '/Instagram_files/473141833_18033568253428513_5936350848935318016_n.jpg',
  '/Instagram_files/472444962_18033090281428513_3178507849621599111_n.jpg',
  '/Instagram_files/472018000_1248431362937566_3208334774464705125_n.jpg',
  '/Instagram_files/472015822_18032991689428513_6833907839299376487_n.jpg',
  '/Instagram_files/473072333_18033104654428513_7026816142457014555_n.jpg',
  '/Instagram_files/473374918_18033498602428513_5607206984285640050_n.jpg'
]

export default function Gallery() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold">Galeria jonë</h2>
        <p className="mt-2 text-gray-600">Disa pamje nga apartamentet dhe ambiente të afërta që ilustrojnë stilin dhe rehati që ofrojmë.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[120px]">
        {/* Large tile */}
        <div className="col-span-2 row-span-2 overflow-hidden rounded-xl">
          <img src={pics[0]} alt="Pamje apartamenti" className="w-full h-full object-cover transform hover:scale-105 transition" />
        </div>

        <div className="overflow-hidden rounded-xl">
          <img src={pics[1]} alt="Detaj lampi" className="w-full h-full object-cover transform hover:scale-105 transition" />
        </div>

        <div className="overflow-hidden rounded-xl">
          <img src={pics[2]} alt="Mobilim i rehatshëm" className="w-full h-full object-cover transform hover:scale-105 transition" />
        </div>

        <div className="col-span-2 overflow-hidden rounded-xl md:col-span-1 lg:col-span-2">
          <img src={pics[3]} alt="Dhomë me dritare" className="w-full h-full object-cover transform hover:scale-105 transition" />
        </div>

        <div className="overflow-hidden rounded-xl">
          <img src={pics[4]} alt="Hapësirë e ngrohtë" className="w-full h-full object-cover transform hover:scale-105 transition" />
        </div>

        <div className="overflow-hidden rounded-xl">
          <img src={pics[5]} alt="Pamje kuzhine" className="w-full h-full object-cover transform hover:scale-105 transition" />
        </div>

        <div className="col-span-2 overflow-hidden rounded-xl md:col-span-3 lg:col-span-1">
          <img src={pics[6]} alt="Detaj dekor" className="w-full h-full object-cover transform hover:scale-105 transition" />
        </div>
      </div>
    </div>
  )
}
