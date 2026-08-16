# Script Presentasi & Panduan Live Coding - Modul 11: Server Actions

Dokumen ini berisi script panduan untuk Anda sebagai instruktur dalam membawakan materi Modul 11 mengenai Server Actions, beserta panduan instruksi _live coding_ langkah demi langkah.

---

## Bagian 1: Script Presentasi (Slide per Slide)

**Slide 1: Server Actions**
"Halo semuanya! Kalau sebelumnya kita membuat API secara manual dengan Route Handlers, hari ini kita akan berkenalan dengan fitur paling sakti di Next.js: Server Actions! Ini memungkinkan kita mengeksekusi _function_ di server langsung dari komponen klien tanpa harus repot-repot membuat endpoint API terpisah."

**Slide 2: Apa itu Server Action?**
"Sederhananya, Server Action adalah _async function_ yang kita beri tanda `'use server'`. Begitu kita tambahkan teks ini, Next.js akan otomatis meng-compile fungsi tersebut menjadi endpoint rahasia. 
Kelebihannya dibanding API Route? Server Action bisa dipanggil langsung dari dalam Form atau Tombol, kita tidak perlu memanggil `fetch()` secara manual, otomatis aman dari serangan CSRF, mendukung _TypeScript end-to-end_, dan yang paling luar biasa: ia punya sistem _Progressive Enhancement_ bawaan! Sangat ideal untuk operasi CRUD pada form."

**Slide 3: Server Action di Form & Component**
"Ada dua cara populer memanggil Server Action. Pertama, via atribut `action={}` di elemen form. Ini cara paling canggih karena form Anda akan tetap bekerja sempurna meskipun pengguna mematikan JavaScript di browsernya!
Cara kedua, dipanggil dari _event handler_ biasa seperti `onClick`. Untuk cara ini, kita WAJIB membungkus pemanggilannya di dalam `startTransition` bawaan React, agar UI tidak _freeze_ dan kita tahu status _loading_-nya melalui variabel `isPending`."

**Slide 4: Return Type & Error Handling Server Action**
"Saat terjadi error di Server Action (misalnya gagal masuk database), **jangan gunakan `throw new Error`**! Kalau Anda melempar error, aplikasinya bisa _crash_. Pendekatan terbaik adalah mengembalikan sebuah objek standar (kita sebut `ActionResult`). Jika berhasil, kembalikan `{ success: true, data }`. Jika gagal, kembalikan `{ success: false, errors, message }`. Klien kemudian yang bertugas membaca objek ini dan menampilkan _Toast_ atau pesan merah di form."

**Slide 5: Evaluasi Pemahaman (Kuis)**
"Waktunya tes pemahaman!
Q1: Apa yang terjadi saat `<form action>` dijalankan tanpa JavaScript? Jawabannya C! Form tetap terkirim via native HTTP POST. Keren kan?
Q2: Kenapa harus pakai `startTransition` di klik tombol? Jawabannya C, supaya kita dapat status `isPending` dan UI tidak macet.
Q3: Kalau database error, apa yang dikembalikan Server Action? Betul, A! Jangan pernah me-return `throw error` detail teknis ke klien."

**Slide 6: Tugas Mandiri / Home Lab**
"Mari kita mulai ngoding! Target kita adalah mengimplementasikan CRUD Blog.
1. Kita akan membedah file `app/posts/action.ts` yang berisi fungsi-fungsi kita.
2. Kita integrasikan form untuk memanggil Server Action tersebut dan menguji *Error Handling*.
3. Kita buat komponen `DeleteButton` interaktif dengan indikator loading.
4. Terakhir, kita tampilkan _Toast Message_ yang cantik jika operasi sukses atau gagal."

**Slide 7: Rangkuman**
"Sebagai ringkasan: Bubuhkan `'use server'` untuk bikin Action. Gunakan di `form action` untuk _progressive enhancement_. Pakai `startTransition` untuk event handler. Dan selalu return `ActionResult` alih-alih me-`throw` error. 
Mari kita buka _code editor_!"

---

## Bagian 2: Instruksi Live Coding (Langkah-demi-Langkah)

### Langkah 1: Membedah & Menyempurnakan File Server Actions
_Jelaskan penggunaan 'use server' dan penanganan try/catch._
**Buka file:** `app/posts/action.ts`

