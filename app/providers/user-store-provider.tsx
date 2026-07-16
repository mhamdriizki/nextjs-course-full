"use client"

import { createContext, useContext, useRef, type ReactNode } from "react";
import { useStore } from "zustand";
import { createUserStore, type UserStore, type UserState, type Member } from "@/lib/store/user-store";

const UserStoreContext = createContext<UserStore | null>(null);

interface UserStoreProviderProps {
  children: ReactNode;
  initialMember?: Member | null;
}

export function UserStoreProvider({
  children,
  initialMember = null,
}: UserStoreProviderProps) {
  // useRef: jangan bikin store baru tiap render, cukup sekali per Provider instance.
  const storeRef = useRef<UserStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = createUserStore(initialMember);
  }

  return (
    <UserStoreContext.Provider value={storeRef.current}>
      {children}
    </UserStoreContext.Provider>
  );
}

export function useUserStore<T>(selector: (state: UserState) => T): T {
  const store = useContext(UserStoreContext);
  if (!store) {
    throw new Error("useUserStore harus dipakai di dalam <UserStoreProvider>");
  }
  return useStore(store, selector);
}
