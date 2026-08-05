# Naskah Live Demo — Modul 10 Bab 2: Zod Schema & Inference Advanced

Durasi perkiraan 45-50 menit. Semua **sudah dieksekusi dan diverifikasi nyata** di branch ini (`coba-102`). Catatan: branch ini ternyata mulai dari state bersih lagi (file `lib/validation/` Bab 1 sempat "hilang" lalu ada lagi dengan sedikit variasi) — jangan asumsikan branch course selalu 100% lanjutan sempurna dari sesi sebelumnya, selalu cek dulu.

## Ringkasan urutan file yang diubah, dari awal sampai akhir

1. **`lib/validation/post.ts`** (rewrite total) — dari satu `createPostSchema` flat, jadi `postSchema` (base, lengkap semua field model `Post`) + 4 turunan: `createPostSchema` (omit), `updatePostSchema` (partial+required), `postPreviewSchema` (pick), `postWithAuthorSchema` (extend).
2. **`lib/validation/user.ts`** (baru) — `registerSchema` (pakai `superRefine`, 3 aturan sekaligus), `loginSchema`.
3. **`lib/validation/action-result.ts`** (baru) — tipe `ActionResult<T>` discriminated union, generic, buat return type Server Action mana pun.
4. **`app/posts/action.ts`** (edit) — `createPostAction` pakai `ActionResult<T>` sebagai return type, `flattenError()` menggantikan `.flatten()` yang deprecated.
5. **`app/posts/CreatePostForm.tsx`** (edit) — disesuaikan ke bentuk `ActionResult<T>` yang baru, manfaatin type-narrowing-nya.

**Catatan:** struktur folder di project ini `lib/validation/` (singular), bukan `lib/validations/` (plural) seperti disebut di homelab slide — sudah mengikuti yang established di project, jangan bikin folder duplikat.

---

## ⚠️ Temuan penting saat eksekusi — Zod v4 lebih "bergerak" dari yang dikira

Project ini pakai **Zod v4.4.3**. Sebelum nulis kode, saya jalankan setiap pattern dari slide satu-satu. Hasilnya:

### 1. Semua fitur inti (omit, pick, partial+required, extend, z.enum, z.nativeEnum, discriminatedUnion, superRefine, z.coerce) BERFUNGSI — kabar baik, tidak ada breaking change di sini.

### 2. TAPI ada tiga API yang sudah **deprecated** (masih jalan, tapi editor kasih hint) — ganti ke versi barunya:

| Ditulis di slide (deprecated, masih jalan) | Ganti ke (direkomendasikan) |
|---|---|
| `z.string().email(...)` | `z.email(...)` (top-level) |
| `z.string().cuid(...)` | `z.cuid2(...)` — lihat poin 3 |
| `result.error.flatten()` | `z.flattenError(result.error)` (top-level, sama persis outputnya) |

### 3. Bug field-type yang lebih serius: `authorId: z.string().uuid()` di slide **akan menolak semua ID asli project ini**

Sudah dibuktikan langsung:
```ts
const user = await db.user.findFirst();
// user.id = "cmsdczft40000af4d79wyv1i4"
z.string().uuid().safeParse(user.id).success  // false!
z.string().cuid2().safeParse(user.id).success // true
```
> Project kita generate ID lewat `@default(cuid())` di Prisma (dari Bab 3), bukan UUID. Bahkan `z.cuid()` (bukan `cuid2`) itu sendiri sudah deprecated di Zod — CUID v1 dianggap tidak aman karena bocorin timestamp di dalam ID-nya. Prisma modern generate CUID v2 by default, jadi yang benar dipakai adalah **`z.cuid2()`**.

---

## 1. Framing pembuka (3 menit)

> "Bab 1 kita bikin satu schema flat buat create post. Tapi project nyata butuh lebih dari itu — kalian butuh schema beda buat create (tanpa `id`), update (semua optional kecuali `id`), list preview (cuma field ringkas), dan tampilan dengan relasi. Nulis empat schema terpisah dari nol itu duplikasi masif — begitu satu field berubah di model, kalian harus update empat tempat. Zod punya cara lebih DRY: satu base schema, turunan-turunannya."

---

## 2. `omit`, `pick`, `partial`, `extend` — live-coding utama (15 menit) — slide halaman 2

**Live-type — buka `lib/validation/post.ts`, mulai dari base schema. Bangun field-by-field, sambil dikoreksi live dari yang di slide:**

