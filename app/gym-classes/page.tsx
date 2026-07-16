import { AddToCartButton } from "../components/AddToCartButton";
import { MemberStoreBadge } from "../components/MemberStoreBadge";
import { CartSummary } from "./components/CartSummary";

const GYM_CLASSES = [
  { id: "yoga", name: "Yoga Pagi", price: 75000 },
  { id: "hiit", name: "HIIT 30 Menit", price: 100000 },
  { id: "zumba", name: "Zumba Party", price: 85000 },
  { id: "pilates", name: "Pilates Reformer", price: 120000 },
];

export default function GymClassesPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Keranjang Kelas Gym</h1>
      <p className="text-slate-500 mb-6">
        Demo Modul 8.3: cart-store (Zustand + persist, client-only) dan user-store
        (Zustand Store Factory, SSR-safe).
      </p>

      {/* Server Component ini sendiri tidak butuh "use client" — cuma yang di dalam
          MemberStoreBadge/AddToCartButton yang butuh. */}
      <MemberStoreBadge />

      <div className="grid gap-3 my-6">
        {GYM_CLASSES.map((gymClass) => (
          <div key={gymClass.id} className="p-4 border rounded-lg bg-white shadow-sm flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800">{gymClass.name}</h3>
              <p className="text-sm text-slate-500">Rp{gymClass.price.toLocaleString("id-ID")}</p>
            </div>
            <AddToCartButton id={gymClass.id} name={gymClass.name} price={gymClass.price} />
          </div>
        ))}
      </div>

      <CartSummary />
    </div>
  )
}
