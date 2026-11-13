# Script Ngajar — M8 Sub1: Server Components vs Client Components

**Total durasi:** ± 17 menit penuh, ± 12 menit kalau live coding Slide 4 (bagian secret), Slide 10, dan Slide 13 (jebakan #3) dilewati atau hanya ditunjukkan sekilas (13 slide)
**Sumber:** `script/M8_Sub1_Server_vs_Client.pptx.pdf`

## Persiapan sebelum rekam

- **Jangan buka `.env` di layar saat rekam.** File itu berisi kredensial sungguhan (`BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_SECRET`, `CLOUDINARY_API_SECRET`, `DATABASE_URL`). Demo secret di Slide 4 memakai variabel buatan `DEMO_RAHASIA` yang dikirim lewat terminal, bukan isi `.env`.
- Semua demo berupa route sungguhan di folder berawalan `uji-`: `app/uji-api`, `app/uji-server`, `app/uji-client`, `app/uji-like`, `app/uji-hook`, `app/uji-fungsi`, `app/uji-konteks`, `app/uji-env`.
- Slide memakai `https://api.contoh.com/post/1` yang tidak nyata. Di naskah ini diganti route lokal `app/uji-api/route.ts` yang mengembalikan `{ "title": "Belajar Next.js" }`, supaya demo bisa jalan tanpa internet. Saya tes di port 3100, di naskah dipakai port bawaan `3000` (`bun dev`). Sesuaikan URL kalau portmu beda.
- Cara "View Source": di browser tekan `Cmd+Option+U` (Mac) atau `Ctrl+U` (Windows), atau buka `view-source:http://localhost:3000/uji-server`. Yang dilihat adalah HTML **mentah** sebelum JavaScript jalan, sama seperti yang diterima crawler.
- Pembersihan di akhir (urutannya penting, sisa tipe generate bisa bikin `tsc` error, lihat M7 Sub6):
  ```bash
  rm -rf app/uji-api app/uji-server app/uji-client app/uji-like app/uji-hook app/uji-fungsi app/uji-konteks app/uji-env
  rm -rf .next
  bunx next typegen
  bunx tsc --noEmit --incremental false
  ```
- Kondisi terakhir yang saya cek: `tsc` bersih (tanpa folder demo). `bun run build` **tidak** saya jalankan di sesi ini.

### Temuan di repo yang bisa dipakai sebagai bahan ngajar

Saya baca file `'use client'` yang sudah ada di project:

| File | Status | Catatan |
|---|---|---|
| `app/layout.tsx` | Server | membungkus `<ThemeProvider>` yang Client, **persis pola Slide 13 poin 3** |
| `app/components/ThemeProvider.tsx` | Client | menerima `children`, meneruskan ke `NextThemesProvider` |
| `app/components/Navbar.tsx` | Client | **wajar**: memakai `usePathname()` |
| `app/blog/components/PostList.tsx` | Client | **wajar**: `useState` untuk filter, dipanggil dari `app/blog/page.tsx` (Server) |
| `app/components/SearchForm.tsx`, `RequestModulDialog.tsx` | Client | **wajar**: `useState`, event handler |
| `app/page.tsx` | Client | **tidak perlu**: tidak ada hook atau event handler. Ini **persis jebakan #1 Slide 13**. Saya coba hapus baris `"use client"` sementara: halaman `/` tetap tampil normal (200). File sudah saya kembalikan. |
| `app/vip/page.tsx` | Client | memakai `localStorage` di badan komponen. Kena masalah prerender (lihat catatan Slide 5) |

Saya **tidak mengubah** satupun file project.

---

## Slide 1 — Server Components vs Client Components

**Durasi:** ± 20 detik

**Script:**
"Halo gaes, kita masuk ke Bab 8. Pertanyaan yang paling sering muncul di Next.js: *komponen ini harus Server atau Client?* Di video ini kita bikin jawabannya gampang diingat, dan kita buktikan langsung lewat View Source."

---

## Slide 2 — Dua Jenis Komponen di Next.js

**Durasi:** ± 60 detik

**Script:**
"Di Next.js ada dua jenis komponen. Dua-duanya komponen React biasa. Bedanya cuma satu: **dijalankan di mana**.

**Server Component** itu bawaan. Semua `page.tsx` dan `layout.tsx` di App Router otomatis jadi Server Component, kita nggak perlu nulis apa-apa. **Client Component** ditandai `'use client'` di baris paling atas file, dan kita yang memilih, hanya kalau memang perlu.

Perbedaannya: cara kerja, dan apa yang boleh dipakai."

### 🖥️ Live Coding — tunjukkan di repo

1. Buka `app/blog/[slug]/page.tsx`. "Nggak ada `'use client'` di sini, jadi ini Server Component, dan boleh `async`."
2. Buka `app/components/Navbar.tsx`. "Baris pertamanya `"use client"`. Ini Client Component."

**Cek manual:** `blog/[slug]/page.tsx` tanpa `'use client'`; `Navbar.tsx` dengan `"use client"` di baris 1.

---

## Slide 3 — Analogi: Pesan Makanan

**Durasi:** ± 60 detik

**Script:**
"Biar gampang kebayang: anggap **server itu dapur**, dan **browser itu meja kamu**.

**Server Component** itu makanan yang sudah jadi. Semua dimasak di dapur, kamu terima piringnya yang sudah matang, dan bahan serta resep rahasia tetap di dapur. **Client Component** itu bahan dan resep yang dikirim ke meja. Dimasak di meja kamu, yaitu di perangkat pengguna. Kode JavaScript-nya dikirim ke browser, dan bisa diubah-ubah sesuai pilihanmu, alias interaktif."

---

## Slide 4 — Cara Kerja Server Component

**Durasi:** ± 80 detik

**Script:**
"Empat hal soal Server Component.

Satu, **UI dibuat di server**: server menjalankan komponennya, lalu mengirim hasil jadinya ke browser. Dua, **kodenya nggak ikut dikirim**: browser menerima hasil, bukan kodenya, jadi JavaScript yang diunduh lebih sedikit. Tiga, **akses database dan secret langsung**: karena berjalan di server, API key dan query database nggak terlihat pengguna. Empat, **nggak bisa pakai Hook**: server nggak tahu pengguna mengklik apa, interaksi cuma terjadi di browser."

### 🖥️ Live Coding — Hook di Server Component ditolak

1. Siapkan route API kecil, `app/uji-api/route.ts`:
   ```ts
   export function GET() {
     return Response.json({ title: "Belajar Next.js" })
   }
   ```
2. Buat `app/uji-hook/page.tsx` (tanpa `'use client'`, tapi pakai `useState`):
   ```tsx
   import { useState } from "react"

   export default function Page() {
     const [n, setN] = useState(0)
     return <button onClick={() => setN(n + 1)}>{n}</button>
   }
   ```
3. Jalankan `bun dev`, buka `/uji-hook`. Halaman error (status 500). Di terminal dan overlay muncul:
   ```
   You're importing a module that depends on `useState` into a React Server Component module.
   This API is only available in Client Components. To fix, mark the file (or its parent) with the `"use client"` directive.
   ```
4. Perbaiki dengan menambah `'use client'` di baris pertama → tombol tampil `0`. "Ini ukuran praktis bahwa `useState` butuh browser."

**Cek manual:** error `useState` ... `React Server Component module` muncul sebelum `'use client'` ditambahkan, dan hilang sesudahnya. (`tsc` **tidak** menandai ini. Error-nya baru muncul saat halaman dijalankan atau dibuild.)

### 🖥️ Live Coding — secret hanya di server

1. Hentikan `bun dev`, lalu jalankan dengan variabel buatan (jangan pakai secret asli):
   ```bash
   DEMO_RAHASIA=abc123 bun dev
   ```
2. Buat `app/uji-env/klien.tsx`:
   ```tsx
   'use client'

   export default function Klien() {
     return <p id="klien">klien: [{process.env.DEMO_RAHASIA}]</p>
   }
   ```
3. Buat `app/uji-env/page.tsx`:
   ```tsx
   import Klien from "./klien"

   export default function Page() {
     return (
       <div>
         <p id="server">server: [{process.env.DEMO_RAHASIA}]</p>
         <Klien />
       </div>
     )
   }
   ```
4. Buka `/uji-env` lalu View Source. Hasil yang saya amati (mode dev):
   - `server: [abc123]`: terbaca di Server Component, normal.
   - `klien: [abc123]` **juga muncul di HTML awal**. Ini hal yang tidak intuitif: Client Component tetap dirender dulu di server untuk membuat HTML awal (lihat Slide 5), jadi nilai secret bisa ikut tertulis di HTML.
   - Tapi di **file JavaScript** yang dikirim ke browser, nilainya tidak ada (sesuai dokumentasi: hanya variabel berawalan `NEXT_PUBLIC_` yang masuk bundle client).
5. Narasi: "Jadi pelajarannya: **jangan pernah menaruh secret di Client Component**, termasuk kalau 'cuma ditampilkan'. Di Slide 10 tabelnya bilang 'tidak boleh (bisa bocor ke browser)'. Ini buktinya."

**Cek manual:** `abc123` terlihat di View Source untuk kedua `<p>`.

---

## Slide 5 — Cara Kerja Client Component

**Durasi:** ± 70 detik

**Script:**
"Client Component kebalikannya. **Kodenya dikirim ke browser dan dijalankan di sana**, makanya bisa bereaksi saat pengguna klik, ketik, atau scroll.

Tapi ada satu hal penting: **load pertama tetap ada HTML awal**. Next.js membuat HTML-nya dulu supaya cepat tampil, lalu browser 'menghidupkannya'. Proses itu namanya *hydration*. Dan Client Component cocok untuk state, event, effect, dan browser API: `useState`, `onClick`, `useEffect`, `localStorage`, `window`."

### 🖥️ Live Coding — HTML awal tetap ada

Kita buktikan di Slide 7 (tombol suka tampil `0 suka` di View Source). Tahan dulu.

> **Catatan jujur buat dosen:** karena HTML awal Client Component dibuat di server, kode di **badan komponen** yang memakai `localStorage` atau `window` bisa error saat itu. Di project ini, `app/vip/page.tsx` memakai `localStorage.getItem('vip')` langsung di badan komponen. Saat `bun run build`, halaman itu gagal prerender dengan `TypeError: Cannot read properties of undefined (reading 'getItem')` (saya temui di sesi sebelumnya). Solusinya membaca `localStorage` di dalam `useEffect`, yang hanya jalan di browser. Ceritakan sebagai "gotcha"; jangan diubah sekarang kalau belum dibahas.

---

## Slide 6 — Contoh Server Component

**Durasi:** ± 70 detik

**Script:**
"Ini contoh Server Component. Perhatikan: **nggak ada `'use client'`**, dan komponennya boleh `async`. Datanya diambil langsung dengan `await fetch(...)`, lalu dipakai di JSX."

### 🖥️ Live Coding — Server Component yang `async`

1. `app/uji-server/page.tsx`:
   ```tsx
   // Server Component: bawaan, tanpa 'use client'
   export default async function Page() {
     const res = await fetch("http://localhost:3000/uji-api")
     const post = await res.json()

     return <h1>{post.title}</h1>
   }
   ```
2. Buka `/uji-server` → tampil `Belajar Next.js`.
3. Buka View Source dan cari `<h1>`: sudah berisi `Belajar Next.js`. (Kita pakai ini di Slide 9.)

**Cek manual:** `<h1>Belajar Next.js</h1>` ada langsung di HTML mentah.

---

## Slide 7 — Contoh Client Component

**Durasi:** ± 70 detik

**Script:**
"Sekarang Client Component. Ada `useState` dan `onClick`, jadi **harus** Client Component. Perhatikan `'use client'` di baris pertama. Kita pisah jadi file kecil sendiri, lalu dipanggil dari halaman Server."

### 🖥️ Live Coding — tombol suka

1. `app/uji-like/like-button.tsx`:
   ```tsx
   'use client'
   import { useState } from 'react'

   export default function LikeButton() {
     const [likes, setLikes] = useState(0)
     return (
       <button onClick={() => setLikes(likes + 1)}>
         {likes} suka
       </button>
     )
   }
   ```
2. `app/uji-like/page.tsx` (Server Component yang memanggilnya):
   ```tsx
   import LikeButton from "./like-button"

   export default function Page() {
     return (
       <div>
         <h1>Artikel</h1>
         <LikeButton />
       </div>
     )
   }
   ```
3. Buka `/uji-like`, klik tombol: angka naik di browser tanpa reload.
4. View Source: `<button>0 suka</button>` **sudah ada** di HTML awal. "Inilah maksud 'load pertama tetap ada HTML awal'. Setelah JavaScript jalan, tombolnya jadi hidup."

**Cek manual:** angka naik saat diklik; View Source menampilkan `0 suka`.

---

## Slide 8 — Kenapa Server Component Lebih Nyaman untuk SEO?

**Durasi:** ± 70 detik

**Script:**
"Mesin pencari membaca HTML. Pertanyaannya: apakah konten kita sudah ada semua di HTML itu atau belum?

Di **Server Component**, seluruh halaman dirakit di server dan dikirim sebagai satu paket HTML yang sudah lengkap. Di **Client Component**, tiap komponen render dan ambil datanya sendiri, jadi konten muncul bertahap setelah JavaScript jalan.

Satu catatan penting: Client Component **tetap** dibuatkan HTML awal. Tapi data yang diambil di browser belum ada di HTML itu. Yang ada baru kerangkanya."

---

## Slide 9 — Ilustrasi: HTML yang Diterima Crawler

**Durasi:** ± 90 detik

**Script:**
"Ilustrasinya di slide disederhanakan dari hasil View Source. Sekarang kita lihat yang sebenarnya, dari project kita sendiri. Halaman yang sama, judul yang sama, hanya beda komponennya."

### 🖥️ Live Coding — View Source: server vs client

1. `app/uji-client/page.tsx` (fetch di `useEffect`):
   ```tsx
   'use client'
   import { useEffect, useState } from 'react'

   export default function Page() {
     const [judul, setJudul] = useState("Memuat...")

     useEffect(() => {
       fetch("/uji-api")
         .then((r) => r.json())
         .then((post) => setJudul(post.title))
     }, [])

     return <h1>{judul}</h1>
   }
   ```
2. Bandingkan dua halaman. Buka **View Source** (bukan Inspect Element!) untuk masing-masing:
   - `/uji-server` → `<h1>Belajar Next.js</h1>`
   - `/uji-client` → `<h1>Memuat...</h1>`
3. Lalu buka **Inspect Element** di `/uji-client`: sekarang `<h1>Belajar Next.js</h1>`. "Inspect Element menampilkan DOM **setelah** JavaScript jalan. View Source menampilkan yang diterima crawler. Dua-duanya halaman yang sama, tapi isinya beda."
4. Narasi: "Mesin pencari modern kadang bisa menjalankan JavaScript, tapi itu lebih lambat dan tidak dijamin. Dengan Server Component, kontennya sudah ada dari awal."

**Cek manual:** View Source `/uji-server` berisi judul asli; View Source `/uji-client` berisi `Memuat...`.

---

## Slide 10 — Perbandingan Singkat

**Durasi:** ± 70 detik

**Script:**
"Rangkumannya dalam satu tabel. **Dijalankan di**: Server Component di server; Client Component di browser, tapi HTML awalnya tetap dibuat di server. **`useState`, `onClick`, `useEffect`**: Server Component nggak bisa, Client Component bisa. **Akses database dan secret**: Server bisa langsung; Client nggak boleh, karena bisa bocor ke browser. **JavaScript ke browser**: kode Server Component nggak dikirim, kode Client Component dikirim dan dijalankan. **Mengambil data**: Server pakai `async/await` langsung; Client pakai `useEffect` atau library, yang kita bahas di video berikutnya."

### 🖥️ Live Coding — buktikan "kode tidak dikirim"

1. Buat `app/uji-bundle/klien.tsx`:
   ```tsx
   'use client'

   export default function Klien() {
     return <button onClick={() => alert("RESEP_CLIENT_ABC")}>klien</button>
   }
   ```
2. Buat `app/uji-bundle/page.tsx`:
   ```tsx
   import Klien from "./klien"

   function resepRahasia() {
     return "RESEP_SERVER_XYZ"
   }

   export default function Page() {
     return (
       <div>
         <p>{resepRahasia().length}</p>
         <Klien />
       </div>
     )
   }
   ```
3. Buka `/uji-bundle`, lalu di DevTools buka tab **Sources** (atau **Network** → filter JS). Cari teks `RESEP_CLIENT_ABC` dengan `Cmd+Option+F` (pencarian di semua file).
   Hasil yang saya amati lewat skrip: `RESEP_CLIENT_ABC` **ditemukan** di satu file JavaScript (bundle client), sedangkan `RESEP_SERVER_XYZ` **tidak ditemukan** di HTML maupun di file JavaScript mana pun.
4. Narasi: "Kode Client Component ikut diunduh browser. Kode Server Component nggak. Itu yang dimaksud 'JavaScript yang diunduh lebih sedikit'."

**Cek manual:** pencarian `RESEP_CLIENT_ABC` menemukan 1 file JS; `RESEP_SERVER_XYZ` tidak menemukan apa pun.

---

## Slide 11 — Kapan Pakai yang Mana?

**Durasi:** ± 70 detik

**Script:**
"Ini daftar resmi dari dokumentasi Next.js.

**Client Component** kalau ada interaksi atau butuh browser: state dan event handler seperti `useState`, `onClick`, `onChange`; lifecycle seperti `useEffect`; browser API seperti `localStorage` dan `window`; dan custom hooks.

**Server Component** kalau menampilkan dan mengambil data: ambil data dari database atau API, pakai API key dan secret dengan aman, kurangi JavaScript ke browser, dan tampil lebih cepat serta bisa di-*streaming*."

### 🖥️ Live Coding — cek keputusan di file project

Buka tiga file dan tanyakan "Server atau Client? Kenapa?":
1. `app/components/Navbar.tsx` → **Client**, karena `usePathname()`.
2. `app/blog/components/PostList.tsx` → **Client**, karena `useState` untuk filter dan `onClick`.
3. `app/member/[id]/page.tsx` → **Server**, hanya `await params` dan menampilkan data.

**Cek manual:** ketiganya sesuai tebakan.

---

## Slide 12 — Cara Gampang Mengingatnya

**Durasi:** ± 60 detik

**Script:**
"Tiga pertanyaan buat diingat.

Satu: *bisa diklik, diketik, atau berubah-ubah?* Ada `useState`, `onClick`, `useEffect`, atau butuh `window`? Berarti **Client Component**. Dua: *cuma menampilkan data?* Berarti **Server Component**, ini default-nya, nggak perlu ditulis apa-apa. Tiga: **mulai dari Server**. Tambahkan `'use client'` hanya saat benar-benar butuh, dan di file sekecil mungkin."

---

## Slide 13 — Jebakan yang Sering Terjadi

**Durasi:** ± 120 detik

**Script:**
"Tiga jebakan.

**Pertama, `'use client'` di paling atas page.** Semua yang diimpor ikut jadi client, dan manfaat Server Component hilang. Pisahkan bagian interaktif ke file kecil sendiri. **Kedua, props ke Client Component harus bisa diserialisasi.** Teks, angka, objek, dan array boleh. Fungsi biasa nggak bisa dikirim dari Server ke Client. **Ketiga, Context nggak jalan di Server Component.** Bungkus provider-nya dalam Client Component yang menerima `children`."

### 🖥️ Live Coding — jebakan #1: `'use client'` di page (di repo sendiri)

1. Buka `app/page.tsx`. Baris pertamanya `"use client"`, padahal halaman ini **tidak** punya `useState`, `onClick`, atau `useEffect`. Satu-satunya bagian interaktif adalah `<RequestModulDialog/>`, yang sudah `"use client"` sendiri.
2. Coba hapus baris `"use client"` itu. Halaman `/` tetap tampil normal (saya sudah menguji: status 200, judul `Next.js Masterclass` tetap ada). Artinya Server Component lebih cocok untuk halaman ini.
3. Kembalikan lagi (`Ctrl+Z`) kalau tidak ingin mengubah project.

> Catatan: file yang saya uji sudah saya kembalikan ke kondisi semula. Keputusan menghapus `"use client"` dari `app/page.tsx` sebaiknya kamu yang tentukan.

### 🖥️ Live Coding — jebakan #2: fungsi sebagai props

1. `app/uji-fungsi/tombol.tsx`:
   ```tsx
   'use client'

   export default function Tombol({ onKlik }: { onKlik: () => void }) {
     return <button onClick={onKlik}>Klik</button>
   }
   ```
2. `app/uji-fungsi/page.tsx` (Server Component):
   ```tsx
   import Tombol from "./tombol"

   export default function Page() {
     return <Tombol onKlik={() => console.log("halo")} />
   }
   ```
3. Buka `/uji-fungsi`. Error (status 500):
   ```
   Error: Event handlers cannot be passed to Client Component props.
     <... onKlik={function onKlik}>
   If you need interactivity, consider converting part of this to a Client Component.
   ```
4. Kalau nama prop-nya bukan seperti event handler (misalnya `ubah`), pesannya berbeda:
   ```
   Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server".
   Or maybe you meant to call this function rather than return it.
     <... ubah={function ubah}>
   ```
5. Perbaikan: tulis fungsinya **di dalam** Client Component, atau kirim data biasa (teks, angka, objek) lalu buat fungsinya di sisi client.

**Cek manual:** halaman error dengan salah satu pesan di atas. (Sama seperti Hook, `tsc` **tidak** menandai ini.)

### 🖥️ Live Coding — jebakan #3: Context

1. `app/uji-konteks/page.tsx` (tanpa `'use client'`):
   ```tsx
   import { createContext } from "react"

   const TemaContext = createContext("terang")

   export default function Page() {
     return <TemaContext.Provider value="gelap"><p>konteks</p></TemaContext.Provider>
   }
   ```
2. Buka `/uji-konteks`. Error (status 500):
   ```
   You're importing a module that depends on `createContext` into a React Server Component module.
   This API is only available in Client Components. To fix, mark the file (or its parent) with the `"use client"` directive.
   ```
3. Tunjukkan **cara yang benar, yang sudah ada di project ini**:
   - `app/components/ThemeProvider.tsx` → Client Component yang menerima `children` dan membungkus `NextThemesProvider`.
   - `app/layout.tsx` (Server Component) merender `<ThemeProvider>` dan menaruh `{children}` di dalamnya.
   "Layout tetap Server Component, tapi provider-nya Client. Inilah pola 'bungkus provider dalam Client Component yang menerima children'."
4. Penutup: "Itu dia Server vs Client Component. Di video berikutnya kita masuk ke pengambilan data. Sampai jumpa!"

### 🖥️ Pembersihan

```bash
rm -rf app/uji-api app/uji-server app/uji-client app/uji-like app/uji-hook app/uji-fungsi app/uji-konteks app/uji-env app/uji-bundle
rm -rf .next
bunx next typegen
bunx tsc --noEmit --incremental false
```

**Cek manual:** `git status` hanya menampilkan file milikmu sendiri, dan `tsc` bersih tanpa output.

---

## Rekap Durasi

| Slide | Durasi |
|---|---|
| 1 | 0:20 |
| 2 | 1:00 |
| 3 | 1:00 |
| 4 | 2:20 |
| 5 | 1:10 |
| 6 | 1:10 |
| 7 | 1:10 |
| 8 | 1:10 |
| 9 | 1:30 |
| 10 | 1:40 |
| 11 | 1:10 |
| 12 | 1:00 |
| 13 | 3:00 |
| **Total** | **± 17:20** (potong live coding Slide 4 bagian secret, Slide 10, dan Slide 13 bagian #3 untuk mendekati 12 menit) |
