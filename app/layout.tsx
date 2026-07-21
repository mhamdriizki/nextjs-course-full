import Navbar from "./components/Navbar"
import './globals.css';
import { Figtree } from "next/font/google";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "./components/ThemeProvider";
import { UserProvider } from "./context/UserContext";
import { UserStoreProvider } from "./provider/user-store-provider";
import { getCurrentMember } from "@/lib/data/member";

const figtree = Figtree({subsets:['latin'],variable:'--font-sans'});


export default async function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  const initialMember = await getCurrentMember();

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
            <UserProvider>
              <UserStoreProvider initialMember={initialMember}>
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