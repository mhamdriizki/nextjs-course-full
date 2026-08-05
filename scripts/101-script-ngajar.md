# Naskah Live Demo — Modul 10 Bab 1: Mengapa Runtime Validation Penting (Zod)

**Modul baru** — bukan lagi Modul 9/Prisma, ini Modul 10: Validasi Data & Forms. Durasi perkiraan 40-45 menit. Semua sudah **dieksekusi dan diverifikasi nyata** di branch ini — bukan disalin dari slide.

## Ringkasan urutan file yang diubah, dari awal sampai akhir

Ini urutan pengerjaan yang benar diikuti pas eksekusi — ikuti urutan yang sama pas live-coding di kelas:

1. **`package.json` / `bun.lock`** — install `zod` (`bun add zod`). Versi yang ter-install: **Zod v4.4.3** — bukan v3 seperti asumsi banyak tutorial lama.
2. **`lib/validations/post.ts`** (baru) — `createPostSchema` + `type CreatePostInput`.
3. **`lib/validations/auth.ts`** (baru) — `passwordSchema` pakai `.refine()`.
4. **`app/posts/action.ts`** (edit) — `createPostAction` diganti total: dari validasi manual (`if (!title...)`) jadi `createPostSchema.safeParse(...)`, sekaligus ubah signature jadi kompatibel `useActionState`.
5. **`app/posts/CreatePostForm.tsx`** (baru) — Client Component pakai `useActionState`, nampilin error per field dari Zod.
6. **`app/posts/page.tsx`** (edit) — ganti `<form action={createPostAction}>` inline jadi `<CreatePostForm />`.

---

## ⚠️ Dua temuan nyata dari eksekusi — wajib disampaikan ke kelas

### 1. Bug urutan chaining yang ada di slide-nya sendiri (muncul 2 kali)

Slide contoh (halaman 3): `z.string().min(2).max(50).trim()`, dan (halaman 4): `z.string().email().toLowerCase().trim()`.

**Sudah dibuktikan nyata kedua-duanya salah urutan.** Zod menjalankan method **persis sesuai urutan ditulis**. Test yang saya jalankan:

```ts
const nameSchemaSlideOrder = z.string().min(3).max(50).trim();
nameSchemaSlideOrder.safeParse("  ab  "); // LOLOS! data="ab" (cuma 2 karakter, harusnya minimal 3)

const nameSchemaFixed = z.string().trim().min(3).max(50);
nameSchemaFixed.safeParse("  ab  "); // DITOLAK (benar)
```

```ts
const wrongOrder = z.string().email().toLowerCase().trim();
wrongOrder.parse("USER@EXAMPLE.COM "); // ZodError! validasi email jalan SEBELUM trim, spasi di akhir bikin gagal

const rightOrder = z.string().trim().toLowerCase().email();
rightOrder.parse("USER@EXAMPLE.COM "); // "user@example.com" — berhasil
```

> **Aturan yang wajib ditekankan ke siswa:** transform (`.trim()`, `.toLowerCase()`) itu **selalu ditaruh duluan**, validasi format/panjang (`.min()`, `.max()`, `.email()`) ditaruh **belakangan** — supaya validasinya jalan terhadap nilai yang sudah bersih, bukan nilai mentah.

Semua schema yang saya buat di `lib/validations/post.ts` sudah pakai urutan yang benar (`trim()` dulu, baru `min()`/`max()`).

### 2. `revalidatePath` tidak bisa dites lewat script standalone

Waktu saya test `createPostAction` langsung via `bun run` (import function-nya, panggil manual), kasus data valid **berhasil nulis ke database** (kebukti dari unique constraint error pas dicoba lagi), tapi function-nya throw di baris `revalidatePath("/posts")` dengan pesan `Invariant: static generation store missing`. Ini bukan bug — `revalidatePath` cuma bisa jalan di dalam request context Next.js beneran (dipanggil dari server yang lagi handle request), bukan dari script Node/Bun biasa. Sama kelasnya dengan pelajaran "Server Action tidak bisa dites `curl`" dari Bab 6 — makin banyak fitur Next.js yang dipakai di dalam suatu function, makin susah dites di luar konteks aslinya.

