"use client"

import { useCartStore } from "@/lib/store/cart-store";

interface AddToCartButtonProps {
  id: string;
  name: string;
  price: number;
}

export function AddToCartButton({ id, name, price }: AddToCartButtonProps) {
  const addItem = useCartStore((state) => state.addItem);

  return (
    <button
      onClick={() => addItem({ id, name, price })}
      style={{ padding: '6px 12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4', cursor: 'pointer'}}>
        Tambah ke keranjang
    </button>
  )
}