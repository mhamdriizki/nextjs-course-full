# Script Ngajar — M7 Sub6: PageProps & searchParams

**Total durasi:** ± 17,5 menit penuh, ± 12 menit kalau live coding Slide 9, 11, dan 14 hanya ditunjukkan sekilas (15 slide)
**Sumber:** `script/M7_Sub6_PageProps_searchParams.pptx.pdf`

## Persiapan sebelum rekam

- **Demo di sub-bab ini harus berupa route sungguhan** (bukan file di `latihan/`), karena `params`/`searchParams` hanya ada di file `page.tsx` dan `PageProps<"/...">` dibuat Next.js dari struktur folder `app/`. Semua folder demo saya beri awalan `uji-` supaya gampang dihapus: `app/uji-blog/[slug]`, `app/uji-shop`, `app/uji-produk/[id]`, `app/uji-cari`.
- Folder `app/latihan/` milikmu sendiri (isi `halo.ts`) bukan bagian dari demo ini, jangan ikut terhapus.
- **Wajib generate tipe dulu** sebelum cek `PageProps` (Slide 12–14), sesuai dokumentasi Next.js yang ada di `node_modules/next/dist/docs`: tipe `PageProps` digenerate saat `next dev`, `next build`, atau `next typegen`.
  ```bash
  bunx next typegen
  bunx tsc --noEmit --incremental false
  ```
  Tanpa `typegen` (atau `next dev` yang sedang jalan), `PageProps` tidak dikenali oleh `tsc`.
- **Pembersihan, urutannya penting.** Setelah folder `uji-*` dihapus, `tsc` masih bisa error `Cannot find module '../../../app/uji-blog/[slug]/page.js'` dari `.next/dev/types/validator.ts`, karena sisa tipe yang digenerate. Sudah saya alami sendiri. Cara beresnya:
  ```bash
  rm -rf app/uji-blog app/uji-shop app/uji-produk app/uji-cari
  rm -rf .next
  bunx next typegen
  bunx tsc --noEmit --incremental false
  ```
- Pesan error di bawah saya ambil dari hasil `tsc` sungguhan. Nomor baris dan kolom bisa sedikit beda dari punyamu karena komentar di kode.
- Kondisi terakhir yang saya cek: `tsc` bersih (tanpa folder demo). `bun run build` **tidak** saya jalankan di sesi ini.

### Temuan di repo yang bisa dipakai sebagai bahan ngajar

Project ini sudah punya route dinamis sungguhan. Saya baca semuanya:

| File | Tipe `params` / `searchParams` | Catatan |
|---|---|---|
| `app/member/[id]/page.tsx` | `Promise<{ id: string }>` | benar |
| `app/foto/[id]/page.tsx` | `Promise<{ id: string }>` | benar |
| `app/docs/[...slug]/page.tsx` | `Promise<{ slug: string[] }>` | benar (catch-all → array) |
| `app/blog/[slug]/page.tsx` | `{ slug: string }` **tanpa `Promise`** | **salah menurut Next.js 16**, tapi `await params` tetap jalan dan `tsc` tidak protes |
| `app/katalog/page.tsx` | `Promise<{ query?: string, page?: string }>` | lebih sempit dari kenyataan (nilai asli bisa `string[]`); lalu `parseInt(page)` → `NaN` kalau `?page=abc` |

Saya **tidak mengubah** file-file itu. Pakai di Slide 5, 9, dan 15 sebagai contoh nyata.

---

## Slide 1 — PageProps & searchParams

**Durasi:** ± 20 detik

**Script:**
"Halo gaes, sub-bab keenam. Kita sudah bisa kasih tipe ke props komponen biasa. Sekarang kita kasih tipe ke props yang dikirim **Next.js** ke setiap halaman: `params` dan `searchParams`. Ini yang bikin banyak orang bingung di Next.js 16, jadi kita pelan-pelan."

### 🖥️ Live Coding — siapkan

```bash
bunx next typegen
```
Output: `Generating route types...` lalu `✓ Types generated successfully`.

