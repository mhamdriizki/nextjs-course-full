# Script Mengajar — 13.3 Validasi File

**Sumber:** `scripts/133.pdf` (7 slide) — Modul 13, Upload File & Optimasi Gambar

> ⚠️ **Catatan penting sebelum mulai ngajar:** slide bilang "Zod tidak punya
> `z.file()` bawaan, gunakan `z.instanceof(File).refine()`". Itu benar untuk
> Zod versi lama, tapi **project ini pakai `zod@4.4.3`, yang sudah punya
> `z.file()` native** (cek `node_modules/zod/v4/classic/schemas.d.ts:594`,
> lengkap dengan `.min()`, `.max()`, `.mime()`). Jadi pas live coding kita
> pakai `z.file()`, bukan `z.instanceof(File).refine()` — lebih ringkas dan
> sesuai versi yang beneran ke-install. Ini contoh persis kenapa AGENTS.md
> bilang "cek dulu sebelum nulis kode", jangan asal ikutin materi slide.

---

## Slide 1 — Validasi File dengan Zod

**Durasi:** 2 menit

**Script:**
"Oke gaes, masuk ke modul 13.3 — Validasi File dengan Zod. Jadi kalau di
modul sebelumnya kita udah bisa upload avatar ke Cloudinary, sekarang kita
mau ngerapihin validasinya. Karena kalau upload asal terima file apa aja,
itu bahaya banget — nanti kita bahas kenapa di slide berikutnya.

Kita bakal pakai Zod buat validasi file — size-nya berapa, tipe MIME-nya
apa, kosong apa nggak. Dan spoiler dikit: materi bilang Zod nggak punya
`z.file()` bawaan, tapi begitu kita cek di project ini, ternyata Zod versi
yang kepasang di sini (`zod@4.4.3`) itu udah punya `z.file()` beneran. Jadi
nanti kita pakai yang native aja, biar kalian juga kebiasaan buat selalu
cek versi library yang beneran kepasang, jangan cuma modal hafalan dari
tutorial lama."

---

## Slide 2 — Risiko Upload Tanpa Validasi

**Durasi:** 4 menit

**Script:**
"Sebelum ngoding, kita omongin dulu kenapa validasi file ini penting
banget. Ada empat risiko utama kalau kita terima upload tanpa validasi:

Pertama, **Malware Upload** — user upload file `.exe`, `.php`, atau `.sh`.
Kalau file itu somehow bisa dieksekusi di server kita, ya abis udah,
server bisa dikuasai orang lain.

Kedua, **MIME Spoofing** — ini yang sering diremehin. File `.html` atau
`.php` di-rename doang jadi `.jpg`, terus kalau validasi kita cuma cek
ekstensi nama file, ya lolos aja. Makanya nanti kita validasi berdasarkan
`file.type` (MIME type), bukan cuma nama filenya.

Ketiga, **Storage Exhaustion** — user upload file gede-gede berkali-kali,
storage kita penuh, dan kalau pakai layanan cloud yang bayar per GB,
billing bisa meledak. Makanya kita selalu kasih batas ukuran maksimal.

Keempat, **Path Traversal** — filename kayak `../../../etc/passwd` bisa
dipakai buat nimpa file sistem penting kalau kita naif nyimpen file
langsung pakai nama asli dari user. Untungnya kita udah pakai Cloudinary
dan `nanoid()` buat generate nama file sendiri, jadi risiko ini udah kita
mitigasi dari desain awal — tapi tetep penting dipahami kenapa.

Nah, keempat risiko ini yang bakal kita tangkal pakai Zod schema di slide
berikutnya."

---

## Slide 3 — Zod File Schema — instanceof + refine()

**Durasi:** 12 menit

**Script:**
"Sekarang kita bikin validator file yang reusable. Di project ini,
folder buat schema Zod itu namanya `lib/validation/` — bukan
`lib/validations/` kayak di slide ya, kalian bisa cek sendiri
`lib/validation/post.ts` sama `lib/validation/user.ts` udah ada di situ.
Jadi biar konsisten, file baru kita taruh di `lib/validation/file.ts`.

