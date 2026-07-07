"use client";

export default function HomePage() {
  return (
    <main className="min-h-screen p-8 lg:p-24">
      {/* Menggunakan typography standard tailwind */}
      <h1 className="text-4xl font-extrabold tracking-tight mb-8">
        Next JS Course
      </h1>

      {/* Menggunakan responsive grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        {/* Card 1 */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 transition-transform hover:-translate-y-1 hover:shadow-lg">
          <h2 className="text-xl font-bold text-brand-gelap mb-2">Shadcn/UI</h2>
          <p className="text-brand-gelap/80">Kumpulan Komponen Library</p>
        </div>


        {/* Card 2 */}
        <div className="bg-brand-terang p-6 rounded-super shadow-md border border-brand-utama transition-transform hover:-translate-y-1 hover:shadow-lg">
          <h2 className="text-xl font-bold text-brand-gelap mb-2">Tailwind</h2>
          <p className="text-brand-gelap/80">Framework CSS</p>
        </div>
      </div>

    </main>
  )
}