---

## Slide 2 — Page Menerima Props dari Next.js

**Durasi:** ± 60 detik

**Script:**
"Bedanya sama komponen biasa di sub-bab empat: di sana **kita** yang memanggil komponennya, jadi kita sendiri yang nentuin props yang dikirim, misalnya `<Tombol judul="Simpan" />`. Kalau `page.tsx`, kita **nggak pernah** memanggilnya sebagai tag. **Next.js** yang memanggil, dan dia mengisi propsnya dari URL.

Ada dua props yang disediakan: `params` dan `searchParams`. Dan tulis hanya yang kamu butuhkan. Kalau halamannya nggak perlu `searchParams`, nggak usah ditulis."

---

## Slide 3 — Dari Mana Asalnya params dan searchParams?

**Durasi:** ± 70 detik

**Script:**
"`params` berasal dari bagian path yang dinamis, yaitu folder yang namanya pakai kurung siku. `searchParams` berasal dari query string, bagian setelah tanda tanya.

Tiga contoh di tabel. `/blog/belajar-ts` masuk ke `app/blog/[slug]/page.tsx`: `params`-nya `{ slug: "belajar-ts" }`, `searchParams`-nya kosong. `/shop?page=2&sort=asc` masuk ke `app/shop/page.tsx`: `params` kosong, `searchParams`-nya `{ page: "2", sort: "asc" }`. Dan yang menarik, `/shop?tag=a&tag=b`: kunci `tag` muncul dua kali, jadi nilainya **array** `["a", "b"]`."

### 🖥️ Live Coding — buktikan array di URL

Kita buktikan setelah Slide 8 saat sudah ada halaman `uji-shop`. Tahan dulu.

---

## Slide 4 — params dan searchParams adalah Promise

**Durasi:** ± 60 detik

**Script:**
"Ini perubahan penting di Next.js 16: `params` dan `searchParams` **adalah Promise**. Nggak bisa dibaca langsung, harus ditunggu dulu.

Di **Server Component**, pakai `await`: fungsi page ditulis `async`, lalu `const { slug } = await params`. Di **Client Component**, nggak bisa `async`, jadi pakai fungsi `use` dari React. Dan kalau lupa menunggu, TypeScript langsung menandai. Kita lihat di kode berikutnya."

---

## Slide 5 — Membaca Tipe params

**Durasi:** ± 60 detik

**Script:**
"`params: Promise<{ slug: string }>` dibaca dari luar ke dalam. `Promise<...>` artinya dibungkus Promise, nilainya belum langsung ada, harus ditunggu pakai `await`. `{ slug: string }` adalah bentuk isinya: objek dengan satu properti `slug` bertipe `string`.

Dan satu peringatan: `slug` harus sama dengan nama folder `[slug]`. Tipe manual ini **nggak dicek** terhadap nama folder."

### 🖥️ Live Coding — tunjukkan di repo (tanpa mengubah)

1. Buka `app/member/[id]/page.tsx`: `params: Promise<{ id: string }>` lalu `const { id } = await params;`. "Ini persis polanya."
2. Buka `app/docs/[...slug]/page.tsx`: `params: Promise<{ slug: string[] }>`. "Folder `[...slug]` menangkap banyak segmen, jadi `slug`-nya array `string[]`."
3. Buka `app/blog/[slug]/page.tsx` dan tunjuk: `params: { slug: string }`. "Perhatikan, di sini **nggak ada `Promise`**. Padahal di baris bawahnya ditulis `await params`. Aplikasinya tetap jalan karena `await` pada nilai biasa nggak masalah, dan `tsc` pun nggak protes. Tapi tipenya bohong: sebenarnya `params` itu Promise. Yang benar: `params: Promise<{ slug: string }>`."

**Cek manual:** tiga file terbuka; hanya `blog/[slug]` yang tipenya tanpa `Promise`.

---

## Slide 6 — Contoh Tipe params Manual

**Durasi:** ± 70 detik

