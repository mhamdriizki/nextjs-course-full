# Script Ngajar — M8 Sub2: Fetch Data di Client Components

**Total durasi:** ± 23 menit penuh, ± 15 menit kalau live coding Slide 4, 12, dan 14 serta kunjungan kedua di Slide 11 dilewati atau hanya ditunjukkan sekilas (19 slide)
**Sumber:** `script/M8_Sub2_Fetch_Client_Components.pptx.pdf`

## Persiapan sebelum rekam

- **Pasang SWR dulu** (dipakai Slide 16–18). Slide menulis `npm install swr`, tapi project ini memakai bun (`bun.lock`), jadi:
  ```bash
  bun add swr
  ```
  Perintah ini mengubah `package.json` dan `bun.lock`. Kalau tidak ingin mengubahnya permanen, undo di akhir dengan `bun remove swr` (sudah saya uji: setelah itu `git diff` untuk kedua file kembali kosong).
- Slide memakai `/api/produk` yang di project ini **belum ada** (tidak ada folder `app/api`). Kita buat sendiri di Slide 3.
- Semua demo berupa route sungguhan berawalan `uji-`: `app/uji-sederhana`, `app/uji-produk`, `app/uji-gagal`, `app/uji-swr`, `app/uji-nav`, plus `app/api/produk` dan `app/api/produk-error`.
- Route API di naskah memakai **jeda buatan 600 ms** supaya tulisan `Memuat...` sempat terlihat, dan dua parameter bantu `?hitung` dan `?reset` untuk **menghitung berapa kali API dipanggil** (dipakai di Slide 11 dan 12). Itu alat peraga, bukan bagian materi.
- Semua kode di slide, termasuk versi SWR, lolos `bunx tsc --noEmit --incremental false` (saya tes).
- Perilaku di browser (urutan, cache, request ganda) saya uji di Chrome terhadap `bun dev`. Detailnya ada di tiap slide.
- **Belum saya uji:** `bun run lint` (aturan ESLint bisa mengomentari `setState` di dalam `useEffect`), dan perilaku production (`bun run build` tidak dijalankan di sesi ini, jadi klaim "di production hanya sekali" di Slide 12 tidak saya verifikasi).
- Pembersihan di akhir:
  ```bash
  rm -rf app/api app/uji-sederhana app/uji-produk app/uji-gagal app/uji-swr app/uji-nav app/uji-efek
  rm -rf .next
  bunx next typegen
  bunx tsc --noEmit --incremental false
  bun remove swr   # kalau tadi memasangnya hanya untuk demo
  ```
  (`rm -rf app/api` aman karena sebelumnya folder itu tidak ada. Kalau kamu sudah membuat `app/api` sendiri, hapus subfolder `produk` dan `produk-error` saja.)

### Alat peraga: route API

`app/api/produk/route.ts`:
```ts
let hit = 0

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  if (searchParams.has("hitung")) return Response.json({ hit })
  if (searchParams.has("reset")) { hit = 0; return Response.json({ hit }) }

  hit++
  await new Promise((r) => setTimeout(r, 600))
  return Response.json([
    { id: 1, title: "Kopi" },
    { id: 2, title: "Teh" },
    { id: 3, title: "Roti" },
  ])
}
```

`app/api/produk-error/route.ts` (untuk memaksa error):
```ts
export function GET() {
  return new Response("Server error", { status: 500 })
}
```

---

## Slide 1 — Fetch Data di Client Components

**Durasi:** ± 20 detik

**Script:**
"Halo gaes, lanjut ke Bab 8 sub-bab kedua. Di video sebelumnya kita tahu ada Server Component dan Client Component. Sekarang kita lihat cara mengambil data di sisi **Client**: cara yang biasa kita pakai di React, lengkap dengan sifat-sifatnya, termasuk kelemahannya."

---

## Slide 2 — Fetch di Client Component = Pola React

**Durasi:** ± 50 detik

**Script:**
"Tenang, nggak ada yang baru di sini. Ini pola React yang sudah kita kenal. Yang dipakai: hook React biasa. `useEffect` untuk menjalankan fetch, `useState` untuk menyimpan hasilnya, dan filenya ditandai `'use client'`.

