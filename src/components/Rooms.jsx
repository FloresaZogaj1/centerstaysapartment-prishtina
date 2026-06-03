import React, { useState } from 'react'
import RoomLightbox from './RoomLightbox'
import ApartmentCard from './ApartmentCard'

const rooms = [
  {
    id: 'standard',
    name: 'Standard Apartment',
    price: 'Nga €45 / nata',
    description: 'Zgjidhje praktike dhe komode për qëndrime të shkurtra në qytet.',
    features: ['1 dhomë gjumi', 'Wi‑Fi', 'Kuzhinë e vogël', 'Banjo private'],
  image: '/Instagram_files/659025397_18076753307428513_1454559748560419820_n.jpg'
  },
  {
    id: 'deluxe',
    name: 'Deluxe Apartment',
    price: 'Nga €60 / nata',
    description: 'Apartament më i gjerë me dizajn modern dhe më shumë rehati.',
    features: ['1–2 dhoma', 'Ambient i ndriçuar', 'Kuzhinë', 'TV', 'Wi‑Fi'],
  image: '/Instagram_files/656314906_18076753487428513_4009666761995664575_n.jpg'
  },
  {
    id: 'premium',
    name: 'Premium City Stay',
    price: 'Nga €80 / nata',
    description: 'Qëndrim premium në lokacion qendror për eksperiencë më të kompletuar.',
    features: ['Pamje qyteti', 'Hapësirë më e madhe', 'Stil modern', 'Pajisje të plota'],
  image: '/Instagram_files/648631785_18074365370428513_4289514915533021647_n.jpg'
  }
]

export default function Rooms() {
  // organized image groups per room type
  const groups = {
    standard: Array.from({ length: 6 }).map((_, i) => `/apartment${i + 1}.jpeg`), // 1..6
    deluxe: Array.from({ length: 7 }).map((_, i) => `/apartment${7 + i}.jpeg`),   // 7..13
    premium: Array.from({ length: 6 }).map((_, i) => `/apartment${14 + i}.jpeg`), // 14..19
  }

  const [isOpen, setIsOpen] = useState(false)
  const [currentImages, setCurrentImages] = useState(groups.standard)
  const [startIndex, setStartIndex] = useState(0)
  const [currentTitle, setCurrentTitle] = useState('')
  const [currentDetails, setCurrentDetails] = useState(null)

  function openGalleryForRoom(roomId, index = 0, title = '', details = null) {
    const imgs = groups[roomId] || groups.standard
    setCurrentImages(imgs)
    setStartIndex(index)
    setCurrentTitle(title)
    setCurrentDetails(details)
    setIsOpen(true)
  }

  function closeGallery() {
    setIsOpen(false)
  }
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-heading font-semibold">Dhoma dhe Apartamentet tona</h2>
        <p className="mt-3 text-gray-600 max-w-2xl mx-auto">Eksploro koleksionin tonë të apartamenteve të dizajnuara për rehati dhe stil. Zgjidhni një apartament dhe shikoni galerinë, detajet dhe mundësinë për të rezervuar menjëherë.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {rooms.map((r) => {
          const imgs = groups[r.id] || groups.standard
          const roomWithImage = { ...r, image: r.image || imgs[0] }
          return (
            <ApartmentCard key={r.id} room={roomWithImage} images={imgs} onOpenGallery={() => openGalleryForRoom(r.id, 0, r.name, r)} />
          )
        })}
      </div>

      {/* Removed the 'Shiko të gjitha dhomat' button as per simplified UX */}

      <RoomLightbox images={currentImages} isOpen={isOpen} startIndex={startIndex} title={currentTitle} details={currentDetails} onClose={closeGallery} />
    </div>
  )
}
