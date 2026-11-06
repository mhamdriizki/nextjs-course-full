# Script Ngajar — M7 Sub2: tsconfig.json — Aturan Main Compiler TypeScript

**Total durasi:** ± 8,5 menit penuh, ± 7 menit kalau live coding yang cuma menunjuk file dilewati (10 slide)
**Sumber:** `script/M7_Sub2_tsconfig_json.pptx.pdf`

## Persiapan sebelum rekam

- `tsconfig.json` di project ini **sama persis** dengan yang ada di slide. Tinggal dibuka dan ditunjuk.
- Semua demo di bawah memakai folder sementara `latihan/` di root project. **Hapus di akhir**: `rm -rf latihan`. Folder ini ikut dicek `tsc` karena `include` memuat `**/*.ts`, jadi kalau lupa dihapus, `bun run build` bisa gagal.
- Cek tipe pakai `bunx tsc --noEmit` (bukan `bun file.ts`, karena bun cuma menghapus tipe tanpa mengecek).
- `next-env.d.ts` dan `*.tsbuildinfo` sudah ada di `.gitignore` project ini. Cocok dengan poin Slide 10.
- Kondisi terakhir yang saya cek: `bunx tsc --noEmit` bersih. Tapi `bun run build` masih gagal di tahap prerender `/dashboard/settings` (`default.tsx` di `app/dashboard/@recent` dan `@stats` kosong). Ini sudah ada sebelum materi ini dan tidak ada hubungannya dengan `tsconfig.json`. Jadi jangan sebut "build lolos" di video sebelum itu diperbaiki.

---

## Slide 1 — tsconfig.json: Aturan Main Compiler TypeScript

**Durasi:** ± 20 detik

**Script:**
"Halo gaes, lanjut ke sub-bab kedua Bab 7. Tadi kita sudah paham *kenapa* TypeScript. Sekarang kita kenalan sama file yang ngatur cara kerjanya: `tsconfig.json`. Anggap aja ini buku aturan main buat compiler. Kita bedah satu per satu opsi bawaan `create-next-app`, biar nggak ada lagi file yang cuma kita lewatin tanpa tahu isinya."

---

## Slide 2 — Apa itu tsconfig.json?

**Durasi:** ± 50 detik

**Script:**
"Jadi `tsconfig.json` itu file konfigurasi di root project yang ngasih tahu TypeScript, *gimana kode kita harus dicek*. Ada tiga hal yang perlu kalian ingat.

Pertama, file ini **dibaca tiga sistem**: editor, buat garis merah dan autocomplete; perintah `tsc`; dan proses `next build`. Satu file, tiga konsumen.

Kedua, file ini **dibuat otomatis oleh Next.js**, entah dari `create-next-app`, atau pas kita ganti file jadi `.ts` atau `.tsx` lalu jalanin `next dev`.

Ketiga, isinya punya **tiga bagian utama**: `compilerOptions` buat aturan pengecekan, lalu `include` dan `exclude` buat nentuin file mana yang dicek."

### 🖥️ Live Coding — lihat tiga bagian itu di project

1. Buka `tsconfig.json` di root. Tunjuk tiga blok: `compilerOptions`, `include`, `exclude`.
2. Buktikan file ini dibaca `tsc`:
   ```bash
   bunx tsc --showConfig
   ```
   Hasilnya adalah konfigurasi final yang dibaca TypeScript, lengkap dengan daftar `files` yang akan dicek.

**Cek manual:** output `--showConfig` menampilkan `"strict": true` dan daftar file `.ts/.tsx` project.

---

## Slide 3 — tsconfig.json bawaan create-next-app

**Durasi:** ± 30 detik

**Script:**
"Ini isi lengkapnya, dibagi dua kolom biar muat. Nggak perlu dihafal. Yang penting: ini **persis sama** dengan yang ada di project kita. Coba buka `tsconfig.json` kalian, dan bandingkan. Di slide-slide berikutnya kita kelompokkan opsinya: ada yang soal pengecekan, ada soal bahasa dan modul, dan ada yang khusus Next.js."