Yang perlu diurus: **semuanya manual**. State data, loading, dan error. Pembatalan request. Dan cache, kalau butuh. Nah, daftar 'harus diurus sendiri' ini yang bikin capek, dan itu bakal jadi benang merah video ini."

---

## Slide 3 — Contoh Paling Sederhana

**Durasi:** ± 80 detik

**Script:**
"Contoh paling sederhana: ambil daftar produk dari API route, simpan di state, tampilkan. Perhatikan tipe state-nya, `useState<{ id: number; title: string }[]>([])`, ini langsung memakai ilmu TypeScript dari Bab 7."

### 🖥️ Live Coding — route API dan halaman sederhana

1. Buat `app/api/produk/route.ts` dan `app/api/produk-error/route.ts` (kode di bagian **Alat peraga** di atas).
2. Buat `app/uji-sederhana/page.tsx`:
   ```tsx
   'use client'
   import { useEffect, useState } from 'react'

   export default function Page() {
     const [produk, setProduk] = useState<{ id: number; title: string }[]>([])
     useEffect(() => {
       fetch('/api/produk')
         .then((res) => res.json())
         .then((data) => setProduk(data))
     }, [])
     return <ul>{produk.map((p) => <li key={p.id}>{p.title}</li>)}</ul>
   }
   ```
3. Jalankan `bun dev`, buka `/api/produk` langsung di browser: JSON `[{ "id":1, "title":"Kopi" }, ...]` muncul setelah sekitar 0,6 detik.
4. Buka `/uji-sederhana`: daftar `Kopi`, `Teh`, `Roti` tampil.
5. Cek tipe: `bunx tsc --noEmit --incremental false` → bersih.

**Cek manual:** tiga item tampil di `/uji-sederhana`.

---

## Slide 4 — Urutan Kejadiannya

**Durasi:** ± 70 detik

**Script:**
"Ini penting: kodenya kelihatan sederhana, tapi urutannya nggak seperti yang dikira. Satu, komponen render pertama kali dengan data **kosong**. Dua, browser menampilkan hasil render itu. Tiga, baru **setelah itu** `useEffect` jalan dan fetch dikirim. Empat, data tiba, `setProduk` dipanggil, komponen render ulang.

Jadi `useEffect` bukan 'sebelum tampil'. Dia **sesudah** tampil."

### 🖥️ Live Coding — lihat layar kosong dulu

1. Di `/uji-sederhana`, muat ulang halaman sambil melihat layar. Karena API sengaja lambat 0,6 detik, daftar **kosong sesaat**, baru `Kopi`, `Teh`, `Roti` muncul. (Saya tidak merekam tampilan kosongnya secara langsung. Yang saya uji: setelah menunggu, daftarnya terisi tiga item.)
2. Kalau ingin lebih jelas, perbesar jeda di `route.ts` jadi `2000` ms.

**Cek manual:** ada jeda di mana halaman belum menampilkan produk.

---

## Slide 5 — Contoh Menambah State Loading dan Error

**Durasi:** ± 60 detik

**Script:**
"Layar kosong itu membingungkan pengguna. Jadi kita tambah dua state lagi: satu untuk datanya, dua lagi untuk keadaan request. `loading` bernilai `true` selama request berjalan. `error` berisi pesan kalau gagal, bertipe `string | null`. Tipe `Produk` kita beri nama dengan alias, ingat sub-bab lima di Bab 7."

### 🖥️ Live Coding — siapkan tiga state

Mulai dari file baru `app/uji-produk/page.tsx` (isi lengkapnya dirakit bertahap di Slide 5 sampai 7, dan 13 sampai 14):
```tsx
'use client'
import { useEffect, useState } from 'react'

type Produk = { id: number; title: string }

export default function Page() {
  // data yang mau ditampilkan
  const [produk, setProduk] = useState<Produk[]>([])

  // true selama request masih berjalan
  const [loading, setLoading] = useState(true)

  // pesan kalau request gagal
  const [error, setError] = useState<string | null>(null)

  // ... useEffect dan return ditambah di slide berikutnya
}
```

---

## Slide 6 — Contoh useEffect dengan try, catch, finally

**Durasi:** ± 80 detik

