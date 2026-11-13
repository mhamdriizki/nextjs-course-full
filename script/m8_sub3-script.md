# Script Ngajar — M8 Sub3: Fetch Data di Server Components

**Total durasi:** ± 20 menit penuh, ± 13 menit kalau live coding Slide 5 (bagian build), 11, 12, dan 14 dilewati atau hanya ditunjukkan sekilas (15 slide)
**Sumber:** `script/M8_Sub3_Fetch_Server_Components.pptx.pdf`

## Persiapan sebelum rekam

### Penting: `bun run build` di project ini belum bisa jalan

Beberapa slide membutuhkan **`next build`** (error URL di Slide 3, ○/ƒ di Slide 12–13, hasil bundle di Slide 11). Saat ini `bun run build` di project kamu **gagal** karena masalah lain yang tidak berhubungan dengan materi ini:
1. `app/dashboard/@recent/default.tsx` dan `app/dashboard/@stats/default.tsx` **kosong** → `/dashboard/settings` gagal prerender (`The default export is not a React Component`).
2. `app/vip/page.tsx` membaca `localStorage` di badan komponen → `/vip` gagal prerender (`Cannot read properties of undefined (reading 'getItem')`).

Perbaikan keduanya sudah pernah saya uji (isi `default.tsx` dengan `export default function Default() { return null }`, dan pindahkan `localStorage` ke `useEffect`), tapi **saya tidak menerapkannya** karena kamu sempat mengembalikannya. **Perbaiki dulu sebelum rekam Slide 3, 11, 12, 13, dan 14**, atau minta saya yang menerapkannya.

**Cara saya menguji tanpa menyentuh project-mu:** saya membuat salinan sementara project di luar folder ini, membuang `app/dashboard` dan `app/vip` di salinan itu, lalu menjalankan `next build` dan `next start` di sana. Semua hasil "build" dan "production" di naskah ini berasal dari salinan itu. Salinannya sudah saya hapus.

### Hal lain

- Endpoint **`/api/produk` sudah ada** di project-mu (`app/api/produk/route.ts`, ikut ter-commit di `a125f4e`). Isinya versi alat peraga dari Sub2: ada penghitung `?hitung`/`?reset` dan jeda 600 ms. Untuk Sub3 cukup dipakai apa adanya. Kalau tidak ada, buat versi sederhana ini:
  ```ts
  export async function GET() {
    return Response.json([
      { id: 1, title: 'Kopi' },
      { id: 2, title: 'Teh' },
      { id: 3, title: 'Roti' },
    ])
  }
  ```
- Dev server memakai port **3000** (sesuai URL di slide). Pastikan tidak ada proses lain di port itu.
- Demo memakai folder berawalan `uji-`: `app/uji-server`, `app/uji-secret`, `app/uji-error`, plus file `lib/produk.ts`. Ada juga route yang sudah ada di project-mu dan bisa dipakai: `app/uji-produk` (versi client dari Sub2).
- Untuk membandingkan static vs dynamic secara terasa, `getProduk()` di naskah diberi **jeda 800 ms** (alat peraga, satu baris).
- **Jangan buka `.env` di layar.** Isinya kredensial sungguhan. Demo secret di Slide 10 memakai variabel buatan `API_KEY=rahasia123` lewat terminal.
- Pembersihan di akhir:
  ```bash
  rm -rf app/uji-server app/uji-secret app/uji-error app/api/rahasia lib/produk.ts
  rm -rf .next
  bunx next typegen
  bunx tsc --noEmit --incremental false
  ```
  (Jangan hapus `app/api/produk`, itu bagian dari commit-mu.)
- Kode di slide (tanpa API eksternal), dikompilasi dan dicek tipenya lewat `next build` di salinan: **lolos**.

### Temuan di repo yang bisa dipakai sebagai bahan ngajar

