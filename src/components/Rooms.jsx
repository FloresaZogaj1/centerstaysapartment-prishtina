import React, { useState, useEffect } from 'react'
import RoomLightbox from './RoomLightbox'
import ApartmentCard from './ApartmentCard'
import BookingModal from './BookingModal'
import { getRooms } from '../api/bookingApi'

// We'll fetch rooms from backend and map them to the UI shape ApartmentCard expects.

export default function Rooms() {
  // organized image groups per room type
  // Use explicit filenames that exist in /public so deployment (case-sensitive) shows images correctly.
  const groups = {
    standard: [
      '/apartment1.jpeg',
      '/apartment2.jpeg',
      '/apartment3.jpeg',
      '/apartment4.jpeg',
      '/apartment5.jpeg',
      '/apartment6.jpeg'
    ],
    deluxe: [
      '/apartment7.jpeg',
      '/apartment8.jpeg',
      '/apartment9.jpeg',
      '/apartment10.jpeg',
      '/apartment12.jpeg',
      '/apartment13.jpeg'
    ],
    premium: [
      '/apartment15.jpeg',
      '/apartment16.jpeg',
      '/apartment17.jpeg',
      '/apartment19.jpeg'
    ]
  }

  const [isOpen, setIsOpen] = useState(false)
  const [currentImages, setCurrentImages] = useState(groups.standard)
  const [startIndex, setStartIndex] = useState(0)
  const [currentTitle, setCurrentTitle] = useState('')
  const [currentDetails, setCurrentDetails] = useState(null)
  const [bookingOpen, setBookingOpen] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const data = await getRooms()
        if (!mounted) return
        // Some backends may return an object { value: [...] } or the array directly.
        const list = Array.isArray(data) ? data : (data.value || [])
        // Map backend fields to UI shape expected by ApartmentCard
        const mapped = list.map(r => ({
          _id: r._id,
          id: r._id, // keep a unique key
          name: r.name,
          description: r.description,
          price: r.basePricePerNight ? `€${r.basePricePerNight} / nata` : '',
          basePricePerNight: r.basePricePerNight,
          features: r.amenities || [],
          image: r.imageUrl || (groups[r.slug] ? groups[r.slug][0] : groups.standard[0]),
          raw: r,
        }))
        setRooms(mapped)
      } catch (err) {
        console.error('Failed to load rooms:', err)
        setError(err.message || 'Failed to load rooms')
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  function openGalleryForRoom(roomId, index = 0, title = '', details = null) {
    const imgs = groups[roomId] || groups.standard
    setCurrentImages(imgs)
    setStartIndex(index)
    setCurrentTitle(title)
    setCurrentDetails(details)
    setIsOpen(true)
  }

  function openBookingForRoom(room) {
    // room here is the local room object from rooms[]; map to API room shape if needed
    setSelectedRoom(room)
    setBookingOpen(true)
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
        {loading && <div>Loading rooms...</div>}
        {error && <div className="text-red-500">{error}</div>}
        {!loading && !error && rooms.map((r) => {
          const imgs = groups[r.slug] || groups.standard
          const roomWithImage = { ...r, image: r.image || imgs[0] }
          // Pass the full backend room object onBook so BookingFormV2 gets _id and basePricePerNight
          return (
            <ApartmentCard key={r.id} room={roomWithImage} images={imgs} onOpenGallery={() => openGalleryForRoom(r.id, 0, r.name, r.raw)} onBook={() => openBookingForRoom(r.raw)} />
          )
        })}
      </div>

      {/* Removed the 'Shiko të gjitha dhomat' button as per simplified UX */}

  <RoomLightbox images={currentImages} isOpen={isOpen} startIndex={startIndex} title={currentTitle} details={currentDetails} onClose={closeGallery} />
  <BookingModal isOpen={bookingOpen} onClose={() => setBookingOpen(false)} initialData={{ room: selectedRoom }} />
    </div>
  )
}
