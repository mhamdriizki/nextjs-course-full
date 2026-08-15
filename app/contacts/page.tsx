"use client"

import { useActionState } from "react"
import { submitContact } from "./actions/contact"
import { SubmitButton } from "../components/SubmitButton";

export default function ContactPage() {
  const [state, formAction, isPending] = useActionState(submitContact, {
    success: false,
    errors: undefined
  });

  return (
    <main className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Hubungi Kami</h1>

      {state.success && (
        <div className="text-2xl mb-4 bg-green-100 text-green-700 rounded">
          Pesan Berhasil Terkirim
        </div>
      )}

      {/* Gunakan formAction dari hook ke atribut action */}
      <form action={formAction} className="flex flex-col gap-4">
        <div>
          <label className="block mb-1">Email</label>
          <input type="email" name="email" className="w-full border p-2 rounded" />
          {/* Tampilkan pesan error jika terjadi error */}
          {state.errors?.email && (
            <p className="text-red-500 text-sm mt-1">{state.errors.email[0]}</p>
          )}
        </div>

        <div>
          <label className="block mb-1">Pesan</label>
          <textarea name="message" className="w-full border p-2 rounded" rows={4}></textarea>
          {/* Tampilkan pesan error jika terjadi error */}
          {state.errors?.message && (
            <p className="text-red-500 text-sm mt-1">{state.errors.message[0]}</p>
          )}
        </div>

        {/* Menggunakan komponen Submit Button yang terpisah (yang ada useFormStatus) */}
        <SubmitButton label="Kirim pesan"/>
      </form>

    </main>
  )
}