Terus soal `z.instanceof(File).refine()` yang disebut di slide — itu emang
cara klasik. Tapi begitu saya cek versi Zod yang kepasang di `package.json`
project ini, ternyata `zod@4.4.3` udah punya `z.file()` native lengkap
dengan `.min()`, `.max()`, `.mime()`. Jadi kodenya bisa lebih ringkas.
Yuk kita bikin."

### 🖥️ Live Coding

1. Buat file baru `lib/validation/file.ts`:

   ```ts
   import { z } from "zod";

   const MAX_IMG = 5 * 1024 * 1024; // 5MB
   const MAX_DOC = 10 * 1024 * 1024; // 10MB

   const IMAGE_TYPES = [
     "image/jpeg",
     "image/png",
     "image/webp",
     "image/gif",
   ] as const;

   const DOC_TYPES = [
     "application/pdf",
     "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
   ] as const;

   // ── Image validator ──────────────────────────────────────────────
   export const imageFileSchema = z
     .file()
     .min(1, "File tidak boleh kosong")
     .max(MAX_IMG, "Ukuran maksimal 5MB")
     .mime([...IMAGE_TYPES], `Hanya ${IMAGE_TYPES.join(", ")} yang diizinkan`);

   // ── Document validator ───────────────────────────────────────────
   export const documentFileSchema = z
     .file()
     .max(MAX_DOC, "Maksimal 10MB")
     .mime([...DOC_TYPES], "Hanya PDF dan DOC yang diizinkan");

   // ── Form schema dengan file ──────────────────────────────────────
   export const uploadAvatarSchema = z.object({
     avatar: imageFileSchema,
   });

   export type UploadAvatarInput = z.infer<typeof uploadAvatarSchema>;

   // ── Optional file ─────────────────────────────────────────────────
   export const optionalImageSchema = imageFileSchema.optional().nullable();
   ```

2. Jelasin ke kelas: `.min(1, ...)` gantiin `refine(f => f.size > 0, ...)`,
   `.max(MAX_IMG, ...)` gantiin refine size, dan `.mime([...], ...)` gantiin
   refine MIME type — tiga chain method built-in yang persis nge-cover tiga
   `refine()` yang ada di slide, tapi tanpa nulis refine function manual.

   > Gotcha kecil: `IMAGE_TYPES`/`DOC_TYPES` dideklarasikan pakai
   > `as const`, jadi tipenya `readonly [...]`. Method `.mime()` minta
   > array biasa (mutable), bukan readonly tuple — makanya dipanggil pakai
   > `.mime([...IMAGE_TYPES], ...)`, spread dulu biar jadi array baru yang
   > mutable. Kalau lupa, `tsc` bakal komplain "readonly ... is not
   > assignable to ... MimeTypes[]".

3. **Verifikasi cepat** — buka terminal, jalankan REPL kecil buat mastiin
   schema-nya jalan (opsional, kalau mau nunjukin ke kelas):

   ```bash
   bun -e '
   import { imageFileSchema } from "./lib/validation/file";
   const fakeImage = new File(["x"], "a.png", { type: "image/png" });
   const fakeHtml = new File(["x"], "a.html", { type: "text/html" });
   console.log(imageFileSchema.safeParse(fakeImage).success); // true
   console.log(imageFileSchema.safeParse(fakeHtml).success);  // false
   '
   ```

**Manual test checklist:**
- [ ] `imageFileSchema.safeParse()` dengan file image valid → `success: true`
- [ ] Dengan file `.html` (MIME `text/html`) → `success: false`, error dari `.mime()`
- [ ] Dengan file > 5MB → `success: false`, error dari `.max()`

---

## Slide 4 — Integrasi Validasi File di Server Action

**Durasi:** 15 menit

**Script:**
"Sekarang kita pasang schema ini ke Server Action avatar upload yang udah
ada, `app/dashboard/settings/avatar-action.ts`. Sekarang di situ
validasinya masih manual — cek `instanceof File`, cek `file.type`, cek
`file.size` satu-satu pakai if-else. Kita ganti jadi `safeParse`, biar
konsisten sama pattern yang udah kalian pakai di `createPostAction`
(`app/posts/action.ts`) — `safeParse` → cek `result.success` → kalau gagal
return `flattenError(result.error).fieldErrors`."

### 🖥️ Live Coding

