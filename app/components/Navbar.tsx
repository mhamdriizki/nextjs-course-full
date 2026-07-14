"use client"

import Link from "next/link";
import { usePathname } from "next/navigation"
import { ThemeToggle } from "./ThemeToggle";

export default function Navbar() {
  const pathName = usePathname();

  return (
    <nav style={{ background:"#1f2937", padding:"1rem", display:"flex", gap:"1rem" }}>
      {/* Kita selalu pakai Link untuk pindah halaman */}
      <Link
        href="/"
        style={{
          color: pathName === "/" ? "#34d399" : "white",
          fontWeight: pathName === "/" ? "bold" : "normal",
          textDecoration: "none"
        }}>
          Home
      </Link>

      <Link
        href="/blog"
        style={{
          color: pathName === "/blog" ? "#34d399" : "white",
          fontWeight: pathName === "/blog" ? "bold" : "normal",
          textDecoration: "none"
        }}>
          Blog
      </Link>

      <Link
        href="/dashboard"
        style={{
          color: pathName === "/dashboard" ? "#34d399" : "white",
          fontWeight: pathName === "/dashboard" ? "bold" : "normal",
          textDecoration: "none"
        }}>
          Dashboard
      </Link>

      <Link
        href="/member"
        style={{
          color: pathName === "/member" ? "#34d399" : "white",
          fontWeight: pathName === "/member" ? "bold" : "normal",
          textDecoration: "none"
        }}>
          Member
      </Link>

      <ThemeToggle/>

    </nav>
  )
}