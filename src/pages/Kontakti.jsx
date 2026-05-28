import React from 'react'
import Contact from '../components/Contact'
import PageHero from '../components/PageHero'

export default function Kontakti() {
  return (
    <div className="pt-[110px]">
      <PageHero
        title="Na kontaktoni"
        subtitle="Për rezervime, kërkesa speciale apo informacione — na shkruani dhe do t'ju përgjigjemi shpejt." 
        ctaText="Dërgo mesazh"
        ctaHref="#kontakti"
        bg="/Instagram_files/656314906_18076753487428513_4009666761995664575_n.jpg"
      />

      <main className="max-w-6xl mx-auto px-6 py-12">
        <section id="kontakti" className="mb-8">
          <Contact />
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          <div>
            <h3 className="font-semibold">Detajet e kontaktit</h3>
            <p className="mt-2 text-gray-600"><strong>Telefon:</strong> +383 48 110 988</p>
            <p className="mt-1 text-gray-600"><strong>Email:</strong> centerstays@gmail.com</p>
            <p className="mt-1 text-gray-600"><strong>Rezervime:</strong> <a className="text-brand" href="https://www.airbnb.com/slink/lQvhOaVP" target="_blank" rel="noopener noreferrer">Rezervo në Airbnb</a></p>
          </div>

          <div>
            <h3 className="font-semibold">Pyetje të shpeshta (FAQ)</h3>
            <div className="mt-2 space-y-3 text-gray-600">
              <div>
                <strong>Check‑in / Check‑out</strong>
                <p className="mt-1">Check‑in pas orës 14:00, check‑out deri në orën 11:00. Mund të negociohet në raste të veçanta.</p>
              </div>

              <div>
                <strong>Politika e anulimit</strong>
                <p className="mt-1">Politikat ndryshojnë sipas listimit në platformë—shikoni informacionin në Airbnb për çdo rezervim.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12">
          <h3 className="font-semibold">Lokacioni (vendi) — Afër qendrës</h3>
          <div className="mt-4 h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">Harta e vendndodhjes (placeholder)</div>
        </section>
      </main>
    </div>
  )
}