**Script:**
"Sekarang isi `useEffect`-nya. Fungsi `async` di dalam effect, dibungkus `try`, `catch`, `finally`. Bagian yang sering terlewat: **`fetch` hanya gagal kalau jaringan putus**. Status 404 atau 500 tetap dianggap *berhasil*. Makanya kita cek `res.ok` dan lempar error sendiri."

### 🖥️ Live Coding — `res.ok` dan pesan error

1. Tambahkan ke `app/uji-produk/page.tsx`:
   ```tsx
   useEffect(() => {
     async function ambilData() {
       try {
         const res = await fetch('/api/produk')
         if (!res.ok) throw new Error('Gagal mengambil data')
         setProduk(await res.json())
       } catch (e) {
         setError(e instanceof Error ? e.message : 'Terjadi kesalahan')
       } finally {
         setLoading(false)
       }
     }
     ambilData()
   }, [])
   ```
2. Buktikan klaim "status 500 tetap dianggap berhasil". Buka halaman mana saja dari app ini, lalu di Console DevTools ketik:
   ```js
   const r = await fetch('/api/produk-error'); ({ ok: r.ok, status: r.status })
   ```
   Hasil yang saya amati: `{ ok: false, status: 500 }`. Tidak ada error yang dilempar, `fetch` tetap selesai normal. Karena itulah `res.ok` harus dicek.

**Cek manual:** console menampilkan `{ ok: false, status: 500 }` tanpa exception.

---

## Slide 7 — Contoh Tampilan Berdasarkan State

**Durasi:** ± 70 detik

**Script:**
"Tiga kemungkinan tampilan: memuat, gagal, atau datanya sudah ada. Urutan `if` penting: cek `loading` dulu, lalu `error`, baru tampilkan daftar."

### 🖥️ Live Coding — tiga tampilan

1. Tambahkan di akhir komponen `app/uji-produk/page.tsx`:
   ```tsx
   if (loading) return <p>Memuat...</p>
   if (error) return <p>Error: {error}</p>

   return (
     <ul>
       {produk.map((p) => (
         <li key={p.id}>{p.title}</li>
       ))}
     </ul>
   )
   ```
2. Buka `/uji-produk`: `Memuat...` sebentar, lalu `Kopi`, `Teh`, `Roti`.
3. Salin file itu ke `app/uji-gagal/page.tsx` dan ganti `'/api/produk'` menjadi `'/api/produk-error'`. Buka `/uji-gagal`. Hasil yang saya amati: `Error: Gagal mengambil data`.
4. Cek tipe: `bunx tsc --noEmit --incremental false` → bersih.

**Cek manual:** `/uji-produk` menampilkan daftar; `/uji-gagal` menampilkan `Error: Gagal mengambil data`.

---

## Slide 8 — Sifat 1: Baru Jalan Setelah Halaman Dimuat

**Durasi:** ± 70 detik

**Script:**
"Sekarang kita masuk ke sifat-sifat fetch di client. **Sifat pertama: baru jalan setelah halaman dimuat.** Lihat urutannya: HTML tiba, JavaScript diunduh, hydration, baru `useEffect` jalan dan fetch dikirim, lalu data tiba dan UI tampil. Fetch menunggu semua tahap di kiri selesai dulu.

Akibatnya, data baru diminta setelah browser selesai menyiapkan halaman. Selama itu pengguna melihat kerangka atau tulisan 'Memuat'. Di Server Component, data sudah ikut dalam HTML yang tiba di tahap pertama."

---

## Slide 9 — Sifat 2: HTML Awal Belum Berisi Datanya

**Durasi:** ± 80 detik

**Script:**
"**Sifat kedua: HTML awal belum berisi datanya.** Ini yang kita bahas di video sebelumnya, sekarang kita lihat langsung lewat View Source halaman `/uji-produk`. Isinya cuma `Memuat...`. Kopi, Teh, dan Roti baru muncul setelah JavaScript jalan dan fetch selesai. Untuk halaman yang butuh SEO, ini kelemahannya."

### 🖥️ Live Coding — View Source

1. Buka `/uji-produk`, lalu View Source (`Cmd+Option+U` atau `Ctrl+U`). Cari `Memuat...`: **ada**. Cari `Kopi`: **tidak ada**. (Saya cek lewat skrip, hasilnya sama.)
2. Bandingkan dengan Inspect Element: di sana `Kopi`, `Teh`, `Roti` sudah ada, karena Inspect menampilkan DOM **setelah** JavaScript jalan.
3. Narasi tambahan: "Hasil ini juga berlaku untuk halaman SWR yang kita buat nanti: View Source `/uji-swr` pun hanya berisi `Memuat...`. Jadi memakai library **tidak** menyelesaikan masalah SEO."

