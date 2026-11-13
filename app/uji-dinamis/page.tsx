import { connection } from 'next/server'
import { getProduk } from '@/lib/produk'

export default async function Page() {
  await connection()
  const produk = await getProduk()

  return (
    <ul>
      {produk.map((p) => (
        <li key={p.id}>{p.title}</li>
      ))}
    </ul>
  )
}
