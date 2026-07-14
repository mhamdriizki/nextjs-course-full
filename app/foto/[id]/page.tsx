import { Suspense } from "react";

export async function generateStaticParams() {
  return [{ id: "budi" }, { id: "tono" }];
}

export default function HalamanFotoAsli({
  params
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <Suspense fallback={<div style={{padding: '4rem', minHeight: '100vh'}}>Loading...</div>}>
      <FotoAsliContent params={params} />
    </Suspense>
  )
}

async function FotoAsliContent({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const {id} = await params;

  return (
    <div style={{padding: '4rem', background: '#f87171', color: "white", minHeight: '100vh'}}>
      <h1>Halaman foto asli full screen</h1>
      <p>Menampilkan foto id: <strong>{id}</strong></p>
    </div>
  )
}