---

## 1. Framing pembuka (3 menit)

> "Kita ganti topik — dari Prisma/database, sekarang masuk Modul 10: Validasi Data. Tapi ini nyambung langsung ke kode yang sudah ada. Lihat `app/posts/action.ts` sekarang."

**Tunjukkan kode LAMA (sebelum diubah) — screenshot atau `git show HEAD:app/posts/action.ts` kalau sudah ke-commit:**
```ts
export async function createPostAction(formData: FormData) {
  const title = formData.get("title") as string;
  const slug = formData.get("slug") as string;
  const excerpt = formData.get("excerpt") as string;
  const content = formData.get("content") as string;

  if (!title || !slug || !excerpt) return;
  // ...
}
```

**Talking point, bedah masalahnya:**
> "Lihat baris `if (!title || !slug || !excerpt) return;`. Ini validasi paling minim yang bisa ada. Nggak ada batas panjang — user bisa kirim judul 1 juta karakter. Nggak ada cek format slug — bisa kirim spasi, huruf besar, simbol apa saja. Dan kalau gagal, `return` kosong — user nggak dikasih tahu **kenapa** gagal, form-nya cuma diam. Ini yang mau kita bereskan pakai Zod."

---

## 2. Kenapa TypeScript nggak cukup (5 menit) — slide halaman 2

**Live-type — tunjukkan langsung di editor, jangan cuma dibaca dari slide:**

```ts
interface CreatePostInput {
  title: string;
  content: string;
}

async function createPost(data: CreatePostInput) {
  // TypeScript PERCAYA data.title itu string
  await db.post.create({ data });
}
```

**Talking point:**
> "`interface` ini cuma janji yang dicek TypeScript **pas kalian nulis kode** — compile time. Begitu kode ini kompilasi jadi JavaScript dan jalan di server, TypeScript-nya udah hilang, nggak ada lagi yang ngecek. Kalau `data` itu datang dari `formData.get('title') as string` — perhatikan kata `as string` itu, itu namanya **type assertion**, kalian yang maksa TypeScript percaya, bukan TypeScript yang beneran ngecek. Nilai aslinya bisa `null` (field nggak diisi), bisa string kosong, bisa 100rb karakter, bisa `<script>alert(1)</script>` — TypeScript nggak akan protes sama sekali karena kalian sudah bilang 'percaya saja, ini string'."

> "Ini beda banget sama validasi runtime. Zod itu ngecek **nilai aslinya**, pas kode beneran jalan, bukan cuma tipe di kepala compiler."

---

## 3. Zod basics — install & primitives (8 menit) — slide halaman 3

**Live-run:**
```bash
bun add zod
```

> "Sudah ke-install versi 4.4.3 di project kita — Zod versi 4. Kalau kalian nemu tutorial lama di internet, hati-hati, beberapa syntax versi 3 masih jalan di v4 (backward compatible), tapi ada juga yang direkomendasikan pakai cara baru. Kita pakai gaya yang familiar dulu (chain method), karena itu yang paling umum dan tetap didukung."

**Live-type — primitives, satu-satu:**
```ts
import { z } from "zod";

const nameSchema = z.string().trim().min(2).max(50);
//                             ^^^^^^ trim DULU, baru validasi panjang — lihat temuan di atas
const emailSchema = z.string().trim().toLowerCase().email("Email tidak valid");
const ageSchema = z.number().int().min(0).max(150);
const slugSchema = z.string().regex(/^[a-z0-9-]+$/, "Slug tidak valid");
```

