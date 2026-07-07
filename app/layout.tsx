import Navbar from "./components/Navbar"
import './globals.css';
import { Figtree } from "next/font/google";
import { cn } from "@/lib/utils";

const figtree = Figtree({subsets:['latin'],variable:'--font-sans'});


export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" className={cn("font-sans", figtree.variable)}>
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