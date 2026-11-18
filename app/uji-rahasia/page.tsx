import { connection } from "next/server"

type Hasil = { ok: boolean, jumlah: number }

export default async function Page() {
  await connection();

  const res = await fetch('http://localhost:3001/api/rahasia', {
    headers: {
      Authorization: `Bearer ${process.env.API_KEY}`
    }
  })

  const hasil: Hasil = await res.json();

  return <p>{hasil.ok ? `${hasil.jumlah} ada produk` : 'ditolak'}</p>
}