1. Refactor `app/dashboard/settings/avatar-action.ts`:

   ```ts
   "use server";

   import { auth } from "@/lib/auth";
   import { uploadImage } from "@/lib/cloudinary";
   import { db } from "@/lib/db";
   import { ActionResult } from "@/lib/validation/action-result";
   import { uploadAvatarSchema } from "@/lib/validation/file";
   import { revalidatePath } from "next/cache";
   import { headers } from "next/headers";
   import { flattenError } from "zod";

   export async function updateAvatarAction(
     _prevState: ActionResult<{ url: string }> | null,
     formData: FormData
   ): Promise<ActionResult<{ url: string }>> {
     const session = await auth.api.getSession({
       headers: await headers(),
     });

     if (!session) {
       return { success: false, message: "Unauthorized" };
     }

     const result = uploadAvatarSchema.safeParse({
       avatar: formData.get("avatar"),
     });

     if (!result.success) {
       return { success: false, errors: flattenError(result.error).fieldErrors };
     }

     try {
       const { url } = await uploadImage(result.data.avatar, {
         folder: "avatars",
         publicId: session.user.id,
       });

       await db.user.update({
         where: { id: session.user.id },
         data: { image: url },
       });

       revalidatePath("/dashboard/settings");
       return { success: true, data: { url } };
     } catch (error) {
       return { success: false, message: "Gagal upload avatar baru" };
     }
   }
   ```

   Jelasin: `result.data.avatar` sekarang udah type-safe sebagai `File`,
   nggak perlu type assertion lagi kayak sebelumnya.

2. Tampilkan field error di `app/dashboard/settings/AvatarUploadForm.tsx` —
   tambahin baca `state.errors.avatar` pakai optional chaining yang aman:

   ```tsx
   "use client";

   import { useActionState, useEffect, useState } from "react";
   import { updateAvatarAction } from "./avatar-action";
   import { toast } from "sonner";

   export function AvatarUploadForm({
     currentAvatarUrl,
   }: {
     currentAvatarUrl?: string | null;
   }) {
     const [state, formAction, isPending] = useActionState(
       updateAvatarAction,
       null,
     );
     const [preview, setPreview] = useState<string | null>(null);

     useEffect(() => {
       if (state?.success) {
         toast.success("Avatar berhasil diperbaharui");
       } else if (state && !state.success && state.message) {
         toast.error(state.message);
       }
     }, [state]);

     function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
       const file = e.target.files?.[0];
       if (file) {
         setPreview(URL.createObjectURL(file));
       }
     }

     const fieldErrors = state && !state.success ? state.errors : undefined;
     const displayUrl =
       (state?.success ? state.data.url : null) ?? preview ?? currentAvatarUrl;

     return (
       <form action={formAction} className="space-y-3 border rounded-lg p-4">
         {displayUrl && (
           <img
             src={displayUrl}
             alt="Avatar"
             className="w-24 h-24 rounded-full object-cover"
           />
         )}

         <input
           type="file"
           name="avatar"
           accept="image/*"
           onChange={handleFileChange}
           className="block"
         />

         {fieldErrors?.avatar?.[0] && (
           <p className="text-sm text-red-600">{fieldErrors.avatar[0]}</p>
         )}

         <button
           type="submit"
           disabled={isPending}
           className="bg-slate-900 text-white px-4 py-2 rounded disabled:opacity-50"
         >
           {isPending ? "Mengupload" : "Update Avatar"}
         </button>
       </form>
     );
   }
   ```

   > Sekalian benerin dua typo kecil yang udah ada dari sebelumnya:
   > `accept="image/&"` → `accept="image/*"`, dan `h24` → `h-24` (nggak ada
   > class Tailwind bernama `h24`, jadi avatar-nya nggak keliatan bulat
   > proporsional tanpa fix ini).

**Manual test checklist:**
- [ ] `bun dev`, login, buka `/dashboard/settings`
- [ ] Upload file `.pdf` sebagai avatar → muncul pesan error dari `.mime()` di bawah input, bukan generic toast
- [ ] Upload image > 5MB → muncul pesan error dari `.max()`
- [ ] Upload image valid < 5MB → toast sukses, avatar ke-update

---

## Slide 5 — Kuis: Evaluasi Pemahaman

