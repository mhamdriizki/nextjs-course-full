import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ThemeToggle } from "./ThemeToggle";
import { CartBadge } from "./CartBadge";
import { NavLinks } from "./NavLinks";
import { LogoutButton } from "@/components/LogoutButton";
import Link from "next/link";

export default async function Navbar() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <nav style={{ background: "#1f2937", padding: "1rem", display: "flex", gap: "1rem", alignItems: "center" }}>
      <NavLinks />

      <ThemeToggle />

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "1rem" }}>
        <CartBadge />
        
        {/* Session Management Area */}
        {session ? (
          <div className="flex items-center gap-3 text-white text-sm">
            <span>Halo, <strong>{session.user.name || session.user.email}</strong></span>
            <LogoutButton />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-white hover:text-emerald-400 text-sm font-medium">Masuk</Link>
            <span className="text-slate-500">|</span>
            <Link href="/register" className="text-white hover:text-emerald-400 text-sm font-medium">Daftar</Link>
          </div>
        )}
      </div>
    </nav>
  );
}