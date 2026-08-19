"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLinks() {
    const pathName = usePathname();

    const links = [
        { href: "/", label: "Home" },
        { href: "/blog", label: "Blog" },
        { href: "/dashboard", label: "Dashboard" },
        { href: "/member", label: "Member" },
        { href: "/gym", label: "Gym Classes" },
    ];

    return (
        <div style={{ display: "flex", gap: "1rem" }}>
            {links.map((link) => (
                <Link
                    key={link.href}
                    href={link.href}
                    style={{
                        color: pathName === link.href ? "#34d399" : "white",
                        fontWeight: pathName === link.href ? "bold" : "normal",
                        textDecoration: "none",
                    }}
                >
                    {link.label}
                </Link>
            ))}
        </div>
    );
}
