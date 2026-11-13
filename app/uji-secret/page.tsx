import { connection } from 'next/server'

type Hasil = { ok: boolean; jumlah: number }

export default async function Page() {
  await connection()
  // API_KEY hanya ada di server, tanpa NEXT_PUBLIC_
  const res = await fetch('http://localhost:3000/api/rahasia', {
    headers: { Authorization: `Bearer ${process.env.API_KEY}` },
  })
  const hasil: Hasil = await res.json()

  return <p>{hasil.ok ? `${hasil.jumlah} produk` : 'ditolak'}</p>
}