### 🖥️ Live Coding — samakan dengan slide

1. Buka `tsconfig.json`, scroll pelan dari atas ke bawah sambil cocokkan dengan slide.

**Cek manual:** isinya sama, termasuk `"paths": { "@/*": ["./*"] }` dan `"include"` yang memuat `.next/dev/types/**/*.ts`.

---

## Slide 4 — Opsi Pengecekan pada tsconfig

**Durasi:** ± 60 detik

**Script:**
"Opsi pertama: **`strict: true`**. Ini bukan satu aturan, tapi *paket* pengecekan ketat, isinya `noImplicitAny`, `strictNullChecks`, dan beberapa lagi. Inilah yang bikin tipe benar-benar berguna. Kalau dimatiin, TypeScript jadi 'baik hati' tapi nggak menolong.

Kedua, **`skipLibCheck: true`**. TypeScript nggak ngecek file deklarasi `.d.ts` di `node_modules`. Jadi lebih cepat, dan kode *kita* sendiri tetap dicek.

Ketiga, **`noEmit: true`**. TypeScript cuma ngecek, nggak bikin file JavaScript. Kompilasinya dikerjain Next.js.

Keempat, **`isolatedModules: true`**. Memastikan tiap file aman diproses sendiri-sendiri oleh transpiler."

### 🖥️ Live Coding — buktiin `noEmit`

1. Jalankan:
   ```bash
   bunx tsc --noEmit
   ls -a | grep -E "\.js$"
   ```
2. "Lihat: nggak ada file `.js` baru bermunculan di folder. Itu efek `noEmit`."

**Cek manual:** `tsc --noEmit` selesai tanpa error dan tanpa file `.js` baru di root.

---

## Slide 5 — Efek strict

**Durasi:** ± 70 detik

**Script:**
"Sekarang kita lihat langsung bedanya. Ada dua kesalahan yang *cuma* ketangkap kalau `strict` aktif. Kalau `strict` mati, dua-duanya lolos tanpa peringatan."

### 🖥️ Live Coding — `strict` nyala vs mati

1. Buat folder dan file demo:
   ```bash
   mkdir latihan
   ```
   `latihan/contoh-strict.ts`:
   ```ts
   function sapa(nama) {
     return nama;
   }
   // Error: Parameter 'nama' implicitly has an 'any' type.

   const el: string | null = null;
   el.length;
   // Error: 'el' is possibly 'null'.
   ```
2. Tunjukkan garis merah di `nama` dan `el`.
3. Jalankan dengan `strict` **aktif** (bawaan project):
   ```bash
   bunx tsc --noEmit
   ```
   Output:
   ```
   latihan/contoh-strict.ts(1,15): error TS7006: Parameter 'nama' implicitly has an 'any' type.
   latihan/contoh-strict.ts(6,1): error TS18047: 'el' is possibly 'null'.
   ```
4. Jalankan lagi dengan `strict` **dimatikan lewat flag**, tanpa mengedit `tsconfig.json`:
   ```bash
   bunx tsc --noEmit --strict false
   ```
   Output: **kosong, tidak ada error.**
5. Narasi: "Dua baris itu tetap salah. `el.length` tetap bakal crash pas dijalankan, karena `el` itu `null`. Strict mati cuma bikin TypeScript tutup mata."

**Cek manual:** langkah 3 menampilkan `TS7006` dan `TS18047`; langkah 4 tidak menampilkan apa-apa.

---

## Slide 6 — Opsi Bahasa & Modul pada tsconfig

**Durasi:** ± 60 detik

**Script:**
"Kelompok kedua: opsi bahasa dan modul. Lima poin.