```ts
export const postSchema = z.object({
  id: z.cuid2(),  // BUKAN z.string().uuid() seperti slide — akan dijelaskan kenapa
  title: z.string().trim().min(3, "Judul minimal 3 karakter").max(100, "Judul maksimal 100 karakter"),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]+$/, "Slug cuma boleh huruf kecil, angka, dan tanda minus"),
  excerpt: z.string().trim().min(3, "Excerpt minimal 3 karakter").max(200, "Excerpt maksimal 200 karakter"),
  content: z.string().trim().min(10, "Konten minimal 10 karakter").optional(),
  category: z.string().trim().min(1).optional(),
  published: z.boolean().default(false),
  viewCount: z.number().int().nonnegative(),
  authorId: z.cuid2(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});
```

**Live-demo — sebelum lanjut, buktikan kenapa bukan `.uuid()`:**
```ts
const user = await db.user.findFirst();
console.log(user.id); // "cmsdczft40000af4d79wyv1i4"
console.log(z.string().uuid().safeParse(user.id).success); // false — buktikan di depan kelas!
console.log(z.cuid2().safeParse(user.id).success); // true
```
> "Ini kenapa penting selalu cek field type asli di schema Prisma kalian sebelum nulis Zod schema-nya — jangan asal ikut contoh tutorial, karena format ID setiap project bisa beda (`cuid`, `uuid`, `nanoid`, auto-increment integer, dll)."

**Live-type — `omit`, buat versi CREATE:**
```ts
export const createPostSchema = postSchema.omit({
  id: true,
  viewCount: true,
  authorId: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
```
> "Perhatikan saya omit lebih banyak field dari contoh slide. Slide cuma omit `id`, `viewCount`, `createdAt` — auto-generated fields. Saya tambah `authorId`, `updatedAt`, `deletedAt` juga, karena di project kita, `authorId` itu **disuplai server** (dari user yang login / demo author), bukan dari form. Prinsipnya: `omit` semua field yang **bukan tanggung jawab user buat isi**."

**Live-type — `partial().required()`, buat versi UPDATE:**
```ts
export const updatePostSchema = postSchema.partial().required({ id: true });
```
> "`.partial()` bikin **semua** field jadi optional — masuk akal buat update, karena user mungkin cuma mau ganti `title` doang, tanpa nulis ulang `excerpt`, `content`, dst. Tapi `id` **tidak boleh** optional — kita harus tahu post mana yang diupdate. `.required({ id: true })` nge-override balik satu field itu jadi wajib lagi, sisanya tetap optional."

**Live-type — `pick`, buat versi PREVIEW:**
```ts
export const postPreviewSchema = postSchema.pick({
  id: true, title: true, slug: true, published: true, createdAt: true,
});
```
> "Kebalikan dari `omit` — `pick` nentuin field mana **saja** yang diambil, sisanya dibuang. Cocok buat listing halaman utama, di mana kalian nggak butuh `content` penuh atau `viewCount` detail."

**Live-type — `extend`, buat versi WITH AUTHOR:**
```ts
export const postWithAuthorSchema = postSchema.extend({
  author: z.object({ name: z.string(), email: z.email() }),
});
```
> "`extend` kebalikan lagi — nambah field baru ke schema yang sudah ada, bukan mengurangi. Berguna kalau response API kalian nge-include relasi."

**Live-type — semua type otomatis, tanpa nulis interface manual:**
```ts
export type PostInput = z.infer<typeof postSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type PostPreview = z.infer<typeof postPreviewSchema>;
export type PostWithAuthor = z.infer<typeof postWithAuthorSchema>;
```

**Live-run — buktikan ke data asli:**
```ts
const post = await db.post.findFirst({ include: { author: true } });
postPreviewSchema.safeParse(post).success        // true
updatePostSchema.safeParse({ id: post.id, title: "Judul baru saja" }).success  // true, field lain optional
```

---

## 3. `z.enum`, `z.literal`, `z.union`, `discriminatedUnion` (10 menit) — slide halaman 3

**Live-type:**
```ts
const roleSchema = z.enum(["ADMIN", "AUTHOR", "READER"]);
type Role = z.infer<typeof roleSchema>; // "ADMIN" | "AUTHOR" | "READER"
```
> "Cocok banget buat validasi field `role` kita di model `User` — nilai yang boleh terbatas, ketiganya persis."

**Sebut cepat — `z.nativeEnum` masih berfungsi (sudah dites), tapi disebut deprecated di dokumentasi terbaru Zod, direkomendasikan pakai `z.enum` biasa kalau bisa.**

