import Link from "next/link"
import Navbar from "./components/Navbar"

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body style={{ margin:0, padding:0, fontFamily: 'Arial, sans-serif' }}>
        <Navbar/>

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