**Script:**
"Memakai pola dari sub-bab empat: destructuring di kiri, tipe inline di kanan. `await params` itu benar. `params.slug` langsung itu salah, karena `params` masih Promise."

### 🖥️ Live Coding — lupa `await`

1. Buat `app/uji-blog/[slug]/page.tsx`:
   ```tsx
   export default async function Page({
     params,
   }: {
     params: Promise<{ slug: string }>
   }) {
     const { slug } = await params // benar: ditunggu dulu
     const x = params.slug         // salah: params masih Promise
     // Error: Property 'slug' does not exist on type
     // 'Promise<{ slug: string; }>'.

     return <h1>Blog Post: {slug} {x}</h1>
   }
   ```
   (`{x}` ditambahkan supaya variabelnya terpakai.)
2. Tunjukkan garis merah di `params.slug`.
3. Cek:
   ```bash
   bunx tsc --noEmit --incremental false
   ```
   Output:
   ```
   app/uji-blog/[slug]/page.tsx(7,20): error TS2339: Property 'slug' does not exist on type 'Promise<{ slug: string; }>'.
   ```
4. Buktikan di runtime juga (opsional): jalankan `bun dev`, buka `/uji-blog/belajar-ts`. Tampilannya `Blog Post: belajar-ts` dan nilai `x` **kosong** (`undefined`), karena `params.slug` pada Promise memang `undefined`.

**Cek manual:** satu error `TS2339`; di browser `slug` terisi tapi `x` kosong.

---

## Slide 7 — searchParams: Kenapa string | string[] | undefined?

**Durasi:** ± 80 detik

**Script:**
"Tipenya kelihatan panjang: `Promise<{ [key: string]: string | string[] | undefined }>`. Tapi tiap bagiannya punya alasan.

**`string`**: nilai dari URL selalu teks. `?page=2` menghasilkan `"2"`, bukan angka 2. **`string[]`**: kunci yang muncul berulang, `?tag=a&tag=b` jadi `["a", "b"]`. **`undefined`**: kunci yang nggak ada di URL. Dan **`{ [key: string]: ... }`**: objek dengan kunci apa saja bertipe string, karena kita nggak tahu query apa yang dikirim pengguna."

---

## Slide 8 — Contoh Tipe searchParams Manual

**Durasi:** ± 70 detik

**Script:**
"Nilai bawaan di destructuring, seperti `page = "1"`, menghilangkan `undefined`. Tapi **bukan** `string[]`. Jadi `page` tetap bertipe `string | string[]`."

### 🖥️ Live Coding — nilai bawaan dan array di URL

1. Buat `app/uji-shop/page.tsx`:
   ```tsx
   export default async function Page({
     searchParams,
   }: {
     searchParams: Promise<{ [key: string]: string | string[] | undefined }>
   }) {
     const { page = "1", sort = "asc" } = await searchParams
     // page dan sort bertipe string | string[]
     // (nilai bawaan "1" dan "asc" menghilangkan undefined)

     return <p>Halaman {page}, urutan {sort}</p>
   }
   ```
2. Hover `page` untuk menampilkan tipenya: `string | string[]`.
3. Jalankan `bun dev`, lalu buka tiga URL ini dan bandingkan hasilnya:
   - `/uji-shop` → `Halaman 1, urutan asc`
   - `/uji-shop?page=2&sort=desc` → `Halaman 2, urutan desc`
   - `/uji-shop?page=2&page=3` → `Halaman 23, urutan asc`
4. Narasi untuk URL ketiga: "Kenapa `23`? Karena `page` di sini sebenarnya **array** `["2", "3"]`, dan React menampilkannya tersambung. Ini bukti `string[]` itu nyata. (Inilah jawaban untuk poin Slide 3: `/shop?tag=a&tag=b`.)"

**Cek manual:** tiga URL menampilkan teks persis seperti di atas.

---

## Slide 9 — Contoh Menangani string | string[]

**Durasi:** ± 80 detik

