import { cacheLife } from "next/cache";

export async function PopularPosts() {
  // magic word
  "use cache";

  cacheLife("minutes");

  await new Promise((resolve) => setTimeout(resolve, 1500));

  const renderTime = new Date().toLocaleTimeString();

  return (
    <div className="mt-8 p-6 bg-amber-50 rounded-xl border border-amber-200">
      <h3 className="text-xl font-bold text-amber-900 mb-2">Artikel terpopuler !</h3>
      <ul className="list-disc list-inside ml-4 text-amber-800 space-y-1">
        <li>Cara cepat belajar Next.JS</li>
        <li>Mengapa Next.JS sangat cepat?</li>
      </ul>

      {/* Teks ini akan membuktikan cache bekerja */}
      <p className="mt-4 text-sm text-amber-700 font-mono">
        Dirender oleh server pada <strong>{renderTime}</strong>
      </p>
    </div>
  )
}