**Durasi:** 5 menit

**Script:**
"Sebelum lanjut, kita cek dulu pemahaman kalian lewat 3 pertanyaan ini.
Jangan diklik dulu jawabannya, coba jawab sendiri dulu di kepala."

**Q1 — Mengapa `z.string()` TIDAK tepat untuk validasi file upload?**
- A) `z.string()` tidak support binary
- **B) File adalah `Blob` object, bukan string. Gunakan `z.instanceof(File)` / `z.file()` untuk type safety.** ✅
- C) `z.string()` lebih lambat

Pembahasan buat disampaikan: "Ini bukan soal support binary atau nggak
cepet — poinnya, `File` di JavaScript itu emang bukan tipe `string`. Kalau
kalian paksa validasi pakai `z.string()`, TypeScript-nya bakal salah dari
awal, dan runtime check-nya juga nggak nge-cek hal yang bener — size,
MIME type, dsb, itu semua properti `File`/`Blob`, bukan `string`."

**Q2 — Bagaimana cara validasi file maks 5MB dengan Zod?**
- A) `z.file().max(5000000)`
- **B) `z.instanceof(File).refine(f => f.size <= 5 * 1024 * 1024, 'Maks 5MB')`** ✅
- C) `z.blob().size(5000000)`

Pembahasan buat disampaikan: "Nah ini menarik — kunci jawaban slide bilang
B, pakai `instanceof + refine`. Tapi inget yang kita praktikin barusan:
project ini pakai Zod versi baru yang punya `z.file().max()` native. Jadi
opsi A sebenernya JUGA valid di project kita — cuma angkanya harus
`5 * 1024 * 1024`, bukan `5000000` (beda dikit, `5000000` itu 5 juta bytes
≈ 4.77MB, bukan 5MB persis). Poin buat kelas: paham konsepnya lebih
penting daripada hafalin satu bentuk sintaks doang, karena API-nya bisa
beda tergantung versi library."

**Q3 — Apakah cek `file.type` saja sudah cukup untuk memverifikasi tipe file?**
- A) Ya — browser set MIME type yang benar
- **B) Tidak — MIME bisa di-spoof. Untuk keamanan tinggi, cek magic bytes juga.** ✅
- C) Ya — server yang verify MIME

Pembahasan buat disampaikan: "Balik lagi ke risiko MIME Spoofing di slide
2 — `file.type` itu di-set sama browser berdasarkan ekstensi file doang,
gampang banget dipalsuin. Buat aplikasi yang butuh keamanan lebih, biasanya
ditambah cek 'magic bytes' — beberapa byte pertama file yang nunjukin tipe
sebenarnya (misal PNG selalu mulai dengan `89 50 4E 47`). Itu di luar
scope Zod bawaan, tapi bagus buat disebutin sebagai next level kalau ada
yang nanya soal keamanan upload di production beneran."

---

## Slide 6 — Homelab: Tugas Mandiri

**Durasi:** 3 menit (penjelasan tugas, dikerjakan di luar kelas)

**Script:**
"Oke, ini tugas buat kalian kerjain sendiri di rumah. Ada 4 bagian."

