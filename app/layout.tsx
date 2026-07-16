import Navbar from "./components/Navbar"
import './globals.css';
import { Figtree } from "next/font/google";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "./components/ThemeProvider";
import { UserProvider } from "./context/UserContext";
import { UserStoreProvider } from "./providers/user-store-provider";
import { getCurrentMember } from "@/lib/data/member";

const figtree = Figtree({subsets:['latin'],variable:'--font-sans'});


export default async function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  // Server Component: fetch initial member lalu pass ke Store Factory Provider sebagai props.
  const currentMember = await getCurrentMember();

  return (
    // Wajib tambahkan suppressHydrationWarning untuk mencegah React panik kalau tema server beda 
    // dengan tema browser user
    <html lang="id" className={cn("font-sans", figtree.variable)} suppressHydrationWarning>
      <body style={{ margin:0, padding:0, fontFamily: 'Arial, sans-serif' }}>
        <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem
          disableTransitionOnChange>
            {/* Donat Bolong: UserProvider ('use client') membungkus children,
                tapi children (Navbar & main) sendiri tetap Server Component
                kecuali yang memang sudah "use client" (Navbar, UserBadge). */}
            <UserProvider>
              {/* UserStoreProvider = versi Zustand Store Factory dari pola yang sama.
                  Dipakai berdampingan dengan UserProvider (Context, dari Modul 8.2)
                  supaya bisa dibandingkan langsung di /gym-classes. */}
              <UserStoreProvider initialMember={currentMember}>
                <Navbar/>

                <main style={{ padding: '2rem', minHeight: '80vh'}}>
                  {children}
                </main>

                <footer style={{textAlign: 'center'}}>
                  &copy; 2026 EasyCoding Next.JS
                </footer>
              </UserStoreProvider>
            </UserProvider>
        </ThemeProvider>
      </body>
    </html>
      
  )
}