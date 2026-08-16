# Script Presentasi & Panduan Live Coding - Modul 11 (Bagian 2): Revalidasi Data

Dokumen ini berisi panduan untuk Anda saat membawakan kelanjutan materi Modul 11 mengenai Revalidasi Data Setelah Mutasi.

---

## Bagian 1: Script Presentasi (Slide per Slide)

**Slide 1: Revalidasi Data Setelah Mutasi**
"Halo kembali! Setelah kita sukses melakukan mutasi data dengan Server Actions, ada satu masalah yang biasanya muncul: Datanya sudah berubah di database, tapi kenapa tampilannya masih data lama? Itulah kenapa kita butuh Revalidasi! Hari ini kita akan membahas tiga cara utama memperbarui UI di Next.js: `revalidateTag`, `revalidatePath`, dan `router.refresh()`."

**Slide 2: Tiga Cara Revalidasi — Pilih yang Tepat**
"Mari kita lihat senjatanya. 
Pertama, **`revalidateTag`**. Ini adalah _tag-based invalidation_. Sangat presisi! Anda bisa melabeli _cache_ fungsi dengan tag tertentu, lalu menghapus cache khusus tag itu saja.
Kedua, **`revalidatePath`**. Ini lebih sederhana, ia menghapus semua _cache_ di URL tertentu. Cocok untuk aplikasi skala kecil-menengah.
Ketiga, **`router.refresh()`**. Ini spesial untuk komponen sisi klien (_Client Component_) yang ingin me-render ulang _Server Component_ di halaman saat ini tanpa perlu melakukan _full reload_ atau membersihkan cache di sisi server secara paksa."

**Slide 3: revalidateTag — Invalidasi Setelah Mutasi**
"Di Next.js terbaru (sejak versi 15/16), kita bisa menggunakan *directive* `'use cache'` dan fungsi `cacheTag()` pada fungsi *fetching* kita. Lalu saat mutasi berhasil, kita gunakan `revalidateTag('tag-name', 'max')`. Perhatikan, di Next.js 16, pemanggilan `revalidateTag` wajib disertai argumen kedua (seperti `'max'`)! 
Sebagai *best practice*, gunakan pola *tag scheme*: tag umum (`'posts'`) untuk _list_, dan tag spesifik (`'post-slug'`) untuk halaman detail."

**Slide 4: revalidatePath & router.refresh()**
"Untuk `revalidatePath`, penggunaannya sangat mudah: cukup `revalidatePath('/blog')`.
Sedangkan `router.refresh()` digunakan dari _Client Component_ (bukan _Server Action_). Misalnya, kita punya tombol klik, ia memanggil server action untuk update database secara diam-diam, lalu saat beres, kita panggil `router.refresh()` agar UI di halaman tersebut mendapatkan data ter-update secara _in-place_."

**Slide 5: Evaluasi Pemahaman (Kuis)**
"Mari kita tes!
Q1: Cara memanggil `revalidateTag` yang benar di Next 16? Jawabannya B! Wajib dua argumen, `revalidateTag('posts', 'max')`.
Q2: Beda `revalidateTag` dan `revalidatePath`? Jawabannya B! Tag lebih presisi lintas URL, Path berdasarkan URL dan lebih kasar.
Q3: Apa itu `router.refresh()`? Jawabannya B! Ia me-*render* ulang Server Components saat ini tanpa me-reset *state* dari Client Component."

**Slide 6: Tugas Mandiri / Home Lab**
"Waktunya praktik!
1. Kita akan pasang `'use cache'` dan `cacheTag` pada logika database kita.
2. Kita ganti `revalidatePath` lama dengan `revalidateTag` yang lebih presisi di _Create_ dan _Delete_.
3. Kita akan buat komponen `PublishToggle` yang menggunakan `router.refresh()` untuk mengubah status tulisan dari 'Draft' ke 'Published'.
Mari kita mulai!"

**Slide 7: Rangkuman**
"Ingat selalu: gunakan `revalidateTag` untuk aplikasi *production* yang butuh presisi. Gunakan `revalidatePath` jika butuh cara instan dan sederhana. Gunakan `router.refresh()` ketika ingin UI *refresh* dari perintah sisi klien (seperti tombol _toggle_)."

