"use client"

import { createContext, useContext, useState, type ReactNode } from "react";

export interface Member {
  name: string;
  tier: "Silver" | "Gold" | "Platinum";
}

interface UserContextValue {
  member: Member | null;
  login: (member: Member) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextValue | null>(null);

// Ini "donat"-nya: Provider wajib 'use client', tapi children yang dipass
// sebagai props (lihat app/layout.tsx) tetap Server Component.
export function UserProvider({ children }: { children: ReactNode }) {
  const [member, setMember] = useState<Member | null>({
    name: "Rizki",
    tier: "Gold",
  });

  const login = (member: Member) => setMember(member);
  const logout = () => setMember(null);

  return (
    <UserContext.Provider value={{ member, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUser harus dipakai di dalam <UserProvider>");
  }
  return ctx;
}
