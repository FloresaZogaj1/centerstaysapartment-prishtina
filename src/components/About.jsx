import React from 'react'

export default function About() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div>
          <h2 className="text-2xl font-semibold">Rreth CenterStays Apartments</h2>
          <p className="mt-4 text-gray-700">
            CenterStays Apartments ofron qëndrime komode dhe moderne në zemër të qytetit. Me fokus në pastërti, rehati dhe qasje të lehtë në pikat kryesore të qytetit, apartamentet tona janë të përshtatshme për turistë, çifte, familje dhe udhëtarë biznesi.
          </p>
          <ul className="mt-4 space-y-2 text-gray-600">
            <li>• Vendndodhje qendrore dhe akses i shpejtë</li>
            <li>• Apartamente të pajisura me të gjitha elementet e nevojshme</li>
            <li>• Rezervim i thjeshtë përmes Airbnb</li>
          </ul>
        </div>

        <div className="flex justify-center">
          <div className="w-full max-w-sm rounded-2xl p-0 overflow-hidden shadow-soft-blue border border-gray-100">
            <div className="h-56 w-full">
              <img src={'/Instagram_files/657821705_18076753325428513_194475441280059989_n.jpg'} alt="about" className="w-full h-full object-cover" />
            </div>
            <div className="mt-4">
              <h3 className="font-semibold">Comfort & Clean</h3>
              <p className="text-sm text-gray-600 mt-1">Një hapësirë e qetë dhe e mirëmbajtur për pushime pa stres.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