**Cek manual:** `Memuat...` ada di View Source; `Kopi` tidak ada.

---

## Slide 10 — Sifat 3: Request Keluar dari Browser Pengguna

**Durasi:** ± 80 detik

**Script:**
"**Sifat ketiga: request keluar dari browser pengguna.** Tiga konsekuensinya.

Satu, **bisa dilihat siapa saja**. Setiap request muncul di tab Network browser, lengkap dengan URL dan responsnya. Dua, **kena aturan CORS**. Kalau memanggil API di domain lain, server API itu harus mengizinkan domain kita. Tiga, **jangan taruh secret di sini**. API key di kode client bisa dibaca siapa saja. Hanya variabel berawalan `NEXT_PUBLIC_` yang sampai ke browser, dan itu pun terbaca publik."

### 🖥️ Live Coding — lihat di tab Network

1. Buka `/uji-produk`, buka DevTools → tab **Network**, muat ulang.
2. Cari request `produk` (filter `Fetch/XHR`). Klik: terlihat URL `/api/produk`, status `200`, dan isi JSON `Kopi`, `Teh`, `Roti`. (Di alat bantu saya, request `GET /api/produk` dengan status 200 memang tercatat.)
3. Narasi: "Siapa pun yang membuka DevTools bisa melihat ini. Makanya data rahasia dan API key tidak boleh lewat sini. Bukti soal secret ada di video sebelumnya: nilai variabel tanpa `NEXT_PUBLIC_` tidak ikut ke file JavaScript."

**Cek manual:** request `/api/produk` terlihat di tab Network dengan status 200.

---

## Slide 11 — Sifat 4 dan 5: Semua Diurus Sendiri, Tanpa Cache

**Durasi:** ± 100 detik

**Script:**
"**Sifat keempat: semua diurus sendiri.** State data, loading, dan error ditulis ulang di tiap komponen. Cek `res.ok` supaya status gagal terdeteksi. Pembatalan request juga tugas kita.

**Sifat kelima: tanpa cache bawaan.** Diuji di Next.js 16: pindah halaman lalu kembali, request dikirim lagi. Dua komponen butuh data yang sama, jadi dua request. Dan pengguna melihat 'Memuat' lagi setiap kali. Kita buktikan sekarang."

### 🖥️ Live Coding — pindah halaman lalu kembali

1. Buat `app/uji-nav/page.tsx` (halaman peluncur dengan dua tautan `Link`):
   ```tsx
   import Link from "next/link"

   export default function Page() {
     return (
       <div>
         <Link id="ke-produk" href="/uji-produk">produk</Link>
         <Link id="ke-swr" href="/uji-swr">swr</Link>
       </div>
     )
   }
   ```
2. Buka `/api/produk?reset=1` (mengosongkan penghitung), lalu buka `/uji-nav`.
3. Klik **produk**, tunggu data tampil, tekan tombol **Back**, klik **produk** lagi.
4. Hasil yang saya amati:
   - Kunjungan kedua: layar kembali menampilkan `Memuat...` lebih dulu, tidak langsung menampilkan data lama.
   - Penghitung API (`/api/produk?hitung=1`) naik dari **1** menjadi **2**. Artinya request dikirim lagi.
5. Narasi: "Datanya sama persis, tapi kita bayar request dan menunggu lagi. Itulah 'tanpa cache'."

**Cek manual:** `Memuat...` muncul lagi di kunjungan kedua dan penghitung bertambah. (Navigasi harus lewat `Link` + Back, bukan memuat ulang halaman, supaya benar-benar berpindah halaman di sisi client.)

---

## Slide 12 — Sifat 6: Rawan Request Ganda dan Balapan

**Durasi:** ± 90 detik

**Script:**
"**Sifat keenam: rawan request ganda dan balapan.** Dua masalah yang diselesaikan oleh satu mekanisme: cleanup dengan `AbortController`.

