import { getProduk } from '@/lib/produk'

export default async function Page() {
  const produk = await getProduk()

  return (
    <ul>
      {produk.map((p) => (
        <li key={p.id}>{p.title}</li>
      ))}
    </ul>
  )
}
