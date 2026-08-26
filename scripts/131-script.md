# Script Ngajar — Modul 13: Upload File & Next/Image

> Sumber: `scripts/131.pdf` (7 slide). Semua contoh kode di bawah sudah dicek
> terhadap kondisi repo saat ini (Next.js 16.2.10, `cacheComponents: true`,
> pola `ActionResult<T>` di `lib/validation/action-result.ts`, dan gaya
> Route Handler di `app/api/posts/route.ts` + `lib/api-response.ts`).

---

## Slide 1 — Modul 13 · Upload File & Optimasi Gambar

**Durasi:** 2 menit

**Script:**

"Oke gaes, masuk ke Modul 13! Ini modul yang lumayan seru soalnya kita bakal
belajar hal yang hampir pasti kalian butuhin di project nyata: upload file.
Mau itu foto profil, dokumen, atau gambar produk di e-commerce, ujung-ujungnya
pasti ketemu fitur upload.

Fokus kita hari ini ada dua: pertama, dasar-dasar upload file lewat **Server
Action** dan **Route Handler** — dua cara resmi Next.js buat nerima file dari
browser. Kedua, nanti kita nyambung ke `next/image` buat optimasi gambar.

Yang perlu diinget dari judul modul ini: `FormData` + `File` API itu jalan di
server, bukan cuma di browser. Jadi kita bakal banyak main-main sama Web API
bawaan kayak `FormData`, `File`, dan `Blob` — bukan library eksternal buat
parsing multipart."

---

## Slide 2 — File Upload: Bagaimana Server Menerima

**Durasi:** 6 menit

**Script:**

"Sebelum ngoding, kita pahamin dulu alurnya. Waktu kalian punya `<input
type='file'>` di dalam `<form>`, browser itu ngirim request dengan
`Content-Type: multipart/form-data`. Ini beda sama JSON biasa — di
multipart/form-data, body request itu dipecah jadi 'bagian-bagian', salah
satunya adalah file mentah.

Nah, di sisi server — baik itu Server Action maupun Route Handler — Next.js
udah otomatis parsing multipart ini jadi objek `FormData`. Kalian tinggal
`formData.get('nama_field')`, dan yang balik itu instance `File`. `File` ini
sebenernya turunan dari `Blob`, jadi dia punya data binary plus metadata.

Ada 4 hal penting dari objek `File` ini, gaes, catet baik-baik:

1. **`file.name`** — nama asli file dari komputer user. Misal `foto liburan
   (1).jpg`. INI JANGAN dipakai langsung sebagai nama file di server! Kenapa?
   Nanti kita bahas di slide berikutnya, tapi intinya rawan bahaya.
2. **`file.type`** — MIME type-nya, kayak `image/jpeg`, `image/png`,
   `application/pdf`. Ini yang kalian pakai buat validasi tipe file.
3. **`file.size`** — ukuran dalam bytes. Inget rumus: 1KB = 1024 bytes, 1MB =
   1024 * 1024 bytes = 1.048.576 bytes. Ini penting buat kasih limit ukuran
   upload.
4. **`await file.arrayBuffer()`** — ini yang paling penting. Ini ngasih kalian
   binary data mentah dalam bentuk `ArrayBuffer`, yang nanti kalian ubah jadi
   `Buffer` (di Node.js) buat ditulis ke disk, atau dikirim ke cloud storage.
   Ada juga `await file.text()` kalau filenya text/CSV.

Mari kita coba langsung — bikin Server Action kosong dulu buat lihat properti
ini muncul beneran."

### 🖥️ Live Coding

Kita bikin folder baru `app/uploads/` khusus buat modul ini, biar rapi dan
gak numpuk sama folder lain yang udah ada (`app/posts`, `app/blog`, dll).

1. Buat file `app/uploads/inspect-action.ts` — Server Action sederhana buat
   ngeliat properti `File` di console server:

   ```ts
   // app/uploads/inspect-action.ts
   "use server";

   export async function inspectFileAction(formData: FormData) {
     const file = formData.get("file");

     if (!(file instanceof File)) {
       console.log("Tidak ada file yang dikirim");
       return;
     }

     console.log({
       name: file.name,
       type: file.type,
       sizeInKB: (file.size / 1024).toFixed(2),
     });

     const buffer = Buffer.from(await file.arrayBuffer());
     console.log("Binary length:", buffer.length, "bytes");
   }
   ```

2. Buat form kecil buat nyobain, `app/uploads/InspectForm.tsx`:

   ```tsx
   // app/uploads/InspectForm.tsx
   "use client";

   import { inspectFileAction } from "./inspect-action";

   export function InspectForm() {
     return (
       <form action={inspectFileAction} className="space-y-2">
         <input type="file" name="file" accept="image/*" />
         <button type="submit" className="border px-3 py-1 rounded">
           Cek Properti File
         </button>
       </form>
     );
   }
   ```

3. Buat `app/uploads/page.tsx` buat render form-nya:

   ```tsx
   // app/uploads/page.tsx
   import { InspectForm } from "./InspectForm";

   export default function UploadsPage() {
     return (
       <main className="p-8 space-y-4">
         <h1 className="text-xl font-bold">Modul 13 — Upload File</h1>
         <InspectForm />
       </main>
     );
   }
   ```

**Test manual:**

- Jalankan `bun dev`, buka `http://localhost:3000/uploads`.
- Pilih gambar apa aja, klik "Cek Properti File".
- Lihat terminal tempat `bun dev` jalan — harus muncul `name`, `type`,
  `sizeInKB`, dan `Binary length`.