| Lokasi | Relevan untuk | Catatan |
|---|---|---|
| `app/blog/page.tsx` | Slide 2, 6 | Server Component `async`, datanya masih ditulis langsung (`dataPostDariDb`, komentar "dari DB"). Persis bentuk "function pengambil data" di Slide 6 kalau nanti diganti query |
| `app/member/loading.tsx` dan `error.tsx` | Slide 9 | Contoh nyata `loading.tsx` (skeleton) dan `error.tsx` (client, menampilkan `error.message`) |
| `app/member/page.tsx` | Slide 9 | Jeda 2 detik dan `?crash=true` melempar error. **Tidak saya jalankan** sebagai bagian dari uji ini |
| `app/katalog/page.tsx` | Slide 12–13 | Memanggil `cookies()` → halaman **dynamic** (tanda `ƒ`) |

---

## Slide 1 — Fetch Data di Server Components

**Durasi:** ± 20 detik

**Script:**
"Halo gaes, lanjut ke sub-bab ketiga Bab 8. Di video sebelumnya kita ambil daftar produk di Client Component. Sekarang kita ambil **contoh yang sama**, tapi di sisi **Server**. Kita lihat apa yang berubah, dan satu jebakan yang bikin banyak orang kaget di awal."

---

## Slide 2 — Server Component Boleh async

**Durasi:** ± 60 detik

**Script:**
"Server Component itu boleh `async`. Komponennya langsung menunggu datanya, dan **nggak ada hook sama sekali**.

Bandingkan sama versi client. Yang **nggak dipakai lagi**: `useEffect`, `useState` untuk data, loading, dan error, serta `AbortController` untuk membatalkan request. Yang dipakai: cukup JavaScript biasa. `async function` sebagai komponen, `await` langsung di dalamnya, dan tanpa `'use client'`."

### 🖥️ Live Coding — contoh yang sudah ada di repo

1. Buka `app/blog/page.tsx`. "Perhatikan `export default async function BlogPage()`. Nggak ada `'use client'`, nggak ada `useState`. Datanya (`dataPostDariDb`) langsung dipakai. Ini Server Component biasa."
2. Buka `app/blog/components/PostList.tsx`. "Bagian yang butuh `useState` untuk filter dipisah ke Client Component kecil, dan datanya dilempar lewat props."

**Cek manual:** `blog/page.tsx` tanpa `'use client'`; `PostList.tsx` dengan `"use client"` di baris 1.

---

## Slide 3 — Menyalin dari Versi Client

**Durasi:** ± 60 detik

**Script:**
"Kita coba salin dari versi client. Endpoint yang sama, `/api/produk`. Nggak ada `'use client'`, komponennya `async`, `fetch` lalu `res.json()`. Kelihatannya aman, kan? Kita lihat hasilnya di slide berikutnya."

### 🖥️ Live Coding — buat halaman dengan URL relatif

`app/uji-server/page.tsx`:
```tsx
type Produk = { id: number; title: string }

export default async function Page() {
  const res = await fetch('/api/produk')
  const produk: Produk[] = await res.json()

  return (
    <ul>
      {produk.map((p) => (
        <li key={p.id}>{p.title}</li>
      ))}
    </ul>
  )
}
```
(Jangan dijalankan dulu. Lanjut ke Slide 4.)

---

## Slide 4 — Hasilnya: Langsung Gagal

**Durasi:** ± 90 detik

**Script:**
"Hasilnya: gagal. Pesan ini muncul saat `next build`: `Failed to parse URL from /api/produk`, dan di dalamnya `Invalid URL`, `ERR_INVALID_URL`, dengan `input: '/api/produk'`.

Kenapa? Di **browser**, `/api/produk` otomatis dilengkapi dengan domain halaman. Di **server** nggak ada halaman sebagai acuan, jadi alamat harus **lengkap**, misalnya `http://localhost:3000/api/produk`."

### 🖥️ Live Coding — lihat error-nya

