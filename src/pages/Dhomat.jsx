import React from 'react'
import Rooms from '../components/Rooms'
import BookingStrip from '../components/BookingStrip'
import PageHero from '../components/PageHero'


export default function Dhomat() {
  return (
    <div className="pt-[110px]">
      <PageHero
        title="Zgjedhni dhomën tuaj"
        subtitle="Standard, Deluxe dhe Premium — çdo dhomë e dizajnuar për rehati dhe stil."
        ctaText="Shiko disponueshmërinë"
        ctaHref="#dhomat"
        bg="https://images.unsplash.com/photo-1505691723518-36a18f5f7c66?auto=compress&cs=tinysrgb&w=1600&h=900&fit=crop"
      />

      <BookingStrip />

      <main className="max-w-6xl mx-auto px-6 py-12">
        <section id="dhomat" className="mb-8">
          <Rooms />
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
          <div className="rounded-xl p-4 bg-white border border-gray-100 shadow-soft">
            <h3 className="font-semibold">Standard</h3>
            <p className="mt-2 text-gray-600">Ideale për vizita të shkurtra ose udhëtarët me buxhet të moderuar. Ambient i pastër dhe i organizuar.</p>
          </div>

          <div className="rounded-xl p-4 bg-white border border-gray-100 shadow-soft">
            <h3 className="font-semibold">Deluxe</h3>
            <p className="mt-2 text-gray-600">Hapësirë më e madhe, më shumë komoditet dhe detaje moderne në mobilim.</p>
          </div>

          <div className="rounded-xl p-4 bg-white border border-gray-100 shadow-soft">
            <h3 className="font-semibold">Premium</h3>
            <p className="mt-2 text-gray-600">Për ata që kërkojnë eksperiencë më të rehatshme me pamje dhe më shumë facilitet.</p>
          </div>
        </section>

        <section className="mt-12 text-center">
          <p className="text-gray-700">Për disponueshmëri dhe oferta speciale, kontaktoni ose ndiqni linkun e rezervimit.</p>
          <div className="mt-6">
            <a href="https://www.airbnb.com/slink/lQvhOaVP" target="_blank" rel="noopener noreferrer" className="inline-block px-6 py-3 bg-brand text-white rounded-lg">Rezervo tani</a>
          </div>
        </section>
      </main>
    </div>
  )
}
