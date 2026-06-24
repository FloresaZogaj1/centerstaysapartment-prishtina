import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function PaymentResultPage({ title, text, showTryAgain = false }){
  const navigate = useNavigate()
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">{title}</h1>
      <p className="text-gray-700 mb-6">{text}</p>

      <div className="flex gap-3">
        <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => navigate('/')}>Back to homepage</button>
        {showTryAgain && (
          <button className="px-4 py-2 bg-gray-100 text-gray-900 rounded" onClick={() => window.location.reload()}>Try again</button>
        )}
        <a className="px-4 py-2 border border-gray-300 rounded text-gray-700" href={`mailto:${process.env.REACT_APP_CONTACT_EMAIL || 'info@centerstays.apartments'}`}>Contact support</a>
      </div>
    </div>
  )
}
