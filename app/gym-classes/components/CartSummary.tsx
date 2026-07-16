"use client"

import { useState, useEffect } from "react";
import { useCartStore } from "@/lib/store/cart-store";

export function CartSummary() {
  const [hydrated, setHydrated] = useState(false);
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Guard: sebelum hydrated, jangan render isi cart dari localStorage sama sekali —
  // biar HTML server ("kosong") dan HTML client-awal ("kosong") tetap identik.
  if (!hydrated) {
    return <p className="text-slate-400">Memuat keranjang…</p>;
  }

  if (items.length === 0) {
    return <p className="text-slate-400">Keranjang masih kosong.</p>;
  }

  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <div className="p-4 border rounded-lg bg-slate-50">
      <h2 className="font-bold text-slate-800 mb-3">Isi Keranjang</h2>
      <ul className="space-y-2 mb-3">
        {items.map((item) => (
          <li key={item.id} className="flex justify-between items-center text-sm">
            <span>{item.name} x{item.qty}</span>
            <div className="flex items-center gap-2">
              <span>Rp{(item.price * item.qty).toLocaleString("id-ID")}</span>
              <button onClick={() => removeItem(item.id)} className="text-red-500">
                Hapus
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div className="flex justify-between items-center font-bold border-t pt-2">
        <span>Total</span>
        <span>Rp{total.toLocaleString("id-ID")}</span>
      </div>
      <button onClick={clearCart} className="mt-3 text-sm text-slate-500 underline">
        Kosongkan keranjang
      </button>
    </div>
  );
}
