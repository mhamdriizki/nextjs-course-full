"use client"

import { useFormStatus } from "react-dom"

export function SubmitButton({ label = "Kirim" }: { label?: string }) {
  const {pending} = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`px-4 py-2 rounded text-white bg-blue-600 ${pending ? "opacity=50 cursor-not-allowed" : 
        "hover:bg-blue-700"}`}
    >
      {pending ? "Memproses . . ." : label}
    </button>
  )
}