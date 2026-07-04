export default function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', gap: '2rem'}}>
      {/* sidebar khusus untuk dashboard */}
      <aside style={{ width: '200px', padding: '1rem', background: '#f0f0f0'}}>
        <h3>Dashboard</h3>
        <ul>
          <li><a href="/dashboard">Overview</a></li>
          <li><a href="/dashboard/settings">Settings</a></li>
        </ul>
      </aside>

      <main>
        {children}
      </main>

    </div>
  )

}