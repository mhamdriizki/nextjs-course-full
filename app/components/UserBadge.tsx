"use client"

import { useUser } from "../context/UserContext"

export function UserBadge() {
  const { member, login, logout } = useUser();

  if (!member) {
    return (
      <button
        onClick={() => login({ name: "Rizki", tier: "Silver" })}
        style={{ color: 'white', background: 'transparent', border: '1px solid white', borderRadius: 4, padding: '4px 8px', cursor: 'pointer' }}>
          Login
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white' }}>
      <span>
        Halo, <strong>{member.name}</strong> | {member.tier}
      </span>

      <button
        onClick={logout}
        style={{ color: 'white', background: 'transparent', border: '1px solid white', borderRadius: 4, padding: '4px 8px', cursor: 'pointer' }}>
          Logout
      </button>

    </div>
  )
}