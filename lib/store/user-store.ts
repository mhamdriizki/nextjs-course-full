import { createStore } from "zustand/vanilla";

export interface Member {
  name: string;
  tier: "Silver" | "Gold" | "Platinum";
}

export interface UserState {
  member: Member | null;
  setMember: (member: Member | null) => void;
}

// Factory: bikin store BARU tiap dipanggil, bukan singleton di module level.
// Ini yang bikin aman dari data leaking antar-request di SSR.
export function createUserStore(initialMember: Member | null = null) {
  return createStore<UserState>()((set) => ({
    member: initialMember,
    setMember: (member) => set({ member }),
  }));
}

export type UserStore = ReturnType<typeof createUserStore>;
