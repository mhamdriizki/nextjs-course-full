"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { signOut, useSession } from "@/lib/auth-client"

export function UserBadge() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  async function handleLogout() {
    await signOut();
    router.push("/login");
    router.refresh(); // wajib, agar server component (Navbar, dashboard, dll) ikut terupdate
  }

  if (isPending) {
    return null;
  }

  if (!session) {
    return (
      <Link
        href="/login"
        style={{ color: 'white', background: 'transparent', border: '1px solid white', borderRadius: 4, padding: '4px 8px', cursor: 'pointer', textDecoration: 'none' }}>
          Login
      </Link>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white' }}>
      <span>
        Halo, <strong>{session.user.name || session.user.email}</strong>
      </span>

      <button
        onClick={handleLogout}
        style={{ color: 'white', background: 'transparent', border: '1px solid white', borderRadius: 4, padding: '4px 8px', cursor: 'pointer' }}>
          Logout
      </button>

    </div>
  )
}