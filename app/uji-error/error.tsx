'use client'

export default function Error({
  reset
}: {
  error: Error;
  reset: () => void
}) {
  return (
    <div>
      <p>Terjadi kesalahan saat memuat halaman</p>
      <button onClick={reset}>Coba lagi</button>
    </div>
  )
}