**Script:**
"TypeScript memaksa kita memastikan hanya ada satu nilai sebelum memakainya sebagai `string`. Kalau kita tulis `const p: string = page`, ditolak, karena `page` bisa jadi `string[]`. Perbaikannya: cek dulu dengan `Array.isArray`."

### 🖥️ Live Coding — menyempitkan `string | string[]`

1. Di `app/uji-shop/page.tsx`, ubah isi fungsi jadi:
   ```tsx
   const { page = "1" } = await searchParams

   const p: string = page
   // Error: Type 'string | string[]' is not assignable to type 'string'.
   // Type 'string[]' is not assignable to type 'string'.

   // Perbaikan: pastikan hanya satu nilai
   const halaman = Array.isArray(page) ? page[0] : page
   // halaman bertipe string, aman dipakai

   return <p>Halaman {halaman} {p}</p>
   ```
2. Cek:
   ```bash
   bunx tsc --noEmit --incremental false
   ```
   Output:
   ```
   app/uji-shop/page.tsx(...): error TS2322: Type 'string | string[]' is not assignable to type 'string'.
     Type 'string[]' is not assignable to type 'string'.
   ```
   Hanya baris `const p` yang error; `halaman` bersih.
3. Tunjuk contoh nyata yang **melewatkan** masalah ini: `app/katalog/page.tsx` menulis tipe `searchParams` sebagai `Promise<{ query?: string, page?: string }>`. "Tipe ini lebih sempit dari kenyataan. Kalau ada yang buka `/katalog?page=1&page=2`, nilai aslinya array, padahal tipenya bilang `string`. TypeScript percaya sama tipe yang kita tulis, makanya aman di editor tapi bisa meleset di runtime."

**Cek manual:** satu error `TS2322` di `const p`; `halaman` tidak error.

---

## Slide 10 — PageProps: Tipe yang Digenerate Next.js

**Durasi:** ± 60 detik

**Script:**
"Capek nulis tipe `params` dan `searchParams` sendiri? Next.js punya jawabannya: **`PageProps`**. Tiga hal.

Satu, ini **helper global**, tanpa `import`. Digenerate Next.js saat `next dev`, `next build`, atau `next typegen`. Dua, ditulis `PageProps<"/blog/[slug]">`, isi di dalam `<>` adalah path route, sama dengan struktur foldernya. Tiga, `params` dan `searchParams` langsung bertipe. `params` mengikuti nama folder dinamis, dan `searchParams` sudah bertipe Promise berisi `string | string[] | undefined`."

### 🖥️ Live Coding — lihat tipe yang digenerate

1. Jalankan:
   ```bash
   bunx next typegen
   ```
2. Buka `.next/types/routes.d.ts`. Tunjuk daftar `AppRoutes` dan `ParamMap`, misalnya:
   ```ts
   "/blog/[slug]": { "slug": string; }
   "/docs/[...slug]": { "slug": string[]; }
   "/foto/[id]": { "id": string; }
   ```
   "Ini hasil bacaan Next.js atas folder `app/`. Dari sinilah `PageProps` tahu bentuk `params`."
3. Catatan buat siswa: file di `.next/` dan `next-env.d.ts` digenerate otomatis, jangan diedit dan tidak di-commit.

**Cek manual:** `ParamMap` memuat route project, dan catch-all `[...slug]` bertipe `string[]`.

---

## Slide 11 — Contoh Memakai PageProps

**Durasi:** ± 70 detik

**Script:**
"Satu parameter `props`, tanpa menulis tipe `params` dan `searchParams` sama sekali. Dan kalau kita minta properti yang nggak ada di folder, misalnya `id` padahal foldernya `[slug]`, langsung error."

### 🖥️ Live Coding — ganti tipe manual dengan `PageProps`

1. Ubah `app/uji-blog/[slug]/page.tsx` menjadi:
   ```tsx
   export default async function Page(props: PageProps<"/uji-blog/[slug]">) {
     const { slug } = await props.params
     const query = await props.searchParams

     const { id } = await props.params
     // Error: Property 'id' does not exist on type '{ slug: string; }'.

     return <h1>Blog Post: {slug} {id} {String(query)}</h1>
   }
   ```