Satu, **`target: ES2017`**, versi JavaScript yang jadi acuan fitur bahasa. Dua, **`lib: dom, dom.iterable, esnext`**, API apa saja yang dikenali: `document`, `window`, plus fitur JavaScript terbaru. Tiga, **`module: esnext`** bareng **`moduleResolution: bundler`**: import dicari seperti bundler, jadi boleh tanpa ekstensi file. Empat, **`esModuleInterop`, `resolveJsonModule`, `allowJs`**: kompatibilitas import, boleh import file `.json`, dan file `.js` boleh ada. Lima, **`jsx: react-jsx`**, JSX modern, jadi nggak perlu `import React` di setiap file."

---

## Slide 7 — Efek Opsi Bahasa & Modul

**Durasi:** ± 60 detik

**Script:**
"Tiga baris ini bisa jalan karena opsi di slide sebelumnya. Import tanpa ekstensi, import JSON, dan akses `document`. Mari kita buktikan, dan kita buktikan juga kebalikannya: apa yang terjadi kalau satu opsi dicabut."

### 🖥️ Live Coding — import tanpa ekstensi, JSON, dan `document`

1. Buat tiga file di `latihan/`:

   `latihan/utils.ts`:
   ```ts
   export function hitung(a: number, b: number): number {
     return a + b;
   }
   ```
   `latihan/settings.json`:
   ```json
   { "nama": "Rizki" }
   ```
   `latihan/contoh-modul.ts`:
   ```ts
   import { hitung } from "./utils";
   // tanpa ekstensi .ts → OK (moduleResolution: bundler)

   import settings from "./settings.json";
   // import file JSON → OK (resolveJsonModule)

   const judul = document.title;
   // akses document → OK (lib: dom)

   console.log(hitung(1, 2), settings.nama, judul);
   ```
2. Cek:
   ```bash
   bunx tsc --noEmit
   ```
   Tidak ada error dari `contoh-modul.ts` (error `contoh-strict.ts` dari Slide 5 masih muncul kalau filenya belum dihapus, abaikan).
3. Sekarang cabut `lib: dom` lewat flag:
   ```bash
   bunx tsc --noEmit --lib esnext
   ```
   Output baru:
   ```
   latihan/contoh-modul.ts(4,15): error TS2584: Cannot find name 'document'. Do you need to change your target library? Try changing the 'lib' compiler option to include 'dom'.
   ```
4. Narasi: "Nah, kelihatan kan. `document` dikenal *karena* ada `dom` di `lib`. Cabut, langsung merah."

**Cek manual:** langkah 2 tidak ada error untuk `contoh-modul.ts`; langkah 3 muncul `TS2584` di baris `document.title`.

---

## Slide 8 — Opsi Khusus Next.js

**Durasi:** ± 50 detik

**Script:**
"Kelompok ketiga: opsi yang khusus buat Next.js. Ada empat.

**`plugins: next`**, plugin buat editor yang ngecek `'use client'` dan pemakaian hooks. **`incremental: true`**, simpan hasil pengecekan sebelumnya supaya type check berikutnya lebih cepat. **`paths`**, alias import, `@/` menunjuk ke root project. Dan **`include` plus `exclude`**: `next-env.d.ts` dan `.next/types` itu isinya tipe yang digenerate Next.js, misalnya `PageProps`. Sedangkan `node_modules` dikecualikan."

### 🖥️ Live Coding — lihat hasil generate Next.js

1. Buka `next-env.d.ts` di root. Tunjuk komentar `This file should not be edited`.
2. Lihat file cache `incremental`:
   ```bash
   ls -la tsconfig.tsbuildinfo
   ```
   "Ini hasil `incremental: true`. File ini nggak di-commit karena sudah ada di `.gitignore`."
3. Tunjukkan di `.gitignore`: baris `next-env.d.ts` dan `*.tsbuildinfo`.

**Cek manual:** `tsconfig.tsbuildinfo` ada; `git check-ignore next-env.d.ts` menampilkan nama file tersebut.

