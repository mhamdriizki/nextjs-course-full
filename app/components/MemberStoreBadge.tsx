"use client"

import { useUserStore } from "../provider/user-store-provider"

export function MemberStoreBadge() {
  const member = useUserStore((state) => state.member);

  return (
    <p>
      (Via zustand store factory) Member: {member?.name ?? "Guest"}
      {member ? `- Tier ${member?.tier}` : ""}
    </p>
  )
}