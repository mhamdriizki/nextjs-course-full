"use client";
import { useActionState } from "react"; // Dari react!
import { submitContact } from "@/actions/contact";
import { SubmitButton } from "@/components/SubmitButton";

export default function ContactPage() {
  // Gunakan hook: masukkan server action dan initial state
  const [state, formAction, isPending] = useActionState(submitContact, {
    success: false,
    errors: undefined,
  });

  return (
    <main className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Hubungi Kami</h1>
      
      {state.success && (
        <div className="p-4 mb-4 bg-green-100 text-green-700 rounded">
          Pesan berhasil terkirim!
        </div>
      )}

      {/* Gunakan formAction dari hook ke atribut action */}
      <form action={formAction} className="flex flex-col gap-4">
        
        <div>
          <label className="block mb-1">Email</label>
          <input 
            type="email" 
            name="email" 
            className="w-full border p-2 rounded" 
          />
          {/* Menampilkan pesan error dari server */}
          {state.errors?.email && (
            <p className="text-red-500 text-sm mt-1">{state.errors.email[0]}</p>
          )}
        </div>

        <div>
          <label className="block mb-1">Pesan</label>
          <textarea 
            name="message" 
            className="w-full border p-2 rounded" 
            rows={4}
          ></textarea>
          {state.errors?.message && (
            <p className="text-red-500 text-sm mt-1">{state.errors.message[0]}</p>
          )}
        </div>

        {/* Gunakan komponen terpisah yang punya useFormStatus */}
        <SubmitButton label="Kirim Pesan" />
        
      </form>
    </main>
  );
}
