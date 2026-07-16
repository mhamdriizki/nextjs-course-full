"use client"

import { useUserStore } from "@/app/providers/user-store-provider";

export function MemberStoreBadge() {
  // Selector: cuma subscribe field "member" — precise, tidak ikut re-render
  // kalau nanti store ini nambah field lain (mis. preferences) yang berubah.
  const member = useUserStore((state) => state.member);

  return (
    <p style={{ color: "#334155" }}>
      (Via Zustand Store Factory) Member aktif: <strong>{member?.name ?? "Guest"}</strong>
      {member ? ` — Tier ${member.tier}` : ""}
    </p>
  );
}