1. Jalankan:
   ```bash
   bun run build
   ```
2. Hasil yang saya amati (di salinan project, Next.js 16.2.10), sama persis dengan slide:
   ```
   Error occurred prerendering page "/uji-server".
   TypeError: Failed to parse URL from /api/produk
     [cause]: TypeError: Invalid URL
       code: 'ERR_INVALID_URL'
       input: '/api/produk'
   Export encountered an error on /uji-server/page: /uji-server, exiting the build.
   ```
3. Narasi: "Perhatikan: build **berhenti total**. Satu halaman salah, seluruh build gagal. Ini kelebihan: bug ketahuan sebelum production."

**Cek manual:** pesan `Failed to parse URL from /api/produk` muncul. (Syarat: `bun run build` di project-mu sudah bebas dari dua masalah di bagian Persiapan.)

---

## Slide 5 — Pakai URL Lengkap

**Durasi:** ± 90 detik

**Script:**
"Satu baris yang berubah: pakai URL lengkap, `http://localhost:3000/api/produk`. Ini jalan **selama API-nya hidup**. Perhatikan kalimat itu, karena itu juga kelemahannya."

### 🖥️ Live Coding — URL lengkap, dan kapan ia gagal

1. Ubah baris `fetch` di `app/uji-server/page.tsx`:
   ```tsx
   const res = await fetch('http://localhost:3000/api/produk')
   ```
2. Jalankan `bun dev` (port 3000), buka `/uji-server`: tampil `Kopi`, `Teh`, `Roti`. (Slide ini bekerja karena `/api/produk` hidup di server dev yang sama.)
3. Sekarang jalankan `bun run build` **tanpa** server dev menyala. Hasil yang saya amati:
   ```
   Error occurred prerendering page "/uji-server".
   [TypeError: fetch failed] {
     [cause]: AggregateError: { code: 'ECONNREFUSED', ... }
   }
   ```
4. Narasi: "Waktu build, server kita **belum hidup**, jadi `fetch` ke `localhost:3000` ditolak. Dan di production, `localhost:3000` itu alamat siapa? Makanya cara ini rapuh. Di slide berikutnya ada jalan yang lebih baik."

**Cek manual:** dev: halaman tampil; build tanpa server: `ECONNREFUSED`.

---

## Slide 6 — Contoh Function Pengambil Data

**Durasi:** ± 70 detik

**Script:**
"Di Client Component, API route itu **wajib ada**, karena browser nggak boleh menyentuh database. Di server, **nggak perlu**. Kita bisa taruh logika pengambilan data di sebuah function biasa. Di proyek nyata, isinya query Prisma ke database. Di sini kita pakai data tiruan."

### 🖥️ Live Coding — `lib/produk.ts`

1. Buat `lib/produk.ts`:
   ```ts
   export type Produk = { id: number; title: string }

   export async function getProduk(): Promise<Produk[]> {
     // di proyek nyata: query Prisma ke database
     // alat peraga: jeda 800 ms supaya beda static vs dynamic terasa
     await new Promise((r) => setTimeout(r, 800))
     return [
       { id: 1, title: 'Kopi' },
       { id: 2, title: 'Teh' },
       { id: 3, title: 'Roti' },
     ]
   }
   ```
2. Tunjuk bahwa folder `lib/` sudah ada di project (`lib/utils.ts`), jadi `@/lib/produk` otomatis terbaca lewat alias dari Bab 7.

---

## Slide 7 — Page Memanggil Function Langsung

**Durasi:** ± 60 detik

**Script:**
"Sekarang page memanggil function itu langsung. **Tanpa `fetch`, tanpa URL, tanpa API route.** Masalah URL tadi hilang dengan sendirinya."

### 🖥️ Live Coding — ganti `fetch` dengan function