---

## Slide 9 — Alias Import dengan paths

**Durasi:** ± 50 detik

**Script:**
"Satu baris `paths` ini nyelametin kita dari rantai `../../../` yang susah dibaca. Tanpa alias, kita harus ngitung ada berapa `../`, dan gampang keliru. Dengan alias, path-nya selalu dari root."

### 🖥️ Live Coding — alias vs path relatif

1. Buat `latihan/contoh-alias.tsx`. Di project ini komponen tombolnya ada di `components/ui/button.tsx` (bukan `components/button` seperti di slide):
   ```tsx
   // Tanpa alias — rawan keliru menghitung jumlah ../
   import { Button } from "../components/ui/button";

   // Dengan alias "@/*": ["./*"] — path selalu dari root
   import { Button as B2 } from "@/components/ui/button";

   export { Button, B2 };
   ```
2. Cek:
   ```bash
   bunx tsc --noEmit
   ```
   Tidak ada error: dua cara import menunjuk ke file yang sama.
3. Tunjuk bahwa project sudah pakai alias ini di mana-mana: buka `app/layout.tsx` dan `app/components/ThemeToggle.tsx`, lihat `import ... from "@/..."`.
4. **Bersihkan semua file demo:**
   ```bash
   rm -rf latihan
   ```

**Cek manual:** tidak ada error dari `contoh-alias.tsx`; setelah `rm -rf latihan`, `bunx tsc --noEmit` bersih lagi.

---

## Slide 10 — Kesalahan Umum Soal tsconfig.json

**Durasi:** ± 60 detik

**Script:**
"Terakhir, tiga kesalahan yang paling sering terjadi.

Satu, **mematikan `strict` karena error terlalu banyak**. Error-nya nggak hilang, cuma disembunyikan, dan bug-nya tetap ada di kode. Tadi kita sudah lihat sendiri di Slide 5. Perbaiki tipenya, jangan matikan pengecekannya.

Dua, **mengedit `next-env.d.ts` atau mengaktifkan `ignoreBuildErrors`**. `next-env.d.ts` itu digenerate Next.js dan akan ketimpa, jadi masukkan ke `.gitignore`, dan di project kita sudah. Sedangkan `ignoreBuildErrors: true` bikin build lolos *walaupun ada error tipe*. Ini berbahaya, karena bug tipe kabur sampai ke production.

Tiga, **editor belum berubah setelah `tsconfig.json` diedit**. Buka command palette, jalankan **'TypeScript: Restart TS Server'**. Dan untuk CI, cek error tipe pakai `tsc --noEmit` sebelum deploy.

Itu dia tsconfig.json. Sampai ketemu di sub-bab berikutnya, di mana kita masuk ke tipe dasar!"

### 🖥️ Live Coding — cek project aman dari kesalahan itu

1. Buka `next.config.ts`. Tunjuk: **tidak ada** `typescript: { ignoreBuildErrors: true }`. "Aman."
2. Buka `.gitignore`, tunjuk `next-env.d.ts`.
3. Jalankan:
   ```bash
   bunx tsc --noEmit
   ```
   "Ini yang dijalankan di CI sebelum deploy. Kosong berarti aman."

**Cek manual:** `grep ignoreBuildErrors next.config.ts` tidak mengeluarkan apa-apa.

---

## Rekap Durasi

| Slide | Durasi |
|---|---|
| 1 | 0:20 |
| 2 | 0:50 |
| 3 | 0:30 |
| 4 | 1:00 |
| 5 | 1:10 |
| 6 | 1:00 |
| 7 | 1:00 |
| 8 | 0:50 |
| 9 | 0:50 |
| 10 | 1:00 |
| **Total** | **± 8:30** (potong live coding Slide 3, 4, dan 6 yang cuma menunjuk file kalau perlu masuk 7 menit) |
