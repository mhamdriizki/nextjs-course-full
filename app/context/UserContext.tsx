"use client"

import { createContext, ReactNode, useContext, useState } from "react";

export interface Member {
  name: string;
  tier: "Bronze" | "Silver" | "Gold"
}

interface UserContextValue {
  member: Member | null;
  login: (member: Member) => void;
  logout: () => void
}

const UserContext = createContext<UserContextValue | null>(null);

// Donat -> Provider wajib client, tapi children yang di pass
export function UserProvider({ children }: { children: ReactNode }) {
  const [member, setMember] = useState<Member | null>({
    name: "Rizki",
    tier: "Silver"
  });

  const login = (member: Member) => setMember(member);
  const logout = () => setMember(null);

  return (
    <UserContext.Provider value={{ member, login, logout }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUser harus dipakai di dalam <UserProvider>");
  }
  return ctx;
}