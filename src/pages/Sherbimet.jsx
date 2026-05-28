import React from 'react'
import Services from '../components/Services'
import BookingStrip from '../components/BookingStrip'
import Contact from '../components/Contact'
import PageHero from '../components/PageHero'

export default function Sherbimet() {
  return (
    <div className="pt-[110px]">
      <PageHero
        title="Shërbimet që bëjnë diferencën"
        subtitle="Komoditet, pastërti dhe mbështetje për çdo qëndrim — këto janë standardet tona."
        ctaText="Shiko shërbimet"
        ctaHref="#sherbimet"
        bg="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=compress&cs=tinysrgb&w=1600&h=900&fit=crop"
      />

      <main className="max-w-6xl mx-auto px-6 py-12">
        <section id="sherbimet" className="mb-8">
          <Services />
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          <div>
            <h2 className="text-xl font-semibold">Pastrimi dhe mirëmbajtja</h2>
            <p className="mt-3 text-gray-600">Pastrimi profesional para çdo check‑in, kontroll i pajisjeve dhe furnizime bazë. Jemi të përkushtuar që apartamentet tona të jenë gjithmonë të sigurta dhe të rehatshme.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold">Mbështetje 24/7</h2>
            <p className="mt-3 text-gray-600">Ekipi ynë është i gatshëm të ndihmojë për pyetje të përgjithshme, çelësa, ose çështje emergjente që mund të lindin gjatë qëndrimit.</p>
          </div>
        </section>

        <section className="mt-12">
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-soft">
            <h3 className="font-semibold">Shërbime të personalizuara</h3>
            <p className="mt-2 text-gray-600">Nga transferimet nga aeroporti tek rekomandimet lokale — ne mund të ndihmojmë duke bërë bashkëpunime lokale (me pagesë) për të përmirësuar eksperiencën tuaj.</p>
            <div className="mt-4">
              <a href="/kontakti" className="inline-block px-4 py-2 bg-brand text-white rounded-lg">Kërko shërbim</a>
            </div>
          </div>
        </section>

        <section className="mt-16">
          <Contact />
        </section>
      </main>
    </div>
  )
}
