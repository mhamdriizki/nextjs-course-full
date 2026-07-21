import { AddToCartButton } from "../components/AddToCartButton"
import { MemberStoreBadge } from "../components/MemberStoreBadge"
import { CartSummary } from "./components/CartSummary"

const Gym_Class = [
  { id: "yoga", name: "Yoga Pagi", price: 7000 },
  { id: "hiit", name: "HIIT 30 menit", price: 10000 },
  { id: "zumba", name: "Zumba Party", price: 6000 }
]

export default function GymPage(){
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Kerannjang kelas gym</h1>
      <p className="text-slate-500 mb-6">
        Pilih cart dengan menggunakan zustand
      </p>

      <MemberStoreBadge/>

      <div className="grid gap-3 my-6">
        {Gym_Class.map((gymClass) => (
          <div key={gymClass.id} className="p-4 border-rounded-lg bg-white shadow-sm flex justify-between items-center">
            <div>
              <h3>{gymClass.name}</h3>
              <p>Rp {gymClass.price}</p>
            </div>
            <AddToCartButton id={gymClass.id} name={gymClass.name} price={gymClass.price}/>
          </div>
        ))}
      </div>

      <CartSummary/>
    </div>
  )
}