- **01 — `lib/validations/file.ts`** *(nama di slide beda dikit sama
  project kita, di sini namanya `lib/validation/file.ts` — sudah kita
  bikin bareng-bareng di [Slide 3](#slide-3--zod-file-schema--instanceof--refine).
  Kalian tinggal review ulang kodenya di rumah.)*

- **02 — Test Kasus Edge** — sudah tercover di checklist manual test
  [Slide 3](#slide-3--zod-file-schema--instanceof--refine) dan
  [Slide 4](#slide-4--integrasi-validasi-file-di-server-action). Coba
  ulangi sendiri: file kosong, file 10MB, file `.html` yang di-rename jadi
  `.jpg` (rename manual filenya, submit, terus liat apakah tetep ke-block
  — soalnya validasi kita cek `file.type`/MIME, bukan nama file, jadi
  harusnya tetep lolos filename check tapi keblok di MIME check kalau
  browser masih ngirim `text/html` sebagai `file.type`).

- **03 — Form dengan Errors** — sudah kita bikin bareng di
  [Slide 4](#slide-4--integrasi-validasi-file-di-server-action)
  (`fieldErrors?.avatar?.[0]`).

- **04 — Cover Image** *(belum ada di codebase — ini PR baru, kerjain
  sendiri)*:

  Model `Post` di `prisma/schema.prisma` **belum punya field
  `coverImage`**, jadi langkah pertama beda dari yang lain — perlu migrasi
  Prisma dulu:

  1. Tambah field ke `prisma/schema.prisma`:
     ```prisma
     model Post {
       // ...field lain tetap
       coverImage String?
     }
     ```
  2. Jalankan `bunx prisma migrate dev --name add_post_cover_image`.
  3. Tambah `coverImage` ke tipe `Partial<{...}>` di
     `updatePost()` (`lib/data/post.ts`) biar bisa di-update.
  4. Bikin schema baru di `lib/validation/file.ts`:
     ```ts
     export const uploadCoverImageSchema = z.object({
       postId: z.cuid2(),
       cover: imageFileSchema,
     });
     ```
  5. Bikin Server Action `uploadCoverImageAction` (taruh di
     `app/posts/action.ts`, sebelahan sama `createPostAction`), pattern-nya
     sama persis kayak `updateAvatarAction`: `safeParse` →
     `uploadImage(result.data.cover, { folder: "post-covers" })` →
     `updatePost(result.data.postId, { coverImage: url })` →
     `revalidateTag("posts", "max")`.

  > 💡 Tips dari slide, tetep berlaku: urutan `refine()`/chain method itu
  > dijalankan berurutan — taruh validasi yang paling cepat dulu (`.min()`
  > cek kosong) sebelum yang lebih berat (`.mime()`), biar early-exit kalau
  > filenya emang kosong.

---

## Slide 7 — Rangkuman

**Durasi:** 3 menit

**Script:**
"Oke, sebelum kita lanjut ke Bab 4, kita rekap dulu apa aja yang kita
pelajari hari ini:

Pertama, soal `z.file()` — slide bilang Zod nggak punya ini bawaan, tapi
kita udah buktiin sendiri barusan kalau Zod versi yang kepasang di project
ini (`zod@4.4.3`) justru udah punya `z.file()` native lengkap dengan
`.min()`, `.max()`, `.mime()`. Jadi kalau kalian nemu tutorial atau materi
yang bilang sesuatu 'nggak bisa', selalu double check ke dokumentasi atau
source code versi yang kalian pakai — ini persis yang diingetin di
`AGENTS.md` project kita.

Kedua, validasi minimal buat file itu tiga: size lebih dari 0 (nggak
kosong), size di bawah batas maksimal, dan tipe-nya ada di daftar yang
diizinkan.

Ketiga, `safeParse` bikin `result.data` udah typed dengan benar — di kasus
kita, `result.data.avatar` udah kebaca sebagai `File` sama TypeScript,
nggak perlu `as File` lagi.

Keempat, inget — MIME type itu bisa dipalsuin. Untuk aplikasi yang butuh
keamanan tinggi, next step-nya adalah cek magic bytes, bukan cuma
`file.type`.

Kelima, pattern validasi file ini sama persis strukturnya kayak form
validation yang kita bikin di Modul 11 — `safeParse` → cek `success` →
`flattenError().fieldErrors` — jadi konsisten di seluruh project, kalian
nggak perlu belajar pattern baru tiap kali validasi hal berbeda.

Nanti abis ini kita lanjut ke Bab 4 — `next/image` dan Image Optimization."

---

## Cara Menjalankan & Test

```bash
bun install          # kalau belum
bun dev               # jalankan dev server
```

Lalu buka `http://localhost:3000/dashboard/settings` (harus login dulu),
dan jalankan checklist manual di Slide 3 & Slide 4 di atas: upload file
non-image, file kosong, file > 5MB, dan file image valid — pastikan pesan
error yang tampil sesuai (dari `.mime()` / `.max()` / `.min()`) dan bukan
generic error lagi.

Kalau mau ngetest task Homelab 04 (Cover Image), pastikan migrasi Prisma
(`bunx prisma migrate dev --name add_post_cover_image`) udah jalan dan
`bunx prisma migrate status` nunjukin schema up to date sebelum nyoba
Server Action barunya.