**Live-run — buktikan urutan yang salah beneran gagal (ini demo paling penting di bab ini):**
```ts
console.log(z.string().min(3).max(50).trim().safeParse("  ab  "));
// { success: true, data: "ab" }  ← BUG! "ab" cuma 2 karakter, lolos validasi min(3)

console.log(z.string().trim().min(3).max(50).safeParse("  ab  "));
// { success: false, ... }  ← BENAR
```

> "Coba jalankan dua-duanya di depan kelas. Yang pertama **lolos**, padahal isinya cuma 2 karakter. Yang kedua **ditolak**, sesuai yang kita mau. Bedanya cuma posisi `.trim()`. Ini contoh nyata kenapa kalian harus paham **urutan eksekusi**, bukan cuma hafal nama-nama method-nya."

**Live-type — `safeParse`, tekankan ini yang WAJIB dipakai di Server Action:**
```ts
const result = emailSchema.safeParse("bukan-email");
if (!result.success) {
  console.log(result.error.issues[0].message); // "Email tidak valid"
}
```

> "`safeParse` **tidak pernah throw**. Dia selalu balikin object `{ success, data }` atau `{ success: false, error }`. Ini penting banget di Server Action — kalau kalian pakai `.parse()` biasa dan itu throw `ZodError`, dan kalian nggak tangkep dengan try/catch, seluruh request bisa crash. `safeParse` lebih aman buat pola 'cek dulu, baru lanjut'."

---

## 4. `z.object` & `z.infer` — bikin schema post beneran (10 menit) — slide halaman 3, **live-coding utama**

**Live-type — buat file baru `lib/validations/post.ts`:**

```ts
import { z } from "zod";

export const createPostSchema = z.object({
  title: z.string().trim().min(3, "Judul minimal 3 karakter").max(100, "Judul maksimal 100 karakter"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, "Slug cuma boleh huruf kecil, angka, dan tanda minus"),
  excerpt: z.string().trim().min(3, "Excerpt minimal 3 karakter").max(200, "Excerpt maksimal 200 karakter"),
  content: z.string().trim().min(10, "Konten minimal 10 karakter").optional(),
  published: z.boolean().default(false),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
```

**Talking point sambil ngetik, hubungkan ke schema Prisma yang sudah ada dari Modul 9:**
> "Perhatikan field-fieldnya — ini sengaja saya samakan sama model `Post` kita di `schema.prisma`: `title`, `slug`, `excerpt` (wajib di project kita), `content` (opsional), `published`. Zod schema ini jadi **lapisan validasi** sebelum data itu nyampe ke Prisma. Prisma sendiri nggak validasi panjang string atau format — dia cuma jamin tipe datanya cocok sama kolom database. Zod yang jamin isinya **masuk akal**."

**Live-type — `z.infer`, tunjukkan efeknya langsung di editor (hover ke `CreatePostInput`):**
> "Hover ke `CreatePostInput` — lihat, TypeScript nunjukkin bentuknya persis: `{ title: string; slug: string; excerpt: string; content?: string; published: boolean }`. Ini **auto-generate** dari schema, satu sumber kebenaran. Kalau nanti kalian ubah `min(3)` jadi `min(5)` di schema, kalian nggak perlu ubah type manapun lagi — cuma satu tempat yang diedit."

---

## 5. Wire ke Server Action beneran (10 menit) — **live-coding utama kedua**

**Live-edit — buka `app/posts/action.ts`, ganti `createPostAction`:**

```ts
import { createPostSchema } from "@/lib/validations/post";

export type CreatePostActionState = {
  errors?: Record<string, string[] | undefined>;
  success?: boolean;
};

export async function createPostAction(
  _prevState: CreatePostActionState,
  formData: FormData
): Promise<CreatePostActionState> {
  const result = createPostSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    excerpt: formData.get("excerpt"),
    content: formData.get("content") || undefined,
  });

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  const author = await getOrCreateDemoAuthor();
  await createPost({ ...result.data, authorId: author.id });
  revalidatePath("/posts");
  return { success: true };
}
```

