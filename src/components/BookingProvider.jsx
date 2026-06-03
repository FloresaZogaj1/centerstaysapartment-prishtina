import React, { createContext, useContext, useState } from 'react'
import BookingModal from './BookingModal'

const BookingContext = createContext()

export function useBooking() {
  return useContext(BookingContext)
}

export default function BookingProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false)
  const [initialData, setInitialData] = useState(null)

  function openBooking(data = null) {
    setInitialData(data)
    setIsOpen(true)
    // prevent background scroll
    document.body.style.overflow = 'hidden'
  }

  function closeBooking() {
    setIsOpen(false)
    setInitialData(null)
    document.body.style.overflow = ''
  }

  const value = { isOpen, openBooking, closeBooking, initialData }

  return (
    <BookingContext.Provider value={value}>
      {children}
      <BookingModal isOpen={isOpen} onClose={closeBooking} initialData={initialData} />
    </BookingContext.Provider>
  )
}
