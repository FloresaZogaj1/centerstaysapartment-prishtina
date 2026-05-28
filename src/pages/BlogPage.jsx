import React from 'react'
import Blog from '../components/Blog'

export default function BlogPage() {
  return (
    <div className="pt-[110px]">
      <main className="max-w-6xl mx-auto px-6 py-12">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-semibold">Blog</h1>
          <p className="mt-3 text-gray-600 max-w-2xl mx-auto">Këshilla për udhëtarë, udhëzime për qëndrime dhe ide për ta shijuar më mirë vizitën tuaj.</p>
        </header>

        <Blog />
      </main>
    </div>
  )
}