1. Ganti isi `app/uji-server/page.tsx`:
   ```tsx
   import { getProduk } from '@/lib/produk'

   export default async function Page() {
     const produk = await getProduk()

     return (
       <ul>
         {produk.map((p) => (
           <li key={p.id}>{p.title}</li>
         ))}
       </ul>
     )
   }
   ```
2. Cek tipe: `bunx tsc --noEmit --incremental false` → bersih. (`produk` otomatis bertipe `Produk[]` karena inference.)
3. Jalankan `bun run build` → **lolos**, dan di tabel route `/uji-server` bertanda `○`.

**Cek manual:** build lolos tanpa server API menyala.

---

## Slide 8 — Beda 1: HTML Awal Sudah Berisi Data

**Durasi:** ± 80 detik

**Script:**
"Beda pertama: HTML awal **sudah berisi data**. Kiri, versi Client Component dari video sebelumnya: HTML-nya cuma `<p>Memuat...</p>`. Kanan, Server Component: daftar `Kopi`, `Teh`, `Roti` sudah ada di HTML pertama yang diterima. Ini jawaban untuk SEO, tanpa menunggu JavaScript jalan."

### 🖥️ Live Coding — View Source, dua versi

1. Buka `/uji-produk` (versi client yang sudah ada di project), lalu View Source (`Cmd+Option+U`). Hasil: `Memuat...` ada, `Kopi` **tidak ada**.
2. Buka `/uji-server` (versi server), View Source. Hasil yang saya amati di build production: `<ul>` berisi `Kopi`, `Teh`, `Roti` ada langsung di HTML.
3. Narasi: "Dua halaman, data yang sama, tapi yang dilihat crawler beda jauh."

**Cek manual:** `Kopi` ada di View Source `/uji-server`, tidak ada di `/uji-produk`.

---

## Slide 9 — Beda 2: Mana State Loading dan Error?

**Durasi:** ± 100 detik

**Script:**
"Beda kedua: di komponen server **nggak ada state loading dan error**. Dua-duanya ditangani **di luar komponen**.

Komponen **menunggu dulu**, baru HTML dikirim. Dengan API yang sengaja lambat 0,8 detik, halaman baru tiba sekitar 0,8 detik kemudian, **langsung lengkap**. Untuk loading, kita pakai `loading.tsx` atau `Suspense`, dibahas di sub-bab berikutnya. Untuk error, kita pakai `error.tsx`: kalau `fetch` melempar error, ditangani oleh *error boundary*, bukan state di komponen."

### 🖥️ Live Coding — halaman lambat dan `error.tsx`

1. Buat `app/uji-error/page.tsx` (selalu melempar error):
   ```tsx
   import { connection } from 'next/server'

   export default async function Page() {
     await connection()
     throw new Error('Gagal mengambil data')
   }
   ```
2. Buat `app/uji-error/error.tsx` (wajib Client Component):
   ```tsx
   'use client'

   export default function Error({ reset }: { error: Error; reset: () => void }) {
     return (
       <div>
         <p>Terjadi kesalahan saat memuat produk</p>
         <button onClick={reset}>Coba lagi</button>
       </div>
     )
   }
   ```
   (`connection()` dibahas di Slide 13; di sini dipakai supaya error terjadi saat request, bukan saat build.)
3. Jalankan versi production (`bun run build`, lalu `bun start`), buka `/uji-error`. Hasil yang saya amati di browser: tampil Navbar dan teks `Terjadi kesalahan saat memuat produk` dengan tombol `Coba lagi`; status HTTP halamannya `500`. Pesan asli `Gagal mengambil data` **tidak** bocor ke HTML.
4. Tunjukkan contoh nyata yang sudah ada di repo: `app/member/error.tsx` dan `app/member/loading.tsx`.
   > Catatan jujur: halaman `/member` (jeda 2 detik, `?crash=true`) tidak saya jalankan dalam uji ini.

**Cek manual:** `/uji-error` menampilkan UI dari `error.tsx` tanpa pesan error asli.

---