- Kalau submit tanpa pilih file, harus muncul log "Tidak ada file yang
  dikirim" (bukan error/crash).

---

## Slide 3 — Upload ke Local Storage (Dev Only!)

**Durasi:** 10 menit

**Script:**

"Sekarang kita upgrade Server Action tadi jadi beneran nyimpen file. Tapi ada
warning gede di judul slide ini: **Dev Only**. Kenapa? Karena kalau kalian
deploy ke Vercel, filesystem itu *ephemeral* — artinya setiap kali ada
deployment baru (atau bahkan instance serverless-nya di-recycle), semua file
yang kalian tulis ke disk bakal HILANG. Jadi `public/uploads/` ini cuma
oke buat development lokal aja, latihan mindset-nya, sebelum nanti kita
pindah ke cloud storage kayak Cloudinary di modul selanjutnya.

Sekarang, soal nama file. Tadi saya bilang jangan pakai `file.name` asli.
Kenapa? Tiga alasan:

1. **Path traversal** — user (atau attacker) bisa upload file dengan nama
   kayak `'../../../etc/passwd'` dan kalau kalian naif langsung `writeFile`
   pakai nama itu, bisa nulis ke luar folder yang kalian maksud.
2. **Collision** — dua orang upload `photo.jpg` di waktu berbeda, yang kedua
   bisa nimpa yang pertama kalau kalian gak generate nama unik.
3. **Special characters** — nama file yang ada spasi atau karakter unicode
   aneh bisa bikin masalah pas jadi bagian URL atau path.

Solusinya: generate ID unik sendiri pakai library `nanoid`. Ambil ekstensi
dari `file.name` (misal `.jpg`), tapi nama filenya kita yang generate."

### 🖥️ Live Coding

`nanoid` ada di `node_modules` sebagai dependency transitif, tapi belum jadi
dependency langsung di `package.json` — jadi kita install eksplisit dulu.

1. Install nanoid:

   ```bash
   bun add nanoid
   ```

2. Siapkan folder tujuan upload dan tandai supaya foldernya tetap ada di
   repo tapi isinya (file upload) tidak ikut ter-commit:

   ```bash
   mkdir -p public/uploads
   touch public/uploads/.gitkeep
   ```

   Tambahkan ke `.gitignore` (append di baris paling bawah):

   ```gitignore
   # uploads (dev only, tidak persistent di Vercel)
   /public/uploads/*
   !/public/uploads/.gitkeep
   ```

3. Buat Server Action `uploadLocal` di `app/uploads/actions.ts`. Kita ikutin
   pola `ActionResult<T>` yang udah dipakai di `app/posts/action.ts` biar
   konsisten sama codebase:

   ```ts
   // app/uploads/actions.ts
   "use server";

   import { writeFile } from "fs/promises";
   import path from "path";
   import { nanoid } from "nanoid";
   import { ActionResult } from "@/lib/validation/action-result";

   const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

   export async function uploadLocalAction(
     _prevState: ActionResult<{ url: string }> | null,
     formData: FormData,
   ): Promise<ActionResult<{ url: string }>> {
     const file = formData.get("file");

     if (!(file instanceof File) || file.size === 0) {
       return { success: false, message: "Pilih file terlebih dahulu" };
     }

     if (!file.type.startsWith("image/")) {
       return { success: false, message: "File harus berupa gambar" };
     }

     try {
       const buffer = Buffer.from(await file.arrayBuffer());
       const ext = path.extname(file.name); // ambil ekstensi asli, misal ".jpg"
       const filename = `${nanoid()}${ext}`;

       await writeFile(path.join(UPLOAD_DIR, filename), buffer);

       return { success: true, data: { url: `/uploads/${filename}` } };
     } catch (error) {
       return { success: false, message: "Gagal menyimpan file" };
     }
   }
   ```

   > Catatan: `nanoid()` default menghasilkan string 21 karakter random yang
   > URL-safe — cukup unik buat menghindari collision di kelas latihan ini.