Pertama, **Strict Mode** di development: effect dijalankan dua kali, jadi fetch bisa terkirim dua kali. Di production hanya sekali. Request pertama sebaiknya dibatalkan. Kedua, **race condition**: pengguna pindah halaman sebelum respons tiba, komponen sudah hilang tapi state tetap diubah, atau respons lama datang belakangan dan menimpa respons baru."

### 🖥️ Live Coding — hitung berapa kali effect jalan

1. Buat `app/uji-efek/page.tsx`:
   ```tsx
   'use client'
   import { useEffect } from 'react'

   export default function Page() {
     const w = (typeof window !== 'undefined' ? window : {}) as { __render?: number; __efek?: number; __cleanup?: number }
     if (typeof window !== 'undefined') w.__render = (w.__render ?? 0) + 1

     useEffect(() => {
       w.__efek = (w.__efek ?? 0) + 1
       fetch('/api/produk?efek=1')
       return () => { w.__cleanup = (w.__cleanup ?? 0) + 1 }
     }, [])
     return <p>efek</p>
   }
   ```
2. **Muat langsung** `/uji-efek` lalu di Console ketik `({ render: window.__render, efek: window.__efek, cleanup: window.__cleanup })`. Hasil yang saya amati di project ini (Next.js 16.2.10, React 19.2.4): `render: 2`, `efek: 1`, `cleanup: undefined`. Jadi Strict Mode **aktif** (render dua kali), tapi effect **hanya jalan sekali** saat halaman dimuat langsung.
3. Sekarang pindah lewat `Link`: tambahkan `<Link id="ke-efek" href="/uji-efek">efek</Link>` di `app/uji-nav/page.tsx`, buka `/uji-nav`, klik tautannya. Ketik lagi perintah di Console. Hasil yang saya amati: `efek: 2`, `cleanup: 1`, dan **dua** request `efek=1`. Di sinilah effect jalan, dibersihkan, lalu jalan lagi.
4. Narasi jujur: "Jadi 'effect jalan dua kali' di development itu **tidak selalu** terjadi. Di project kita, itu muncul waktu pindah halaman lewat `Link`, bukan waktu halaman dimuat langsung. Kalau di tempat lain beda, itu wajar, intinya tetap: **siapkan cleanup**."
5. Yang **tidak** saya uji: klaim 'di production hanya sekali' dan skenario race condition. Keduanya disampaikan sebagai penjelasan konsep.

**Cek manual:** muat langsung → `efek: 1`; pindah lewat `Link` → `efek: 2`, `cleanup: 1`.

---

## Slide 13 — Kode: Membatalkan Request dengan AbortController

**Durasi:** ± 70 detik

**Script:**
"Solusinya tiga langkah. Buat `controller`, kirim `signal`-nya ke `fetch`, dan panggil `controller.abort()` di **cleanup function**, yaitu fungsi yang dikembalikan oleh effect. Cleanup ini jalan saat komponen hilang atau effect diulang."

### 🖥️ Live Coding — tambahkan `AbortController`

Ubah `useEffect` di `app/uji-produk/page.tsx` menjadi:
```tsx
useEffect(() => {
  const controller = new AbortController()

  async function ambilData() {
    // kirim signal ke fetch
    const res = await fetch('/api/produk', { signal: controller.signal })
    // ... (try/catch/finally di slide berikutnya)
  }
  ambilData()

  // cleanup: jalan saat komponen hilang atau effect diulang
  return () => controller.abort()
}, [])
```

---

## Slide 14 — Kode: Menangani Request yang Dibatalkan

**Durasi:** ± 80 detik

**Script:**
"Request yang dibatalkan melempar `AbortError`. Itu **bukan kegagalan**, jadi jangan tampilkan sebagai pesan error. Di `catch`, kita abaikan kalau namanya `AbortError`. Dan di `finally`, jangan ubah state kalau sudah dibatalkan."

### 🖥️ Live Coding — versi final