## Slide 10 — Memakai Secret di Server

**Durasi:** ± 80 detik

**Script:**
"Salah satu alasan utama pakai Server Component: **secret**. API key dibaca dari environment variable, langsung di komponen. Perhatikan nama variabelnya: `API_KEY`, **tanpa** `NEXT_PUBLIC_`. Artinya hanya ada di server."

### 🖥️ Live Coding — secret dari environment variable

1. Buat `app/api/rahasia/route.ts` (API tiruan yang hanya menerima key yang benar):
   ```ts
   export function GET(req: Request) {
     const ok = req.headers.get('authorization') === 'Bearer rahasia123'
     return Response.json({ ok, jumlah: 3 })
   }
   ```
2. Buat `app/uji-secret/page.tsx`:
   ```tsx
   import { connection } from 'next/server'

   type Hasil = { ok: boolean; jumlah: number }

   export default async function Page() {
     await connection()
     // API_KEY hanya ada di server, tanpa NEXT_PUBLIC_
     const res = await fetch('http://localhost:3000/api/rahasia', {
       headers: { Authorization: `Bearer ${process.env.API_KEY}` },
     })
     const hasil: Hasil = await res.json()

     return <p>{hasil.ok ? `${hasil.jumlah} produk` : 'ditolak'}</p>
   }
   ```
3. Jalankan dengan variabel buatan (jangan pakai secret asli):
   ```bash
   API_KEY=rahasia123 bun dev
   ```
   Buka `/uji-secret` → `3 produk`. Tanpa `API_KEY` di terminal → `ditolak`. (Yang pertama saya uji; yang kedua mengikuti logika route, tidak saya jalankan terpisah.)
4. Narasi: "Slide aslinya memanggil `api.contoh.com`, yang bukan alamat nyata. Karena itu kita ganti dengan route lokal supaya bisa dicoba."

**Cek manual:** halaman menampilkan `3 produk` hanya saat `API_KEY` benar.

---

## Slide 11 — Beda 3: Yang Tidak Ikut ke Browser

**Durasi:** ± 100 detik

**Script:**
"Beda ketiga: apa yang **nggak ikut ke browser**. Saya cek isi file JavaScript hasil build dan HTML-nya.

**Kode pengambil data**: pesan `Gagal mengambil data` dari versi client ditemukan di JavaScript browser. Data dan kode versi server nggak ditemukan di sana. **Secret**: nilai `API_KEY` nggak ada di file JavaScript maupun di HTML. Yang sampai ke browser hanya hasil renderingnya. **Request-nya sendiri**: terjadi dari server ke server, jadi nggak muncul di tab Network dan nggak kena aturan CORS."

### 🖥️ Live Coding — buktikan lewat build

1. Jalankan build lalu cari teks di file JavaScript client:
   ```bash
   API_KEY=rahasia123 bun run build
   grep -rl "Gagal mengambil data" .next/static
   grep -rl "rahasia123" .next/static
   grep -rl "Kopi" .next/static
   ```
2. Hasil yang saya amati (21 file JavaScript di `.next/static`):
   - `Gagal mengambil data` (teks dari versi client): ditemukan di **1** file.
   - `Kopi` (data versi server): **0** file.
   - `rahasia123` (nilai secret): **0** file, dan **tidak ada** di HTML `/uji-secret`, `/uji-server`, maupun `/uji-client`.
   (Perintah `grep` di atas adalah versi manual dari pengecekan yang saya lakukan lewat skrip, hasilnya ekuivalen.)
3. Buka `/uji-secret` di browser dengan DevTools → **Network**. Yang terlihat hanya request dokumen halaman, tidak ada request ke `/api/rahasia`, karena request itu terjadi di server. (Bagian Network ini saya simpulkan dari cara kerjanya, tidak saya hitung lewat DevTools.)