4. Bikin form upload dengan preview, `app/uploads/UploadForm.tsx`. Pola
   `useActionState` + toast-nya sama persis kayak `CreatePostForm.tsx`:

   ```tsx
   // app/uploads/UploadForm.tsx
   "use client";

   import { useActionState, useEffect } from "react";
   import { toast } from "sonner";
   import { uploadLocalAction } from "./actions";

   export function UploadForm() {
     const [state, formAction, isPending] = useActionState(uploadLocalAction, null);

     useEffect(() => {
       if (state?.success) {
         toast.success("Upload berhasil");
       } else if (state && !state.success && state.message) {
         toast.error(state.message);
       }
     }, [state]);

     return (
       <form action={formAction} className="space-y-2 border rounded-lg p-4">
         <input type="file" name="file" accept="image/*" className="block" />

         <button
           type="submit"
           disabled={isPending}
           className="bg-slate-900 text-white px-4 py-2 rounded disabled:opacity-50"
         >
           {isPending ? "Mengupload..." : "Upload"}
         </button>

         {state?.success && (
           // eslint-disable-next-line @next/next/no-img-element
           <img
             src={state.data.url}
             alt="Preview hasil upload"
             className="mt-2 max-w-xs rounded border"
           />
         )}
       </form>
     );
   }
   ```

5. Tambahkan `UploadForm` ke `app/uploads/page.tsx` di bawah `InspectForm`
   yang udah ada.

**Test manual:**

- `bun dev`, buka `/uploads`, upload sebuah gambar lewat form kedua.
- Cek folder `public/uploads/` di file explorer — harus muncul file baru
  dengan nama acak (bukan nama asli file), misalnya `V1StGXR8_Z5jdHi6B.jpg`.
- Gambar preview harus langsung tampil di halaman setelah upload sukses.
- Coba submit tanpa pilih file — harus muncul toast error "Pilih file
  terlebih dahulu", bukan crash.
- Coba upload file non-gambar (misal `.pdf`) — harus ditolak dengan toast
  "File harus berupa gambar".

---

## Slide 4 — Upload via Route Handler: Untuk Public API

**Durasi:** 8 menit

**Script:**

"Server Action itu paling cocok kalau upload-nya dari form di aplikasi
Next.js kalian sendiri. Tapi gimana kalau yang upload itu aplikasi mobile,
atau client lain yang manggil pakai `fetch()` biasa, bukan lewat form React?
Nah di situ Route Handler lebih pas, soalnya dia itu endpoint HTTP biasa —
`POST /api/upload` — yang bisa dipanggil dari mana aja, gak terikat sama
mekanisme Server Action React.

Konsepnya mirip banget kayak Server Action: kita tetep `await req.formData()`
buat dapetin `FormData`, terus proses file-nya sama persis. Bedanya cuma di
lapisan luar — Route Handler pakai `NextRequest`/`NextResponse`, bukan
`'use server'`."

### 🖥️ Live Coding