Isi lengkap `app/uji-produk/page.tsx` (versi final yang saya uji):
```tsx
'use client'
import { useEffect, useState } from 'react'

type Produk = { id: number; title: string }

export default function Page() {
  const [produk, setProduk] = useState<Produk[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function ambilData() {
      try {
        // kirim signal ke fetch
        const res = await fetch('/api/produk', { signal: controller.signal })
        if (!res.ok) throw new Error('Gagal mengambil data')
        setProduk(await res.json())
      } catch (e) {
        // dibatalkan itu normal, abaikan
        if (e instanceof Error && e.name !== 'AbortError') setError(e.message)
      } finally {
        // jangan ubah state kalau sudah dibatalkan
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    ambilData()

    // cleanup: jalan saat komponen hilang atau effect diulang
    return () => controller.abort()
  }, [])

  if (loading) return <p>Memuat...</p>
  if (error) return <p>Error: {error}</p>

  return (
    <ul>
      {produk.map((p) => (
        <li key={p.id}>{p.title}</li>
      ))}
    </ul>
  )
}
```
1. Cek tipe: `bunx tsc --noEmit --incremental false` → bersih.
2. Buka `/uji-nav`, klik **produk**. Hasil yang saya amati: tampil `Memuat...` lalu `Kopi`, `Teh`, `Roti`, **tanpa** pesan error palsu walau Strict Mode membatalkan request pertama. Di sisi server, penghitung hanya mencatat **1** request (request yang dibatalkan tidak sampai tercatat).
3. Salinan `app/uji-gagal/page.tsx` (URL `/api/produk-error`) tetap menampilkan `Error: Gagal mengambil data`: error **sungguhan** tidak tertelan oleh pengecualian `AbortError`.

**Cek manual:** daftar tampil tanpa pesan error; `/uji-gagal` tetap menampilkan error sungguhan.

---

## Slide 15 — Capek Menulis Semua Itu? Pakai Library

**Durasi:** ± 70 detik

**Script:**
"Capek nulis semua itu? Wajar. Dokumentasi Next.js merekomendasikan **SWR atau TanStack Query** untuk fetch di Client Component. Empat keuntungannya. **Cache bersama**: data disimpan per key, jadi pindah halaman nggak selalu mulai dari nol. **Request nggak dobel**: dua komponen dengan key yang sama berbagi satu request. **Revalidate otomatis**: bisa refresh saat tab kembali aktif atau berkala. Dan **loading dan error siap pakai**, nggak perlu tiga `useState` manual lagi."

---

## Slide 16 — Apa Itu SWR?

**Durasi:** ± 70 detik

**Script:**
"SWR itu library kecil berupa hook React untuk fetch data di client, dibuat oleh tim Vercel, pembuat Next.js. Namanya singkatan **Stale-While-Revalidate**. *Stale* artinya data lama yang masih tersimpan di cache. *Revalidate* artinya ambil data terbaru di belakang layar.

Cara kerjanya: tampilkan data dari cache seketika, fetch ulang di belakang layar, dan kalau data baru tiba, tampilan diperbarui. Hasilnya buat pengguna: pindah halaman lalu kembali nggak lagi mulai dari 'Memuat', karena data lama langsung tampil."

---

## Slide 17 — Kode: Contoh dengan SWR

**Durasi:** ± 90 detik

**Script:**
"Setelah install SWR, hasilnya sama, kodenya jauh lebih pendek. Tiga state manual dan seluruh `useEffect` diganti satu baris `useSWR`."

### 🖥️ Live Coding — versi SWR dan bukti cache

1. Pasang: `bun add swr`
2. `app/uji-swr/page.tsx`:
   ```tsx
   'use client'
   import useSWR from 'swr'
   type Produk = { id: number; title: string }

   const fetcher = (url: string): Promise<Produk[]> =>
     fetch(url).then((r) => {
       if (!r.ok) throw new Error('Gagal mengambil data')
       return r.json()
     })
   export default function Page() {
     const { data, error, isLoading } = useSWR('/api/produk', fetcher)
     if (isLoading) return <p>Memuat...</p>
     if (error) return <p>Error: {error.message}</p>
     return <ul>{data?.map((p) => <li key={p.id}>{p.title}</li>)}</ul>
   }
   ```
3. Cek tipe: `bunx tsc --noEmit --incremental false` → bersih.
4. Ulangi uji Slide 11, kali ini dengan tautan **swr** di `/uji-nav`: buka `/api/produk?reset=1`, buka `/uji-nav`, klik **swr**, tunggu, tekan **Back**, klik **swr** lagi.
5. Hasil yang saya amati:
   - Kunjungan pertama: `Memuat...` lalu `Kopi`, `Teh`, `Roti` (penghitung API: 1).
   - Kunjungan kedua: **data langsung tampil**, tanpa `Memuat...`. Dan penghitung naik menjadi **2**, tanda SWR tetap memperbarui data di belakang layar.
