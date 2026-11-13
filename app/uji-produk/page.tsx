'use client'

import { useEffect, useState } from "react";

type Produk = { id: number; title: string }

export default function Page() {
  const [produk, setProduk] = useState<Produk[]>([])
  
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function ambilData() {
      try {
        const res = await fetch("/api/produk");
        if (!res.ok) throw new Error('Gagal ambil data');
        setProduk(await res.json())
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally{
      setLoading(false);
    }
  }
  ambilData()
  }, [] )

  if (loading) return <p>Memuat ... </p>
  if (error) return <p>Error : {error}</p>

  return (
    <ul>
      {produk.map((p) => (
        <li key={p.id}>{p.title}</li>
      ))}
    </ul>
  )
}

