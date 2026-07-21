"use client"

import { useCartStore } from "@/lib/store/cart-store";
import { useEffect, useState } from "react"

export function CartSummary() {
  const [hydrated, setHydrated] = useState(false);
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return <p>Memuat keranjang . . </p>
  }

  if (items.length === 0) {
    return <p>Keranjang masih kosong</p>
  }

  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <div className="p-4 border rounded-lg bg-slate-50">
      <h2 className="font-bold text-slate-800 mb-3">Isi Keranjang</h2>
      <ul className="space-y-2 mb-3">
        {items.map((item) => (
          <li key={item.id} className="flex justify-between items-center text-sm">
            <span>{item.name} x {item.qty}</span>
            <div className="fles items-center gap-2">
              <span>Rp {(item.price * item.qty).toLocaleString("id-ID")}</span>
              <button onClick={()=> removeItem(item.id)} className="text-red-500">Hapus</button>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex justify-between items-center font-bold border-t pt-2">
        <span>Total</span>
        <span>Rp{total.toLocaleString("id-ID")}</span>
      </div>

      <button onClick={clearCart} className="mt-3 text-sm text-slate-500 underline">
        Kosongkan Keranjang
      </button>

    </div>
  )
}