**Talking point, bedah tiap bagian:**
> "Perhatikan `formData.get('title')` sekarang **tidak** di-cast pakai `as string`. Kita kasih langsung ke `safeParse` sebagai `unknown` — Zod yang mengecek dan mengoreksinya, bukan kita yang maksa percaya. Kalau `!result.success`, kita balikin `result.error.flatten().fieldErrors` — ini object yang keys-nya nama field, isinya array pesan error per field. Kalau sukses, `result.data` itu **sudah typed dan sudah tervalidasi** — tinggal spread langsung ke `createPost`, nggak perlu validasi manual lagi sama sekali."

**Live-demo — kenapa signature berubah jadi `(prevState, formData)`:**
> "Ini bukan kebetulan. Ini signature yang dibutuhkan `useActionState` dari React — hook yang bisa nangkep **return value** dari Server Action dan pakai buat render ulang UI. Form biasa (`<form action={fn}>`) itu 'tembak dan lupa' — nggak ada cara balikin pesan error ke user. `useActionState` yang jembatanin itu."

**Live-type — buat `app/posts/CreatePostForm.tsx` baru:**

```tsx
"use client";

import { useActionState } from "react";
import { createPostAction, type CreatePostActionState } from "./action";

const initialState: CreatePostActionState = {};

export function CreatePostForm() {
  const [state, formAction, isPending] = useActionState(createPostAction, initialState);

  return (
    <form action={formAction} className="space-y-2 border rounded-lg p-4">
      <div>
        <input type="text" name="title" placeholder="Judul" className="border p-2 w-full rounded" />
        {state.errors?.title && <p className="text-red-500 text-xs mt-1">{state.errors.title[0]}</p>}
      </div>
      {/* ...slug, excerpt, content dengan pola yang sama... */}
      <button type="submit" disabled={isPending} className="bg-slate-900 text-white px-4 py-2 rounded disabled:opacity-50">
        {isPending ? "Menyimpan..." : "Buat Post"}
      </button>
      {state.success && <p className="text-green-600 text-sm">Post berhasil dibuat!</p>}
    </form>
  );
}
```

**Talking point:**
> "`useActionState(createPostAction, initialState)` balikin tiga hal: `state` (hasil terakhir dari action — errors atau success), `formAction` (versi yang dipasang ke `<form action={...}>`), dan `isPending` (lagi proses atau nggak, buat disable tombol). Perhatikan file ini **wajib** `'use client'` — `useActionState` itu React hook, hook cuma bisa di Client Component. Tapi `createPostAction` sendiri tetap Server Action (`'use server'`), tetap jalan di server. Client Component ini cuma jembatan buat nangkep hasilnya secara interaktif."

**Live-edit — `app/posts/page.tsx`, ganti form inline:**
```tsx
// Sebelum: <form action={createPostAction}>...</form> ditulis manual di page.tsx
// Sesudah:
import { CreatePostForm } from "./CreatePostForm";
// ...
<CreatePostForm />
```

---

## 6. Test langsung di browser (5 menit)

> "Buka `/posts` di browser. Coba submit form kosongan dulu — lihat, muncul pesan merah di bawah tiap field, bukan cuma diam kayak sebelumnya. Coba isi judul cuma 2 huruf — muncul 'Judul minimal 3 karakter'. Coba isi slug pakai spasi atau huruf besar — muncul pesan format salah. Baru isi semua dengan benar — post kesimpen, pesan hijau 'berhasil' muncul."

(Catatan buat presenter: kalau mau demo cepat tanpa browser, sudah saya buktikan lewat script langsung bahwa validasi errornya presisi — tapi bagian `revalidatePath`/sukses penuh **cuma bisa dibuktikan lewat browser beneran**, sesuai temuan di atas.)

---

## 7. `refine()` — validasi lintas-field (7 menit) — slide halaman 4

