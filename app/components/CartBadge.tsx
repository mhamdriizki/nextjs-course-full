"use client"

import { useState, useEffect } from "react";
import { useCartStore } from "@/lib/store/cart-store";

export function CartBadge() {
  // Masalah: SSR render tanpa localStorage (items = []), lalu client hydrate
  // dan persist middleware nge-load isi cart yang sebenarnya → hydration mismatch.
  // Solusi: tunda render angka sampai komponen sudah mount di client.
  const [hydrated, setHydrated] = useState(false);
  const itemCount = useCartStore((state) =>
    state.items.reduce((total, item) => total + item.qty, 0)
  );

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return <span style={{ color: "white" }}>🛒 …</span>;
  }

  return <span style={{ color: "white" }}>🛒 {itemCount}</span>;
}
