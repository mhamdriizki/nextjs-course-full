import { cacheLife } from "next/cache";

export async function PopularPosts() {
  // MAGIC WORD NEXT.JS 16
  "use cache";
  
  // Menggunakan profil bawaan 'minutes' (Stale 0s, Revalidate 1m, Expire 1h)
  cacheLife("minutes"); 

  // Simulasi query database yang berat (Delay 1.5 detik)
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // INDIKATOR PEMBUKTIAN CACHE
  const renderTime = new Date().toLocaleTimeString();

  return (
    <div className="mt-8 p-6 bg-amber-50 rounded-xl border border-amber-200">
      <h3 className="text-xl font-bold text-amber-900 mb-2">🔥 Artikel Terpopuler</h3>
      <ul className="list-disc list-inside ml-4 text-amber-800 space-y-1">
        <li>Cara Cepat Belajar React</li>
        <li>Mengapa Next.js 16 Sangat Cepat?</li>
      </ul>
      
      {/* Teks ini yang bakal membuktikan cache bekerja! */}
      <p className="mt-4 text-sm text-amber-700 font-mono">
        🕒 Di-render oleh Server pada: <strong>{renderTime}</strong>
      </p>
    </div>
  );
}