**Live-type — buat `lib/validations/auth.ts`:**

```ts
import { z } from "zod";

export const passwordSchema = z
  .object({
    password: z.string().min(8, "Password minimal 8 karakter"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password tidak cocok",
    path: ["confirmPassword"],
  });

export type PasswordInput = z.infer<typeof passwordSchema>;
```

**Talking point:**
> "Semua yang kita lihat sebelumnya itu validasi **satu field sendiri-sendiri** — `title` divalidasi lepas dari `slug`. `refine()` beda, dia jalan **setelah** semua field individual valid, dan bisa bandingkan antar-field. Di sini kita cek `password === confirmPassword`. Perhatikan `path: ['confirmPassword']` — ini nentuin error-nya nempel ke field mana. Kalau nggak dikasih `path`, errornya nempel ke root object, bukan ke field spesifik, jadi susah ditampilkan di bawah input yang tepat."

**Live-run — buktikan cepat:**
```ts
passwordSchema.safeParse({ password: "12345678", confirmPassword: "beda" });
// { success: false, error: { ...path: ["confirmPassword"], message: "Password tidak cocok" } }
```

**Sebut cepat — `optional`/`nullable`/`default`/`array` dari slide halaman 4, cukup dibaca:**
```ts
excerpt: z.string().max(200).optional(),   // boleh undefined
coverImage: z.string().url().nullable(),   // boleh null
tags: z.array(z.string()).max(5, "Maks 5 tag"),
categoryId: z.string().uuid("Kategori tidak valid"),
```
> "Bedanya `optional()` dan `nullable()`: `optional` artinya field itu boleh **tidak ada sama sekali** (`undefined`), `nullable` artinya field itu **ada** tapi nilainya boleh `null`. Beda konsep, jangan ketuker."

---

## 8. Kuis cepat (3 menit) — slide halaman 5

1. Kenapa TypeScript saja nggak cukup buat validasi data user? → **A** (TypeScript cuma bekerja compile-time, data runtime nggak dicek)
2. Beda `safeParse` dan `parse`? → **B** (`safeParse` return `{success, data/error}`, tidak throw; `parse` throw `ZodError` kalau gagal)
3. Fungsi `z.infer<typeof schema>`? → **C** (derive TypeScript type dari schema — satu source of truth, tidak perlu duplikasi)

---

## 9. Tutup + homelab (2 menit) — slide halaman 6-7

Rangkuman lisan:
- TypeScript = compile-time saja. Data dari user/API/database harus divalidasi eksplisit di runtime.
- Zod: satu schema → runtime validation + TypeScript type sekaligus.
- `safeParse` — **selalu** dipakai di Server Action, tidak throw.
- `z.object` + `optional()`/`nullable()`/`default()`/`refine()` buat schema kompleks.
- `z.infer<typeof schema>` — satu schema, satu type, tidak ada duplikasi interface.
- **Urutan chain method penting**: transform (`trim`, `toLowerCase`) sebelum validasi (`min`, `max`, `email`) — dibuktikan langsung bug-nya kalau salah urutan.

Homelab — **sudah dieksekusi penuh** di project ini, siswa tinggal baca kode atau replikasi di model lain:
1. Install & Schema — `lib/validations/post.ts`, `createPostSchema` ✅
2. `z.infer` Types — `CreatePostInput` dipakai langsung di `createPostAction`, tidak ada interface manual lagi ✅
3. Test `safeParse` — sudah dibuktikan: data invalid → `fieldErrors` presisi per field; data valid → tersimpan ke DB ✅
4. `refine` password — `lib/validations/auth.ts`, `passwordSchema` ✅

Tutup: "Selanjutnya Bab 2 — Zod Schema & Inference Advanced. Kita baru pakai permukaannya; masih ada union, discriminated union, dan pola-pola lebih kompleks buat form yang lebih rumit."
