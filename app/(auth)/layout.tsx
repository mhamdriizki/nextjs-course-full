export default function AuthLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ padding: '2rem', borderRadius: '8px', textAlign: 'center', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
        <h2> Ini Layout Authentikasi </h2>
        {children}
      </div>
    </div>
  )
}