**Cek manual:** `grep` untuk `rahasia123` dan `Kopi` tidak menemukan apa pun; untuk `Gagal mengambil data` menemukan 1 file.

---

## Slide 12 — Beda 4: Kapan Datanya Diambil?

**Durasi:** ± 100 detik

**Script:**
"Beda keempat, dan ini sering mengejutkan: **kapan datanya diambil**. Ini perilaku default Next.js 16.

**Static**, tanda `○` di build: diambil **sekali** saat `next build`. Datanya sama untuk semua pengunjung, sangat cepat, tapi data bisa basi sampai build berikutnya. **Dynamic**, tanda `ƒ`: diambil **setiap ada request**. Datanya selalu terbaru, tapi menunggu fetch selesai, sekitar 0,8 detik di uji lokal. Dynamic aktif kalau memakai API dinamis.

Dan contoh kita tadi ternyata **Static**. Halaman yang hanya `await` fungsi data biasa otomatis diprerender saat build."

### 🖥️ Live Coding — ○ dan waktu respons

1. Setelah `bun run build`, lihat tabel route. Hasil yang saya amati: `○ /uji-server` (halaman yang hanya `await getProduk()`).
2. Jalankan `bun start` dan ukur waktu respons (di terminal lain, atau lewat tab Network). Hasil yang saya amati untuk halaman static dengan `getProduk()` berjeda 800 ms: **11 ms, 2 ms, 1 ms** pada tiga request berturut-turut. Jeda 800 ms terjadi **sekali saat build**, bukan per request.
3. Catatan: slide menyebut sekitar 40 ms. Di uji saya jauh lebih kecil karena dijalankan lokal. Angka persisnya tergantung mesin, polanya sama: **milidetik, bukan detik**.
4. Narasi: "Datanya sudah 'dipanggang' saat build. Kalau datanya berubah di database, halaman ini nggak ikut berubah sampai kita build ulang."

**Cek manual:** tabel build menampilkan `○` untuk `/uji-server`; respons production hanya beberapa milidetik.

---

## Slide 13 — Membuat Halaman Dynamic

**Durasi:** ± 80 detik

**Script:**
"Kalau kita mau datanya selalu terbaru, kita bikin halamannya dynamic. Caranya: `await connection()` dari `next/server`. Fungsi ini memberi tahu Next.js: *tunggu request asli sebelum merender.*"

### 🖥️ Live Coding — `connection()`

1. Buat `app/uji-dinamis/page.tsx`:
   ```tsx
   import { connection } from 'next/server'
   import { getProduk } from '@/lib/produk'

   export default async function Page() {
     await connection()
     const produk = await getProduk()

     return (
       <ul>
         {produk.map((p) => (
           <li key={p.id}>{p.title}</li>
         ))}
       </ul>
     )
   }
   ```
2. `bun run build`. Hasil yang saya amati: `ƒ /uji-dinamis`.
3. `bun start`, ukur waktu respons. Hasil yang saya amati: **821 ms, 812 ms, 812 ms**. Jeda 800 ms terjadi di **setiap request**.
4. Bandingkan dengan Slide 12: `/uji-server` ±1–11 ms vs `/uji-dinamis` ±0,8 detik, dengan kode yang hampir sama. Bedanya hanya satu baris `await connection()`.
5. Sebut contoh nyata di project: `app/katalog/page.tsx` memanggil `cookies()`, jadi otomatis dynamic (`ƒ`) tanpa `connection()`.

**Cek manual:** `/uji-dinamis` bertanda `ƒ` dan responsnya ±0,8 detik.

---

## Slide 14 — Cache Components Mengubah Aturannya

**Durasi:** ± 80 detik

**Script:**
"Satu peringatan penting. Semua contoh di video ini memakai konfigurasi **default** Next.js. Kalau `cacheComponents: true` diaktifkan, aturannya berubah: halaman yang mengambil data tanpa dibungkus apa pun **gagal saat build**.

