import React from 'react'

const posts = [
  {
    id: 1,
    title: 'Pse të zgjedhësh apartament në vend të hotelit?',
    excerpt: 'Zbulo pse apartamentet janë zgjedhje praktike, komode dhe fleksibile për qëndrime afatshkurtra.'
  ,image: '/Instagram_files/632066003_18072438782428513_5367347132982272851_n.jpg'
  },
  {
    id: 2,
    title: 'Udhëzues për qëndrim të shkurtër në qytet',
    excerpt: 'Këshilla të thjeshta për ta shfrytëzuar maksimalisht qëndrimin tuaj në zemër të qytetit.'
  ,image: '/Instagram_files/643604079_18073836020428513_7857664004613811476_n.jpg'
  },
  {
    id: 3,
    title: 'Si të gjesh akomodim komod dhe qendror?',
    excerpt: 'Çfarë duhet të kërkoni kur rezervoni një apartament për pushime apo udhëtim biznesi.'
  ,image: '/Instagram_files/473016745_18033208889428513_8755594424122914835_n.jpg'
  }
]

export default function Blog() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header rendered on BlogPage to avoid duplication */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {posts.map((p) => (
          <article key={p.id} className="bg-white rounded-xl border border-gray-100 p-5 shadow-soft card-hover">
            <div className="h-40 rounded-lg bg-gray-100 mb-4 overflow-hidden">
              <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
            </div>
            <h3 className="font-semibold">{p.title}</h3>
            <p className="mt-2 text-sm text-gray-600">{p.excerpt}</p>
            <div className="mt-4">
              <button className="text-sm px-4 py-2 border border-brand text-brand rounded-lg hover:bg-brand hover:text-white transition">
                Lexo më shumë
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
