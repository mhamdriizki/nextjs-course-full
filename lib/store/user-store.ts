import { createStore } from "zustand";

export interface Member {
  name: string;
  tier: "Bronze" | "Silver" | "Gold"
}

export interface UserState {
  member: Member | null;
  setMember: (member: Member | null) => void;
}

// Factory : bikin store Baru tiap dipanggil
export function createUserStore(initialMember: Member | null = null) {
  return createStore<UserState>()(
    (set) => ({
      member: initialMember,
      setMember: (member) => set({ member}),
    })
  )
}

export type UserStore = ReturnType<typeof createUserStore>;