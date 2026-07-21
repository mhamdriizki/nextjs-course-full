import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "qty">) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>() (
  persist(
    (set) => ({
      items: [],
      addItem: (item) => 
        set((state) => {
          const existing = state.items.find((i) => i.id === item.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === item.id ? {...i, qty: i.qty+1} : i
              ),
            };
          }
          return { items: [...state.items, {...item, qty: 1}]}
        }),
        removeItem: (id) =>
          set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
        updateQty: (id, qty) =>
          set((state) => ({
            items: state.items.map((i) => i.id === id ? {...i, qty} : i)
          })),
        clearCart: () => set({ items: []}),
    }),
    {
      name: "gym-cart-storage",
      storage: createJSONStorage(() => localStorage)
    }
  )
)