import React, { useEffect, useState } from 'react'

export default function RoomLightbox({ images = [], isOpen, startIndex = 0, title = '', details = null, onClose = () => {} }) {
  const imgs = Array.isArray(images) ? images : []
  const [index, setIndex] = useState(Math.max(0, startIndex || 0))
  const [zoomed, setZoomed] = useState(false)

  useEffect(() => {
    setIndex(Math.max(0, startIndex || 0))
  }, [startIndex, isOpen])

  useEffect(() => {
    if (!isOpen) return
    function onKey(e) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(i + 1, imgs.length - 1))
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(i - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, imgs.length, onClose])

  useEffect(() => {
    if (!isOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prevOverflow }
  }, [isOpen])

  if (!isOpen) return null

  function prev() { setZoomed(false); setIndex((i) => Math.max(i - 1, 0)) }
  function next() { setZoomed(false); setIndex((i) => Math.min(i + 1, imgs.length - 1)) }

  function download() {
    const src = imgs[index]
    if (!src) return
    try {
      const a = document.createElement('a')
      a.href = src
      a.download = src.split('/').pop()
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch (e) {
      // ignore
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div className="w-full max-w-[1200px] h-[88vh] bg-white rounded-xl overflow-hidden flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
          <div>
            <div className="text-lg font-semibold text-charcoal">{title || 'Pamje'}</div>
            <div className="text-sm text-gray-500">{index + 1} / {imgs.length || 0}</div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={download} className="px-3 py-2 bg-gray-50 rounded hover:bg-gray-100">Shkarko</button>
            <button onClick={() => setZoomed((z) => !z)} className="px-3 py-2 bg-gray-50 rounded hover:bg-gray-100">{zoomed ? 'Zoom Out' : 'Zoom'}</button>
            <button onClick={onClose} aria-label="Close" className="w-10 h-10 flex items-center justify-center rounded-full bg-white border shadow">✕</button>
          </div>
        </div>

        <div className="flex-1 relative bg-black flex items-center justify-center">
          <button onClick={prev} aria-label="Previous" className="absolute left-6 z-20 bg-white/90 hover:bg-white rounded-full p-3 text-2xl shadow">‹</button>

          <div className="flex-1 flex items-center justify-center px-4">
            <img
              src={imgs[index] || ''}
              alt={`Foto ${index + 1}`}
              className={`max-h-[82vh] max-w-full object-contain transition-transform duration-300 ${zoomed ? 'scale-125' : ''}`}
              loading="lazy"
              onDoubleClick={() => setZoomed((z) => !z)}
            />
          </div>

          <button onClick={next} aria-label="Next" className="absolute right-6 z-20 bg-white/90 hover:bg-white rounded-full p-3 text-2xl shadow">›</button>
        </div>

        <div className="bg-white border-t">
          <div className="flex gap-3 p-3 overflow-x-auto">
            {(imgs || []).map((src, i) => (
              <button key={`${src || 'img'}-${i}`} onClick={() => { setIndex(i); setZoomed(false) }} className={`shrink-0 w-28 h-20 rounded overflow-hidden border ${i === index ? 'border-[#CBAA6A]' : 'border-transparent'} bg-white`}>
                <img src={src || ''} alt={`thumb ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        </div>

        {details && (
          <div className="p-4 border-t bg-gray-50">
            <div className="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <h3 className="text-xl font-semibold text-charcoal">{details?.name}</h3>
                <p className="text-[#CBAA6A] font-medium mt-1">{details?.price}</p>
                <p className="mt-2 text-gray-700">{details?.description}</p>
                <ul className="mt-3 text-sm text-gray-700 space-y-1">
                  {details?.features && details.features.map((f) => <li key={f}>• {f}</li>)}
                </ul>
              </div>

              <div className="md:col-span-1 flex flex-col justify-center">
                <a href="https://www.airbnb.com/slink/lQvhOaVP" target="_blank" rel="noreferrer" className="block w-full text-center px-4 py-3 bg-[#CBAA6A] text-white rounded-lg shadow">Rezervo tani</a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