1. Buat Route Handler di `app/api/upload/route.ts`. Kita reuse helper
   response yang udah ada di `lib/api-response.ts` (`ok`, `badRequest`,
   `serverError`) biar konsisten sama Route Handler lain di repo ini:

   ```ts
   // app/api/upload/route.ts
   import { writeFile } from "fs/promises";
   import path from "path";
   import { nanoid } from "nanoid";
   import { NextRequest } from "next/server";
   import { badRequest, created, serverError } from "@/lib/api-response";

   const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

   export async function POST(req: NextRequest) {
     let formData: FormData;

     try {
       formData = await req.formData();
     } catch (error) {
       return badRequest("Body harus berupa multipart/form-data");
     }

     const file = formData.get("file");

     if (!(file instanceof File) || file.size === 0) {
       return badRequest("Field 'file' wajib diisi");
     }

     if (!file.type.startsWith("image/")) {
       return badRequest("File harus berupa gambar");
     }

     try {
       const buffer = Buffer.from(await file.arrayBuffer());
       const ext = path.extname(file.name);
       const filename = `${nanoid()}${ext}`;

       await writeFile(path.join(UPLOAD_DIR, filename), buffer);

       return created({ url: `/uploads/${filename}` });
     } catch (error) {
       return serverError("Gagal menyimpan file");
     }
   }
   ```

   > Tetep pakai `writeFile` ke `public/uploads/` di sini — konsepnya sama
   > kayak Server Action tadi, cuma dibungkus sebagai HTTP endpoint publik.
   >
   > Kenapa `req.formData()` dibungkus try/catch? Karena Route Handler ini
   > endpoint publik — kalau ada client yang manggil tanpa
   > `Content-Type: multipart/form-data` sama sekali (bukan cuma lupa isi
   > field `file`), `req.formData()` bakal `throw`, bukan balikin FormData
   > kosong. Server Action gak butuh guard ini karena `<form action={...}>`
   > React selalu ngirim multipart yang valid.

2. Coba tes endpoint-nya pakai `curl` (simulasi "client lain" kayak mobile
   app yang manggil pakai `fetch()`):

   ```bash
   curl -X POST http://localhost:3000/api/upload \
     -F "file=@public/next.svg"
   ```

   Bisa juga pakai file dari luar folder proyek, misal gambar yang ada di
   Finder/Downloads — tinggal ganti path setelah `@` jadi path absolut ke
   file itu:

   ```bash
   curl -X POST http://localhost:3000/api/upload \
     -F "file=@/Users/namakalian/Downloads/nama-file.png"
   ```

   > Kalau nama file-nya ada spasi (misal `Untitled design-13.png`), gak
   > perlu tambahan tanda kutip lagi — semua yang setelah `@` sampai akhir
   > tanda kutip penutup `"..."` udah dianggap satu path utuh sama shell.
   > Field name-nya WAJIB `file` (bukan nama lain), karena itu yang dibaca
   > `formData.get("file")` di Route Handler.

**Test manual:**

- `bun dev` harus jalan.
- Jalankan perintah `curl` di atas dari terminal lain — responsnya harus
  JSON `{ "url": "/uploads/xxxxx.svg" }` dengan status 201.
- Cek `public/uploads/` — file baru harus muncul di sana juga.
- Coba `curl -X POST http://localhost:3000/api/upload` tanpa `-F` sama
  sekali (request tanpa multipart body) — harus balik status 400 dengan
  pesan "Body harus berupa multipart/form-data", BUKAN 500.
- Coba `curl -F "file=@some.txt"` (file bukan gambar) — harus balik 400
  dengan pesan "File harus berupa gambar".
- (Opsional) buka URL hasil upload di browser, misal
  `http://localhost:3000/uploads/xxxxx.svg`, untuk konfirmasi file
  benar-benar tersimpan dan bisa diakses sebagai static asset.

---

## Slide 5 — Kuis: Evaluasi Pemahaman

**Durasi:** 5 menit

**Script:**

"Oke sebelum lanjut ke tugas mandiri, kita cek dulu pemahaman kalian lewat 3
pertanyaan ini. Jawab dulu di kepala masing-masing sebelum saya bahas."

**Q1 — Bagaimana cara mendapatkan binary data dari File di Server Action?**

- A) `file.data`
- **B) `Buffer.from(await file.arrayBuffer())`** ✅
- C) `file.readAsBuffer()`

*Pembahasan buat disampaikan:* "Jawabannya B. `File` di server itu punya
method `arrayBuffer()` yang balikin `Promise<ArrayBuffer>` — itu format Web
API standar. Karena kita di Node.js, kita bungkus jadi `Buffer` pakai
`Buffer.from(...)` supaya bisa dipakai `writeFile` atau dikirim ke SDK cloud
storage. `file.data` dan `file.readAsBuffer()` itu bukan API yang beneran
ada di objek `File`."

**Q2 — Mengapa TIDAK boleh menggunakan file.name sebagai nama file di server?**

- A) Nama terlalu panjang
- **B) Security risk: path traversal, collision, special characters** ✅
- C) Server tidak bisa baca nama file

*Pembahasan buat disampaikan:* "Jawabannya B, dan ini yang paling penting
dari seluruh modul ini. `file.name` itu 100% dikontrol sama user yang
upload — jangan pernah percaya input dari client buat dijadiin path di
filesystem kalian. Itu sebabnya kita generate nama sendiri pakai `nanoid()`
tadi."