```typescript
'use server'

import { createPost, softDeletePost } from "@/lib/data/post";
import { getOrCreateDemoAuthor } from "@/lib/data/user";
import { ActionResult } from "@/lib/validation/action-result";
import { createPostSchema, type CreatePostInput } from "@/lib/validation/post";
import { revalidatePath } from "next/cache";
import { flattenError } from "zod";

type CreatedPost = Awaited<ReturnType<typeof createPost>>;

// Action untuk Membuat Post (Menerima FormData)
export async function createPostAction(
  _prevState: ActionResult<CreatedPost> | null,
  formData: FormData
): Promise<ActionResult<CreatedPost>> {
  const result = createPostSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    excerpt: formData.get("excerpt"),
    content: formData.get("content") || undefined,
  });

  if (!result.success) {
    return { success: false, errors: flattenError(result.error).fieldErrors };
  }

  // Bungkus dalam try-catch untuk handle DB Error
  try {
    const author = await getOrCreateDemoAuthor();
    const post = await createPost({ ...result.data, authorId: author.id });
    revalidatePath("/posts"); // Bersihkan cache halaman posts
    return { success: true, data: post };
  } catch (error) {
    return { success: false, message: "Gagal menyimpan post ke database." };
  }
}

// Action untuk Menghapus (Soft Delete) Post
export async function softDeletePostAction(id: string): Promise<ActionResult<null>> {
  try {
    await softDeletePost(id);
    revalidatePath("/posts");
    return { success: true, data: null };
  } catch (error) {
    return { success: false, message: "Gagal menghapus post" };
  }
}
```

### Langkah 2: Mengamankan Action Result Helper
_Pastikan ActionResult kita siap menerima pesan error umum (message)._
**Buka file:** `lib/validation/action-result.ts`
Pastikan tipenya adalah seperti ini:
```typescript
export type ActionResult<T> = 
  | { success: true; data: T }
  | { success: false; errors?: Record<string, string[]>; message?: string }
```

### Langkah 3: Form Integration
_Jelaskan cara klien memanggil Server Action dan membaca respon baliknya._
**Buka file:** `app/posts/CreatePostForm.tsx`

_Contoh penanganan Action State dan Error menggunakan `useActionState` dan `useEffect` di client:_
```tsx
"use client";

import { useActionState, useEffect } from "react";
import { createPostAction } from "./action";
import { toast } from "sonner";

export function CreatePostForm() {
  // 1. Hook useActionState memantau return dari createPostAction
  const [state, formAction, isPending] = useActionState(createPostAction, null);

  const errors = state && !state.success ? state.errors : undefined;

  // 2. Gunakan useEffect untuk bereaksi terhadap perubahan state (memunculkan toast)
  useEffect(() => {
    if (state) {
      if (state.success) {
        toast.success("Post berhasil dibuat!");
      } else if (state.message) {
        toast.error(state.message);
      }
    }
  }, [state]);

  return (
    // 3. Pasang formAction di atribut action form
    <form action={formAction} className="space-y-2 border rounded-lg p-4">
      {/* ... input elements ... */}
      <button disabled={isPending}>
        {isPending ? "Menyimpan..." : "Simpan Post"}
      </button>
    </form>
  );
}
```

### Langkah 4: Button Action (Delete)
_Jelaskan penggunaan hook startTransition._
**Buat/Buka file:** `components/DeleteButton.tsx`

```tsx
'use client'

import { useTransition } from 'react';
import { softDeletePostAction } from '@/app/posts/action';
import { toast } from 'sonner';

export function DeleteButton({ postId }: { postId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    // Bungkus pemanggilan Server Action ke dalam startTransition
    startTransition(async () => {
      const result = await softDeletePostAction(postId);
      
      if (result.success) {
        toast.success('Post berhasil dihapus!');
      } else {
        toast.error(result.message || 'Terjadi kesalahan');
      }
    });
  }

  return (
    <button 
      onClick={handleDelete} 
      disabled={isPending}
      className={`px-3 py-1 rounded text-sm transition-all ${
        isPending ? 'text-gray-400 cursor-not-allowed' : 'text-red-500 underline hover:text-red-700'
      }`}
    >
      {isPending ? 'Menghapus...' : 'Hapus'}
    </button>
  );
}
```

### Langkah 5: Testing & Pembuktian
1. Jalankan `npm run dev` dan arahkan ke `http://localhost:3000/posts`.
2. Buka halaman dan coba _submit_ form untuk melihat _toast success_ maupun validasi errornya berjalan mulus.
3. Coba hapus post dengan menekan tombol **Hapus**. Perhatikan animasi teks berubah menjadi "Menghapus..." dan _toast_ konfirmasi sukses akan muncul. Server Action sukses dieksekusi secara instan!
