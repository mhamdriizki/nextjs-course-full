'use client'
import { useEffect, useState } from 'react'

export default function Page() {
  const [produk, setProduk] = useState<{ id: number; title: string }[]>([])
  useEffect(() => {
    fetch('/api/produk')
      .then((res) => res.json())
      .then((data) => setProduk(data))
  }, [])
  return <ul>{produk.map((p) => <li key={p.id}>{p.title}</li>)}</ul>
}