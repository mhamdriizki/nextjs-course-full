"use client"

import { useCartStore } from "@/lib/store/cart-store";
import { useEffect, useState } from "react"

export function CartBadge() {
  // Masalah : SSR render tanpa local storage, lalu client hydrate dan persist middleware nge-load isi cart
  // yang sebenarnya -> hydration missmatch
  // solusi : tunda render sampai komponen suda mount
  const [hydrated, setHydrated] = useState(false);
  const itemCount = useCartStore((state) =>
    state.items.reduce((total, item) => total + item.qty, 0)
  );

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return <span style={{color: 'white'}}>🛒</span>
  }

  return <span style={{color: 'white'}}>🛒 {itemCount}</span>
}