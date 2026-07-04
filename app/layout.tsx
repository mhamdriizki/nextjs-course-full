import Link from "next/link"

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body style={{ margin:0, padding:0, fontFamily: 'Arial, sans-serif' }}>
        <nav style={{ padding: '1rem', background:'#111', color: 'white', display: 'flex', gap: '1rem' }}>
          <strong>Next Js Blog</strong>
          <Link href="/" style={{color: 'white'}}>Home</Link>
          <Link href="/blog" style={{color: 'white'}}>Blog</Link>
          <Link href="/dashboard" style={{color: 'white'}}>Dashboard</Link>
        </nav>

        <main style={{ padding: '2rem', minHeight: '80vh'}}>
          {children}
        </main>

        <footer style={{textAlign: 'center'}}>
          &copy; 2026 EasyCoding Next.JS
        </footer>
      </body>
    </html>
      
  )
}