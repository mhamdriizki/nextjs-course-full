# Script Presentasi & Panduan Live Coding - Modul 10: React 19 Form Hooks

Dokumen ini berisi script panduan untuk Anda sebagai instruktur (Sr Next.js Developer) dalam membawakan materi Modul 10 slide demi slide, beserta panduan instruksi *live coding* langkah demi langkah.

---

## Bagian 1: Script Presentasi (Slide per Slide)

**Slide 1: Judul - React 19 Form Hooks**
"Halo semuanya, selamat datang di Modul 10. Hari ini kita akan membahas topik yang sangat seru dan krusial dalam pengembangan web modern, yaitu Validasi Data dan Forms. Secara spesifik, kita akan menyelami pendekatan *native* di React 19 menggunakan dua hooks baru yang sangat powerful: `useActionState` dan `useFormStatus`. Pendekatan ini memungkinkan form kita bekerja dengan lancar baik dengan JavaScript maupun tanpa JavaScript. Konsep ini sering kita kenal dengan istilah *progressive enhancement*. Mari kita mulai!"

**Slide 2: useActionState — Pengganti useFormState**
"Di slide ini, mari berkenalan dengan `useActionState`. Hook ini hadir sebagai pengganti `useFormState`. Catatan penting untuk kalian: di React 19, hook ini sekarang di-import langsung dari `'react'`, bukan lagi dari `'react-dom'`. 
Fungsi utama hook ini adalah menjembatani Server Action kita dengan state dari form. Yang paling saya suka di React 19, `useActionState` ini sudah menyertakan `isPending` secara bawaan, jadi kita bisa langsung tahu kapan proses *submit* sedang berlangsung tanpa state tambahan.
Oh ya, ada satu perubahan penting: *signature* atau parameter dari Server Action kita harus berubah. Parameter pertamanya sekarang wajib berupa `prevState` (state sebelumya), barulah parameter keduanya adalah `formData`."

**Slide 3: useFormStatus — Submit Button Aware**
"Selanjutnya, kita punya `useFormStatus`. Nah, kalau yang ini tetap di-import dari `'react-dom'`. 
Tugas utamanya sederhana tapi sangat penting: ia bertugas membaca *pending state* (status loading) dari form *parent*-nya. Tapi ada syarat mutlaknya: hook ini WAJIB dipanggil di dalam *child component* yang terpisah dari tag `<form>` itu sendiri. Jadi praktiknya, kita akan selalu membuat komponen khusus, misalnya `<SubmitButton>`, yang memanggil hook ini supaya tombol bisa otomatis berstatus *disabled* atau *loading* saat form sedang diproses."

**Slide 4: Kapan Pakai Pendekatan Mana?**
"Sebagai developer, kita sering bingung memilih *tools*. Kapan kita harus pakai pendekatan yang mana? Mari kita bedah 3 skenario:
Pertama, **Hanya useActionState**. Ini sangat cocok untuk form sederhana seperti *contact form* atau CRUD simpel. Kodenya sangat bersih, mendung *progressive enhancement*, tapi kekurangannya tidak ada validasi interaktif yang *real-time*.
Kedua, **react-hook-form + Zod**. Ini cocok untuk form kompleks di sisi *client-only* seperti dashboard SPA. Pengalaman penggunanya (*UX*) sangat luar biasa dan validasinya *real-time*, tapi form ini akan mati total kalau JavaScript mati di browser.
Ketiga, nah ini favorit saya, **react-hook-form + useActionState**. Ini adalah *best practice* untuk form level *production* seperti register atau edit profil. Kita dapat validasi *real-time* yang cepat dari klien, validasi server yang aman, *progressive enhancement*, dan *UX* terbaik. Memang *setup*-nya sedikit lebih panjang karena kita butuh `useEffect` untuk menyinkronkan *error* dari server."

**Slide 5: Evaluasi Pemahaman (Kuis)**
"Sebelum kita terjun ke kode, mari tes pemahaman teman-teman sejenak. 
Q1: Dari mana kita import `useActionState` di React 19? Yak, betul sekali, jawabannya A, dari `'react'`. Jangan tertukar ya!
Q2: Kenapa `useFormStatus` harus diletakkan di *child component* terpisah? Jawabannya A, karena hook ini membaca konteks dari *parent* form-nya, ia tidak bisa membaca form jika dipanggil di level yang sama.
Q3: Apa yang berubah dari *signature* Server Action saat memakai `useActionState`? Benar, jawabannya A. Ia kini menerima `prevState` sebagai argumen pertama."

