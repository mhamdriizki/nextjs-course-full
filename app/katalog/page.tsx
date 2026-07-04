import { cookies } from "next/headers";
import Link from "next/link";

export default async function KatalogPage({
  searchParams
}: {
  searchParams: Promise<{
    query?: string,
    page?: string
  }>
}) {
  const { query = "", page = "1" } = await searchParams;
  const currentPage = parseInt(page);

  return (
    <div style={{ padding: '2rem' }}>
      <CekCookies />
      <h1>Halaman Katalog</h1>

      {/* Form pencarian untuk katalog yang sederhana */}
      <form method="GET" style={{ marginBottom: '2rem' }}>
        <input 
          type="text" 
          name="query" 
          placeholder="Cari produk..." 
          defaultValue={query} 
          style={{ padding: '0.5rem', marginRight: '0.5rem' }}
        />
        <button type="submit" style={{ padding: '0.5rem' }}>Cari</button>
      </form>

      {/* Hasil pencarian */}
      <div style={{ padding: '1rem', borderRadius: '5px' }}>
        <p>Menampilkan hasil pencarian untuk <strong>{query}</strong></p>
        <p>Halaman saat ini: <strong>{currentPage}</strong></p>
      </div>

      {/* Navigasi pagination */}
      <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
        <Link href={`/katalog?query=${query}&page=${currentPage - 1}`}>Sebelumnya</Link>
        <Link href={`/katalog?query=${query}&page=${currentPage + 1}`}>Selanjutnya</Link>
      </div>
    </div>
  )
}

async function CekCookies() {
  const cookiesStore = await cookies();
  console.log("Cookies saat ini:", cookiesStore.getAll());

  // Ambil tema user atau ambil nilai dari backend
  const temaUser = cookiesStore.get("tema")?.value || "default";

  return (
    <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #ccc'}}>
      <h3>Tema User:</h3>
      <p>{temaUser}</p>
    </div>
  )
}