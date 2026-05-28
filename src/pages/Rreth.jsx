import React from 'react'
import About from '../components/About'

export default function Rreth() {
  return (
    <div className="pt-[110px]">
      <main className="max-w-6xl mx-auto px-6 py-12">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-semibold">Rreth nesh</h1>
          <p className="mt-3 text-gray-600 max-w-2xl mx-auto">CenterStays Apartments është një zgjidhje e re për udhëtarët që kërkojnë rehati, pastërti dhe vendndodhje qendrore. Ne trajtojmë çdo mysafir me kujdes dhe përpiqemi që çdo qëndrim të jetë i këndshëm dhe i lehtë.</p>
        </header>

        <section className="py-6">
          <About />
        </section>

        <section className="mt-12 text-center">
          <h2 className="text-xl font-semibold">Vlerat tona</h2>
          <p className="mt-2 text-gray-600 max-w-2xl mx-auto">Pastrimi, komunikim i shpejtë, siguri dhe eksperiencë lokale — ky është premtimi ynë për çdo mysafir.</p>
        </section>
      </main>
    </div>
  )
}