**Q3 — Mengapa local storage (public/uploads) TIDAK cocok untuk production Vercel?**

- A) Terlalu lambat
- **B) Filesystem Vercel ephemeral — file hilang setelah deployment baru** ✅
- C) Vercel tidak support fs module

*Pembahasan buat disampaikan:* "Jawabannya B. Vercel (dan platform serverless
lain) itu filesystem-nya sementara — bukan soal kecepatan atau `fs` module
gak didukung (`fs/promises` yang kita pakai tadi tetap jalan normal). Cuma,
begitu ada deployment baru atau instance-nya restart, semua yang kalian tulis
ke disk ilang. Makanya production wajib pakai cloud storage."

---

## Slide 6 — Tugas Mandiri (Homelab)

**Durasi:** 3 menit (pengantar; pengerjaan mandiri di luar sesi)

**Script:**

"Sekarang giliran kalian praktik sendiri. Kabar baiknya, semua yang saya
minta di tugas ini udah kita kerjain bareng-bareng barusan — jadi ini lebih
ke latihan ngulang dari nol biar beneran nempel, bukan hal baru."

- **01 — Upload Form**: Buat `UploadForm` dengan `<input type='file'
  accept='image/*'>`, pakai Server Action `uploadLocal`, tampilkan preview
  gambar setelah upload. → **Sudah kita bikin di [Slide 3 — Live
  Coding](#slide-3--upload-ke-local-storage-dev-only), langkah 4.** Kalau
  mau latihan ulang, coba tulis ulang `UploadForm.tsx` tanpa lihat contoh
  dulu, baru cocokin.

- **02 — Server Action**: Buat `uploadLocal` Server Action: terima file →
  nanoid filename → `writeFile` ke `public/uploads/` → return `{ url:
  '/uploads/...' }`. → **Sudah kita bikin di [Slide 3 — Live Coding](#slide-3--upload-ke-local-storage-dev-only),
  langkah 3** (`app/uploads/actions.ts`, fungsi `uploadLocalAction`).

- **03 — Test Upload**: Upload gambar → cek `public/uploads/` ada
  file-nya → render dengan `<img src={url}>` → verifikasi tampil di
  browser. → **Ini persis checklist "Test manual" di akhir [Slide 3](#slide-3--upload-ke-local-storage-dev-only)** —
  jalanin lagi mandiri sebagai latihan.

- **04 — .gitignore**: Tambahkan `/public/uploads/` ke `.gitignore`. Buat
  `/public/uploads/.gitkeep` supaya folder tetap ada di repo tapi isinya
  tidak di-commit. → **Sudah kita bikin di [Slide 3 — Live Coding](#slide-3--upload-ke-local-storage-dev-only),
  langkah 2.** Cek dengan `git status` — file-file di `public/uploads/`
  (selain `.gitkeep`) seharusnya tidak muncul sebagai "untracked".

"Reminder dari slide: `bun add nanoid` buat generate unique ID, dan
`nanoid()` itu hasilinnya string 21 karakter random yang URL-safe — aman
dipakai sebagai nama file maupun di URL."

---

## Slide 7 — Rangkuman

**Durasi:** 3 menit

**Script:**

"Oke, kita rekap yang udah kita pelajari hari ini:

- `formData.get('file') as File` — cara dapetin file dari Server Action
  atau Route Handler, dua-duanya pakai `FormData` yang sama.
- File punya 4 properti penting: `.name`, `.type`, `.size`, dan
  `.arrayBuffer()` — pakai `arrayBuffer()` kalau butuh data binary buat
  ditulis ke disk atau dikirim ke cloud.
- JANGAN PERNAH pakai `file.name` asli sebagai nama file di server —
  generate sendiri pakai `nanoid()` plus ekstensi asli. Ini soal keamanan,
  bukan gaya-gayaan.
- Local storage (`public/uploads`) HANYA buat development. Di production
  Vercel, filesystem-nya ephemeral, jadi file bakal hilang.
- Buat form upload dari app Next.js kalian sendiri, pakai **Server
  Action** (direkomendasikan). Buat endpoint publik yang dipanggil dari
  luar (mobile app, client lain), pakai **Route Handler**.

Selanjutnya, di Bab 2, kita bakal ganti local storage ini jadi Cloud
Storage — pakai Cloudinary — biar upload-nya beneran persistent di
production. Sampai ketemu di modul berikutnya, gaes!"