6. Narasi: "Itu persis *stale-while-revalidate*: tampil dulu dari cache, perbarui kemudian. Bandingkan dengan halaman biasa tadi yang selalu mulai dari 'Memuat'."

**Cek manual:** kunjungan kedua ke `/uji-swr` langsung menampilkan data, dan penghitung API bertambah.

---

## Slide 18 — Membaca useSWR: Key, Fetcher, dan Hasilnya

**Durasi:** ± 70 detik

**Script:**
"Tiga bagian dari satu baris `useSWR('/api/produk', fetcher)`.

**Key**, yaitu `'/api/produk'`: nama pengenal data di cache. Komponen dengan key yang sama berbagi data dan request. Biasanya berupa URL-nya. **Fetcher**: fungsi yang kita tulis sendiri. SWR memanggilnya dengan key sebagai argumen dan memakai hasilnya sebagai `data`. Perhatikan, pengecekan `res.ok` tetap tugas **kita**, di dalam fetcher. Dan **hasil**: `data`, `error`, `isLoading`, pengganti tiga `useState` manual tadi. SWR yang mengatur isinya."

### 🖥️ Live Coding — hover tipe

1. Di `app/uji-swr/page.tsx`, arahkan kursor ke `data`: tipenya `Produk[] | undefined`. Itu sebabnya ditulis `data?.map(...)`.
2. Arahkan ke `error`: tipenya `any`. (Aturan "hindari `any`" dari Bab 7 tetap berlaku untuk kode kita sendiri; ini tipe dari library.)

**Cek manual:** hover `data` menampilkan `Produk[] | undefined`.

---

## Slide 19 — Kapan Fetch di Client Masuk Akal?

**Durasi:** ± 90 detik

**Script:**
"Pegangan terakhir: **kalau data dibutuhkan sejak halaman pertama tampil, jangan fetch di client.**

*Cocok di Client*: data yang dibutuhkan **setelah interaksi**: pencarian dan autocomplete, load more dan filter dinamis, serta data yang terus diperbarui seperti polling. *Lebih baik di Server*: data awal halaman, yaitu konten utama, halaman yang butuh SEO, dan data yang butuh secret atau database.

Dan ada **opsi ketiga dari dokumentasi**: ambil data di Server, oper `Promise` ke Client Component, lalu baca dengan `use()`. Itu kita bahas di video Suspense dan Streaming. Sampai jumpa!"

### 🖥️ Live Coding — tunjukkan rujukan dokumentasi

1. Buka `node_modules/next/dist/docs/01-app/01-getting-started/06-fetching-data.md`, bagian **Client Components**. Di sana tertulis dua cara: React `use` API, atau library komunitas seperti SWR dan React Query.
2. **Pembersihan** (lihat bagian Persiapan):
   ```bash
   rm -rf app/api app/uji-sederhana app/uji-produk app/uji-gagal app/uji-swr app/uji-nav app/uji-efek
   rm -rf .next
   bunx next typegen
   bunx tsc --noEmit --incremental false
   bun remove swr
   ```

**Cek manual:** `git status` tidak menampilkan folder `uji-*` maupun perubahan `package.json`/`bun.lock` dari demo; `tsc` bersih.

---

## Rekap Durasi

| Slide | Durasi |
|---|---|
| 1 | 0:20 |
| 2 | 0:50 |
| 3 | 1:20 |
| 4 | 1:10 |
| 5 | 1:00 |
| 6 | 1:20 |
| 7 | 1:10 |
| 8 | 1:10 |
| 9 | 1:20 |
| 10 | 1:20 |
| 11 | 1:40 |
| 12 | 1:30 |
| 13 | 1:10 |
| 14 | 1:20 |
| 15 | 1:10 |
| 16 | 1:10 |
| 17 | 1:30 |
| 18 | 1:10 |
| 19 | 1:30 |
| **Total** | **± 23:10** (potong live coding Slide 4, 12, dan 14 serta kunjungan kedua di Slide 11 untuk mendekati 15 menit) |