**Slide 6: Tugas Mandiri / Home Lab**
"Sekarang waktunya kita beraksi di *code editor*. Di Lab ini, kita punya 4 misi utama:
1. Membuat `ContactForm` sederhana murni menggunakan `useActionState`.
2. Mengekstrak komponen `SubmitButton` menggunakan `useFormStatus`.
3. Membangun `RegisterForm` yang kuat dengan kombinasi `react-hook-form` di sisi *client* dan `useActionState` di sisi *server*.
4. Menguji seberapa tangguh web kita dengan mematikan JavaScript di browser untuk melihat aksi *Progressive Enhancement*."

**Slide 7: Rangkuman**
"Sebagai penutup modul ini, mari ingat kembali poin utamanya: `useActionState` berasal dari 'react' dan merubah fungsi server menerima `prevState`. `useFormStatus` berasal dari 'react-dom' dan butuh ditempatkan di komponen terpisah. Keduanya membawa era baru *progressive enhancement* di React. Dan untuk level *enterprise*, gabungkan mereka dengan `react-hook-form`.
Siap untuk *ngoding* bareng? Ayo kita buka Visual Studio Code!"

---

## Bagian 2: Instruksi Live Coding (Langkah-demi-Langkah)

Saat presentasi selesai, Anda dapat mulai memandu live coding. Berikut adalah alur dan *snippet* kodenya:

### Langkah 1: Persiapan & Membuat Zod Schema + Server Action
*Jelaskan bahwa kita akan membuat form kontak sederhana.*
**Buat file:** `src/actions/contact.ts`

```typescript
"use server";
import { z } from "zod";

// 1. Definisikan Zod Schema
const contactSchema = z.object({
  email: z.string().email("Email tidak valid"),
  message: z.string().min(10, "Pesan minimal 10 karakter"),
});

// 2. Buat Server Action. Ingat signature baru: (prevState, formData)
export async function submitContact(prevState: any, formData: FormData) {
  // Simulasi delay network
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const rawData = {
    email: formData.get("email"),
    message: formData.get("message"),
  };

  const validated = contactSchema.safeParse(rawData);

  if (!validated.success) {
    return {
      success: false,
      errors: validated.error.flatten().fieldErrors,
    };
  }

  // Jika sukses (misal: kirim email ke database)
  console.log("Email sent to:", validated.data.email);
  
  return {
    success: true,
    errors: undefined,
  };
}
```

### Langkah 2: Membuat Komponen SubmitButton (Child)
*Jelaskan kenapa kita memisahkan tombol submit.*
**Buat file:** `src/components/SubmitButton.tsx`

```tsx
"use client";
import { useFormStatus } from "react-dom"; // Ingat dari react-dom!

export function SubmitButton({ label = "Kirim" }: { label?: string }) {
  // Hook ini akan mengecek apakah parent <form> sedang di-submit
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`px-4 py-2 rounded text-white bg-blue-600 ${
        pending ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"
      }`}
    >
      {pending ? "Memproses..." : label}
    </button>
  );
}
```

### Langkah 3: Menggabungkan di Contact Form (Native Pendekatan)
*Jelaskan cara memakai hook baru di sisi klien.*
**Buat file:** `src/app/contact/page.tsx`

```tsx
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
```

### Langkah 4: Live Testing & Progressive Enhancement
1. Jalankan server lokal: `npm run dev`.
2. Buka `http://localhost:3000/contact`.
3. Tunjukkan state error dengan mengirim form kosong.
4. Tunjukkan state loading saat proses memakan waktu 1.5 detik (dari Promise).
5. **Puncak Demo:** Buka *Chrome DevTools -> Settings (ikon gear) -> Debugger -> Centang 'Disable JavaScript'*.
6. Refresh halaman. Coba *submit* lagi. Form akan tetap bekerja, *error* akan muncul (via *full page reload* layaknya PHP zaman dulu). Ini membuktikan bahwa Next.js dan React 19 Form benar-benar mendukung *Progressive Enhancement*!

---

*Catatan untuk Instruktur: Untuk tugas 'Register Form' (Kombinasi RHF + useActionState), Anda bisa menjadikannya PR (Pekerjaan Rumah) bagi peserta, atau lanjut live coding jika durasi kelas masih mengizinkan (Fokus utamanya adalah menambahkan `useEffect` yang membaca `state.errors` untuk men-*trigger* `setError` di react-hook-form).*