2. Hover `query`: tipenya `{ [x: string]: string | string[] | undefined }`.
3. Cek:
   ```bash
   bunx next typegen
   bunx tsc --noEmit --incremental false
   ```
   Output:
   ```
   app/uji-blog/[slug]/page.tsx(5,11): error TS2339: Property 'id' does not exist on type '{ slug: string; }'.
   ```
   (Nomor baris di punyamu mungkin beda.)

**Cek manual:** error hanya pada `id`; `slug` dan `query` bersih tanpa tipe yang kita tulis sendiri.

---

## Slide 12 — Tipe Manual vs PageProps

**Durasi:** ± 60 detik

**Script:**
"Perbedaan yang paling penting: **siapa yang memastikan nama `params` benar**. Di tipe manual, kita sendiri yang nulis, dan nama `params` **nggak dicek** terhadap folder. Salah nama bisa lolos tanpa error. Di `PageProps`, tipenya digenerate dari struktur folder, jadi salah nama langsung error.

Setup-nya: tipe manual nggak perlu setup, `PageProps` otomatis lewat `next dev`, `next build`, atau `next typegen`. Di course ini, tipe manual tetap kita pahami karena banyak dokumentasi dan tutorial masih memakainya, tapi **`PageProps` yang kita pakai sebagai standar**."

---

## Slide 13 — Contoh Tipe Manual yang Salah Nama

**Durasi:** ± 90 detik

**Script:**
"Buktinya di sini. Foldernya `[id]`, tapi tipe manual menyebut `slug`. Tidak ada peringatan sama sekali, bahkan saat build. Dan saat dijalankan, nilai `slug` nggak akan terisi. Hanya `PageProps` yang menangkapnya."

### 🖥️ Live Coding — salah nama folder

1. Buat `app/uji-produk/[id]/page.tsx` (tipe manual, salah nama):
   ```tsx
   // Manual: nama tidak cocok dengan folder [id]
   export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
     const { slug } = await params
     // tidak ada peringatan, bahkan saat next build
     // nilai slug tidak akan terisi saat dijalankan
     return <p>{slug}</p>
   }
   ```
2. Buat `app/uji-produk2/[id]/page.tsx` (`PageProps`):
   ```tsx
   export default async function Page(props: PageProps<"/uji-produk2/[id]">) {
     const { slug } = await props.params
     // Error: Property 'slug' does not exist on type '{ id: string; }'.
     return <p>{slug}</p>
   }
   ```
3. Cek:
   ```bash
   bunx next typegen
   bunx tsc --noEmit --incremental false
   ```
   Output: **hanya satu error**, dari versi `PageProps`:
   ```
   app/uji-produk2/[id]/page.tsx(2,11): error TS2339: Property 'slug' does not exist on type '{ id: string; }'.
   ```
   Versi manual (`uji-produk`) **tidak muncul** sama sekali.
4. Buktikan di runtime: `bun dev`, buka `/uji-produk/5`. Halaman tampil dengan `<p></p>` **kosong**, tanpa error. `slug` `undefined` karena key yang sebenarnya `id`.
5. Narasi: "TypeScript lolos, aplikasi jalan, tapi datanya hilang diam-diam. Itu bug yang paling susah dicari."

**Cek manual:** `tsc` hanya menandai `uji-produk2`; `/uji-produk/5` menampilkan paragraf kosong dengan status 200.

---

## Slide 14 — Contoh Client Component dengan use()

**Durasi:** ± 70 detik

**Script:**
"Client Component nggak bisa `async`, jadi Promise dibaca dengan `use` dari React. Perhatikan: `'use client'` di baris pertama, `import { use } from 'react'`, dan `const { query } = use(searchParams)`, **bukan** `await`."

### 🖥️ Live Coding — `use()` di Client Component