---

## Bagian 2: Instruksi Live Coding (Langkah-demi-Langkah)

### Langkah 1: Tag Scheme dengan `'use cache'`
_Demonstrasikan cara menambahkan cache pada fungsi database._
**Buka file:** `lib/data/post.ts`

```typescript
// Tambahkan import ini di bagian atas
import { cacheTag } from "next/cache";

// Pada fungsi getPosts, ubah menjadi seperti ini:
export async function getPosts({ query, category, page = 1 }: { query?: string; category?: string; page?: number; }) {
  "use cache"; // Aktifkan caching
  cacheTag("posts"); // Labeli cache ini dengan tag 'posts'
  
  // ... sisa kode tetap sama
}

// Pada fungsi listPublishPosts:
export async function listPublishPosts() {
  "use cache";
  cacheTag("posts");
  
  // ... sisa kode tetap sama
}
```

### Langkah 2: Menggunakan revalidateTag di Create & Delete
_Ganti `revalidatePath` menjadi `revalidateTag`._
**Buka file:** `app/posts/action.ts`

```typescript
// Ganti import revalidatePath menjadi revalidateTag
import { revalidateTag } from "next/cache";

// Pada createPostAction dan createPostFromObjectAction:
// HAPUS: revalidatePath("/posts");
// GANTI DENGAN:
revalidateTag("posts", "max");

// Pada softDeletePostAction:
// HAPUS: revalidatePath("/posts");
// GANTI DENGAN (Invalidasi list dan spesifik post):
revalidateTag("posts", "max");
revalidateTag(`post-${id}`, "max");
```

### Langkah 3: Membuat Tombol PublishToggle (router.refresh)
_Persiapkan server action agar tidak me-revalidate sendiri, lalu buat Client Component._
**Buka file:** `app/posts/action.ts`
Ubah fungsi `publishPostAction`:
```typescript
export async function publishPostAction(id: string) {
  await updatePost(id, { published: true });
  // HAPUS revalidatePath di sini! Kita akan andalkan router.refresh()
}
```

**Buat file baru:** `components/PublishToggle.tsx`
```tsx
'use client'

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { publishPostAction } from '@/app/posts/action';

export function PublishToggle({ postId }: { postId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleToggle() {
    startTransition(async () => {
      // 1. Eksekusi mutasi (tanpa revalidate di server)
      await publishPostAction(postId);
      // 2. Minta Next.js merender ulang halaman ini dengan data terbaru
      router.refresh();
    });
  }

  return (
    <button 
      onClick={handleToggle} 
      disabled={isPending}
      className="underline text-blue-600 disabled:text-gray-400"
    >
      {isPending ? 'Publishing...' : 'Publish'}
    </button>
  );
}
```

### Langkah 4: Memasang PublishToggle di Halaman
_Gantikan form statis Publish dengan Client Component baru._
**Buka file:** `app/posts/page.tsx`
Tambahkan import:
```tsx
import { PublishToggle } from "@/components/PublishToggle";
```

Cari form Publish di komponen `PostList` dan ubah:
```tsx
// SEBELUMNYA:
{!post.published && (
  <form action={publishPostAction.bind(null, post.id)}>
    <button className="underline">Publish</button>
  </form>
)}

// UBAH MENJADI:
{!post.published && <PublishToggle postId={post.id} />}
```

### Langkah 5: Testing & Pembuktian
1. Jalankan `npm run dev`.
2. Buka `http://localhost:3000/posts`.
3. Buat _post_ baru. Karena `createPostAction` sekarang memanggil `revalidateTag('posts', 'max')`, daftar _post_ akan langsung ter-update (seluruh cache dengan tag tersebut di-reset).
4. Di bagian "Panel admin", klik tombol **Publish** pada tulisan yang statusnya masih Draft. 
5. Perhatikan tulisan "Publishing..." muncul karena `startTransition`. Begitu selesai, `router.refresh()` akan me-_refresh_ daftar dan UI, tulisan "Draft" langsung berubah menjadi "Published" tanpa mereset status *Client Component* lainnya!