Cara memperbaikinya: bungkus dengan `Suspense`, atau cache dengan `'use cache'`. Dua-duanya dibahas di video berikutnya, dan Cache Components kita aktifkan di sub-bab caching."

### 🖥️ Live Coding — lihat error-nya (hanya di salinan / opsional)

> **Jangan aktifkan ini di project utama untuk rekam.** Saya coba di salinan: begitu `cacheComponents: true` dinyalakan, `next build` langsung gagal di route yang **sudah ada**, bukan hanya di demo kita.

1. (Opsional, di salinan) isi `next.config.ts`:
   ```ts
   const nextConfig: NextConfig = {
     cacheComponents: true,
   };
   ```
2. `bun run build`. Hasil yang saya amati di Next.js 16.2.10:
   ```
   Error: Route "/blog/[slug]": Uncached data was accessed outside of <Suspense>.
   This delays the entire page from rendering, resulting in a slow user experience.
   Learn more: https://nextjs.org/docs/messages/blocking-route
   ```
   dengan penunjuk ke `app/components/Navbar.tsx` (`usePathname()`) dan `ThemeProvider.tsx`, yaitu komponen di layout yang dipakai semua halaman.
3. **Catatan wording:** slide menulis `Next.js encountered uncached or runtime data during prerendering`. Pesan di versi project ini bunyinya `Uncached data was accessed outside of <Suspense>`, sama dengan yang tertulis di dokumentasi Next.js (`node_modules/next/dist/docs/01-app/01-getting-started/08-caching.md`). Sebut keduanya kalau perlu: maksudnya sama.
4. Narasi: "Makanya nanti, waktu kita aktifkan Cache Components, layout dan halaman-halaman ini ikut dirapikan."

**Cek manual:** (di salinan) build gagal dengan `Uncached data was accessed outside of <Suspense>`.

---

## Slide 15 — Perbandingan Fetch di Client dan Server

**Durasi:** ± 90 detik

**Script:**
"Rangkumannya. **Cara menulis**: client pakai `useEffect` plus `useState`; server pakai `async/await` langsung. **Request dikirim dari**: browser pengguna versus server. **HTML awal**: client belum berisi data, server sudah berisi data. **Kode fetch ke browser**: di client ikut dikirim, di server nggak. **Secret dan database**: client nggak boleh, server aman dipakai. **Loading dan error**: client pakai state di komponen, server pakai `loading.tsx`, `Suspense`, dan `error.tsx`.

Itu dia fetch data di Server Component. Di video berikutnya kita lihat bagaimana menampilkan 'Memuat' di sisi server lewat Suspense dan Streaming. Sampai jumpa!"

### 🖥️ Live Coding — pembersihan

```bash
rm -rf app/uji-server app/uji-secret app/uji-error app/uji-dinamis app/api/rahasia lib/produk.ts
rm -rf .next
bunx next typegen
bunx tsc --noEmit --incremental false
```
(Jangan hapus `app/api/produk`, itu bagian dari commit-mu. Kalau `next.config.ts` sempat diubah di Slide 14, kembalikan ke `/* config options here */`.)

**Cek manual:** `git status` tidak menampilkan folder `uji-*` baru; `tsc` bersih.

---

## Rekap Durasi

| Slide | Durasi |
|---|---|
| 1 | 0:20 |
| 2 | 1:10 |
| 3 | 1:00 |
| 4 | 1:30 |
| 5 | 1:30 |
| 6 | 1:10 |
| 7 | 1:00 |
| 8 | 1:20 |
| 9 | 1:50 |
| 10 | 1:20 |
| 11 | 1:40 |
| 12 | 1:40 |
| 13 | 1:20 |
| 14 | 1:20 |
| 15 | 1:30 |
| **Total** | **± 20:00** (lewati live coding Slide 5 bagian build, Slide 11, Slide 12 (ukur waktu), dan Slide 14 untuk mendekati 12 menit) |
