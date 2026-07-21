"use client"

import { createUserStore, type Member, type UserStore, type UserState } from "@/lib/store/user-store"
import { createContext, ReactNode, useContext, useRef } from "react"
import { useStore } from "zustand";
// import { Member } from "../context/UserContext";

const UserStoreContext = createContext<UserStore | null> (null);

interface UserStoreProviderProps {
  children: ReactNode;
  initialMember?: Member | null;
}

export function UserStoreProvider({
  children,
  initialMember = null
}: UserStoreProviderProps) {
  const storeRef = useRef<UserStore |null>(null);
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
  const store  = useContext(UserStoreContext);
  if (!store) {
    throw new Error("useUserStore harus dipakai di dalam <UserStroreProvider>");
  }
  return useStore(store, selector);
}