1. Buat `app/uji-cari/page.tsx`:
   ```tsx
   'use client'

   import { use } from 'react'

   export default function Page({
     searchParams,
   }: {
     searchParams: Promise<{ [key: string]: string | string[] | undefined }>
   }) {
     const { query } = use(searchParams) // bukan await
     return <p>Pencarian: {query}</p>
   }
   ```
2. Cek tipe: `bunx tsc --noEmit --incremental false` → tidak ada error.
3. Jalankan `bun dev`, buka `/uji-cari?query=ts` → `Pencarian: ts`.
4. Eksperimen cepat (opsional): ganti `use(searchParams)` jadi `await searchParams` tanpa `async`. Editor langsung protes, karena `await` hanya boleh di fungsi `async`, dan Client Component tidak boleh `async`.

**Cek manual:** halaman menampilkan `Pencarian: ts`.

---

## Slide 15 — Batasan yang Perlu Diingat

**Durasi:** ± 80 detik

**Script:**
"Dua batasan penting.

**Pertama, tipe bukan validasi.** `?page=abc` tetap bertipe `string`, jadi TypeScript nggak protes. Tapi `Number("abc")` hasilnya `NaN`. Nilai dari URL bisa diisi siapa saja, jadi tetap perlu divalidasi saat aplikasi berjalan. Itu yang nanti kita bahas dengan Zod.

**Kedua, `searchParams` membuat halaman dinamis.** Menurut dokumentasi Next.js, `searchParams` hanya diketahui saat ada request, jadi halaman yang memakainya dirender saat request, bukan di awal saat build.

Itu dia PageProps dan searchParams. Sampai jumpa di sub-bab berikutnya!"

### 🖥️ Live Coding — `NaN` di project dan pembersihan

1. Buka `app/katalog/page.tsx`: `const currentPage = parseInt(page);`. "Kalau pengguna membuka `/katalog?page=abc`, `currentPage` jadi `NaN`, dan link 'Sebelumnya'/'Selanjutnya' berisi `page=NaN`. TypeScript nggak tahu, karena `page` memang `string`."
2. Cek cepat di terminal:
   ```bash
   bun -e 'console.log(parseInt("abc"), Number("abc"))'
   ```
   Output: `NaN NaN`.
3. (Opsional) Untuk melihat halaman dinamis: jalankan `bun run build` dan lihat tabel route. Tanda `ƒ` berarti dirender saat request. **Catatan jujur:** `/katalog` juga memakai `cookies()`, yang juga membuat halaman dinamis, jadi bukan bukti murni untuk `searchParams`. Dan saat saya periksa terakhir, `bun run build` di project ini sempat gagal di prerender `/dashboard/settings` karena masalah lain yang tidak terkait (dua file `default.tsx` di `app/dashboard/@recent` dan `@stats` kosong), jadi bagian ini bisa dilewati kalau build belum beres.
4. **Hapus semua file demo dan bersihkan tipe generate:**
   ```bash
   rm -rf app/uji-blog app/uji-shop app/uji-produk app/uji-produk2 app/uji-cari
   rm -rf .next
   bunx next typegen
   bunx tsc --noEmit --incremental false
   ```

**Cek manual:** langkah 2 mencetak `NaN NaN`; setelah pembersihan `tsc` bersih (tanpa output).

---

## Rekap Durasi

| Slide | Durasi |
|---|---|
| 1 | 0:20 |
| 2 | 1:00 |
| 3 | 1:10 |
| 4 | 1:00 |
| 5 | 1:00 |
| 6 | 1:10 |
| 7 | 1:20 |
| 8 | 1:10 |
| 9 | 1:20 |
| 10 | 1:00 |
| 11 | 1:10 |
| 12 | 1:00 |
| 13 | 1:30 |
| 14 | 1:10 |
| 15 | 1:20 |
| **Total** | **± 17:40** (potong live coding Slide 9, 11, dan 14 jadi sekilas, dan lewati opsi `bun run build` di Slide 15, untuk mendekati 11 menit) |