**Live-type — `discriminatedUnion`, ini bagian paling penting di section ini:**
```ts
const apiResponseSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("success"), data: z.object({ id: z.string(), title: z.string() }) }),
  z.object({ status: z.literal("error"), code: z.number(), message: z.string() }),
]);

const res = apiResponseSchema.parse(data);
if (res.status === "success") {
  console.log(res.data.id); // ✅ TypeScript tahu ini ada
} else {
  console.log(res.message); // ✅ TypeScript tahu ini ada, di cabang lain
}
```
**Talking point:**
> "Bedanya sama `z.union` biasa: dengan `discriminatedUnion`, kalian kasih tahu Zod field mana yang jadi 'penentu cabang' — di sini `status`. Begitu kalian cek `if (res.status === 'success')`, TypeScript otomatis **mempersempit** (narrow) tipe `res` jadi cabang yang sesuai. Coba akses `res.message` di dalam blok `if` yang `status === 'success'` — TypeScript bakal protes, karena di cabang itu, `message` **tidak ada**. Ini yang bikin API response handling jadi type-safe, bukan cuma runtime-safe."

---

## 4. `superRefine` — live-coding kedua (10 menit) — slide halaman 4, wire ke `lib/validation/user.ts`

**Bangun masalahnya dulu:**
> "Bab 1 kita udah pakai `.refine()` buat password === confirmPassword. Tapi gimana kalau kita mau nambah aturan lain — password harus ada huruf kapital, harus ada angka — dan mau semua pesan errornya muncul **sekaligus**, bukan cuma satu-satu? `.refine()` cuma bisa nambah **satu** pesan error. `.superRefine()` bisa nambah **banyak**."

**Live-type — buat file baru `lib/validation/user.ts`:**
```ts
export const registerSchema = z
  .object({
    email: z.string().trim().toLowerCase().pipe(z.email("Email tidak valid")),
    password: z.string().min(8, "Password minimal 8 karakter"),
    confirmPassword: z.string(),
  })
  .superRefine(({ password, confirmPassword }, ctx) => {
    if (confirmPassword !== password) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Password tidak cocok", path: ["confirmPassword"] });
    }
    if (!/[A-Z]/.test(password)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Harus mengandung huruf kapital", path: ["password"] });
    }
    if (!/[0-9]/.test(password)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Harus mengandung angka", path: ["password"] });
    }
  });
```

**Talking point — soal `.pipe()` di baris email, ini kombinasi baru dari 2 pelajaran:**
> "Ingat dua pelajaran sebelumnya: transform (`trim`, `toLowerCase`) harus duluan sebelum validasi format, dan `.email()` sudah deprecated, gantinya `z.email()` top-level. Masalahnya, `z.email()` itu bukan method yang bisa di-chain setelah `.toLowerCase()` — dia fungsi berdiri sendiri. Solusinya `.pipe()`: alirkan hasil transform ke schema validasi lain. `z.string().trim().toLowerCase().pipe(z.email(...))` artinya 'trim dan lowercase dulu, baru validasi hasilnya sebagai format email'."

**Live-run — buktikan banyak error sekaligus muncul:**
```ts
registerSchema.safeParse({ email: "a@b.com", password: "lowercase1", confirmPassword: "beda" });
// fieldErrors: {
//   confirmPassword: ["Password tidak cocok"],
//   password: ["Harus mengandung huruf kapital"]
// }
```
> "Dua error, dua field berbeda, satu kali parse. Ini yang nggak bisa dicapai `.refine()` biasa."

---

## 5. `ActionResult<T>` — discriminated union buat Server Action (10 menit) — live-coding ketiga, homelab task 3

**Live-type — buat `lib/validation/action-result.ts`:**
```ts
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; errors: Record<string, string[] | undefined> };
```

**Talking point — kenapa ini TypeScript type biasa, bukan `z.discriminatedUnion()`:**
> "Perhatikan ini **bukan** Zod schema — ini `type` TypeScript biasa, walau konsepnya sama persis (discriminated union pakai field `success` sebagai penentu cabang). Kenapa nggak pakai `z.discriminatedUnion` beneran? Karena `discriminatedUnion` Zod itu buat **validasi data dari luar** yang belum dipercaya — API response, request body. Nilai balik Server Action kita sendiri itu data yang **kita buat sendiri**, di server yang sama, kita tahu persis bentuknya. Nggak perlu divalidasi ulang. Yang kita pakai di sini cuma **konsep** discriminated union-nya buat type-narrowing di sisi client — itu murni fitur TypeScript, gratis, nggak butuh Zod runtime check."

