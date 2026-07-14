import { Suspense } from "react"

export default function DashboardLayout({
  children,
  recent,
  stats
}: {
  children: React.ReactNode
  recent: React.ReactNode
  stats: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', gap: '2rem'}}>
      {/* Panel dashboard */}
      <main style={{ padding: '2rem' }}>
        <h1>Panel Admin</h1>
        <hr />
        
        {/* Konten Utama */}
        {children}

        {/* Konten Slot */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <Suspense fallback={<p>Loading . . .</p>}>{stats}</Suspense>
          </div>
          <div style={{ flex: 1 }}>
            <Suspense fallback={<p>Loading . . .</p>}>{recent}</Suspense>
          </div>
        </div>
      </main>

    </div>
  )

}