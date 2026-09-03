import Navbar from "./components/Navbar"
import './globals.css';
import { Figtree, Fira_Code } from "next/font/google";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "./components/ThemeProvider";
import { UserProvider } from "./context/UserContext";
import { UserStoreProvider } from "./provider/user-store-provider";
import { getCurrentMember } from "@/lib/data/member";
import { Toaster } from "sonner";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_APP_URL!),
  title: {
    template: "%s | Easycoding",
    default: "Easycoding - Belajar Next.js"
  },
  description: "Platform belajar Next.js dari basic sampai production-ready",
  openGraph: {
    title: "Easycoding",
    description: "Platform belajar Next.js dari basic sampai production-ready",
    siteName: "Easycoding",
    locale: "id_ID",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Easycoding",
    description: "Platform belajar Next.js dari basic sampai production-ready"
  }
}

const figtree = Figtree({subsets:['latin'],variable:'--font-sans'});
const firaCode = Fira_Code({subsets:['latin'],variable:'--font-mono', weight:['400', '500']});


export default async function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  const initialMember = await getCurrentMember();

  return (
    // Wajib tambahkan suppressHydrationWarning untuk mencegah React panik kalau tema server beda 
    // dengan tema browser user
    <html lang="id" className={cn("font-sans", figtree.variable, firaCode.variable)} suppressHydrationWarning>
      <body style={{ margin:0, padding:0, fontFamily: 'Arial, sans-serif' }}>
        <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem
          disableTransitionOnChange>
            <UserProvider>
              <UserStoreProvider initialMember={initialMember}>
                <Suspense fallback={null}>
                  <Navbar/>
                </Suspense>

                <main style={{ padding: '2rem', minHeight: '80vh'}}>
                  <Suspense fallback={<p>Loading ...</p>}>
                    {children}
                  </Suspense>
                </main>

                <footer style={{textAlign: 'center'}}>
                  &copy; 2026 EasyCoding Next.JS
                </footer>
                <Toaster/>
              </UserStoreProvider>
            </UserProvider>
        </ThemeProvider>
      </body>
    </html>
      
  )
}