**Live-edit — wire ke `app/posts/action.ts`:**
```ts
import type { ActionResult } from "@/lib/validation/action-result";
import { flattenError } from "zod";

type CreatedPost = Awaited<ReturnType<typeof createPost>>;

export async function createPostAction(
  _prevState: ActionResult<CreatedPost> | null,
  formData: FormData
): Promise<ActionResult<CreatedPost>> {
  const result = createPostSchema.safeParse({ /* ... */ });

  if (!result.success) {
    return { success: false, errors: flattenError(result.error).fieldErrors };
  }

  const author = await getOrCreateDemoAuthor();
  const post = await createPost({ ...result.data, authorId: author.id });
  revalidatePath("/posts");
  return { success: true, data: post };
}
```

**Talking point:**
> "`type CreatedPost = Awaited<ReturnType<typeof createPost>>` — trik TypeScript buat 'curi' tipe return value dari function yang sudah ada, tanpa import tipe Prisma manual. Kalau nanti `createPost` di `lib/data/post.ts` berubah include-nya, tipe ini otomatis ikut berubah, nggak perlu disesuaikan manual di sini."

**Live-edit — `app/posts/CreatePostForm.tsx`, manfaatin narrowing-nya:**
```tsx
const [state, formAction, isPending] = useActionState(createPostAction, null);

const errors = state && !state.success ? state.errors : undefined;
// ...
{state?.success && <p>Post "{state.data.title}" berhasil dibuat</p>}
```
> "Lihat `state.data.title` di baris terakhir — TypeScript **tahu** `state.data` ada di situ, karena kita sudah cek `state?.success` duluan. Coba hapus pengecekan itu dan langsung tulis `state.data.title` — TypeScript protes, karena kalau `success` itu `false`, `data` **tidak ada** sama sekali di tipe itu, yang ada `errors`. Ini bukti nyata manfaat discriminated union: bug 'akses property yang mungkin nggak ada' ketahuan sebelum kode dijalankan."

**Live-demo di browser:** submit form kosong → error per field. Submit lengkap → pesan "Post ... berhasil dibuat" muncul, judulnya sesuai yang diketik.

---

## 6. `z.coerce` — sekilas (3 menit) — slide halaman 7 rangkuman

```ts
const pageSchema = z.coerce.number().int().positive();
pageSchema.parse("5"); // 5 (number, bukan string "5")
```
> "Berguna banget buat `searchParams` — inget di Bab 7 Prisma, kita ngambil `page` dari URL query, itu selalu **string**, walau isinya angka. `z.coerce.number()` otomatis convert dulu sebelum validasi jalan. Kalau nanti kalian mau perketat validasi pagination di `getPosts()` yang sudah ada, ini polanya."

---

## 7. Kuis cepat (3 menit) — slide halaman 5

1. `postSchema.omit({ id: true, createdAt: true })` ngapain? → **B** (bikin schema baru tanpa field itu, buat form CREATE)
2. Keunggulan `discriminatedUnion` dibanding `union` biasa? → **B** (TypeScript bisa narrow type berdasarkan discriminator field)
3. `superRefine` dipakai buat? → **B** (nambah multiple errors ke beberapa field berbeda sekaligus)

---

## 8. Tutup + homelab (2 menit) — slide halaman 6-7

Rangkuman lisan:
- `omit`/`pick`/`partial`/`extend` — satu base schema, banyak turunan, DRY.
- `z.enum` buat nilai terbatas, `discriminatedUnion` buat type-safe branching.
- `refine()` = satu error; `superRefine()` = banyak error ke banyak field.
- `z.coerce.number()` — convert string jadi number sebelum validasi (berguna buat query params).
- Beberapa API di slide sudah deprecated di Zod v4 yang kita pakai: `.email()`→`z.email()`, `.cuid()`→`z.cuid2()`, `.flatten()`→`z.flattenError()`.

Homelab — **sudah dieksekusi penuh**, siswa tinggal baca kode:
1. `lib/validation/post.ts` — `postSchema` lengkap + `createPostSchema`/`updatePostSchema`/`postPreviewSchema` ✅
2. `lib/validation/user.ts` — `registerSchema` (superRefine) + `loginSchema` ✅
3. `lib/validation/action-result.ts` — `ActionResult<T>`, dipakai beneran di `createPostAction` ✅
4. Pesan error Bahasa Indonesia — sudah konsisten di semua schema dari Bab 1 ✅

Tutup: "Selanjutnya Bab 3 — Validasi di Server Actions & API Routes. Kita udah punya schema-schema-nya; sekarang perdalam cara pakainya di berbagai jenis endpoint, termasuk Route Handler yang belum kita sentuh."
