# Script Ngajar — M7 Sub1: Mengapa TypeScript Menjadi Standar Wajib

**Total durasi:** ± 7 menit (10 slide)
**Sumber:** `script/M7_Sub1_Mengapa_TypeScript.pptx.pdf`

## Jawaban singkat: bisa jalanin JavaScript di project ini?

**Bisa.** Dua alasan:

1. `tsconfig.json` sudah punya `"allowJs": true` → file `.js` boleh hidup berdampingan dengan `.ts/.tsx`.
2. Ada runtime di laptop: `node` (v26) dan `bun` (1.3). Jadi file `.js` tinggal dijalankan langsung: `node contoh.js`.

File `.ts` juga bisa langsung jalan dengan **bun**: `bun contoh.ts` (bun menghapus tipe otomatis, tanpa cek tipe).
Pengecekan tipe tetap tugasnya `bunx tsc --noEmit`.

> ⚠️ Catatan penting buat demo: `tsconfig.json` meng-include `**/*.ts`. Jadi `contoh.ts` yang sengaja error **akan ikut dicek `tsc` dan menggagalkan `next build`**. Itu pas banget buat Slide 8, tapi **hapus file demo setelah selesai**.
> Error bawaan yang bukan dari demo: `app/components/ThemeToggle.tsx ... Cannot find module 'lucide-react'` (dependency belum terinstall). Abaikan, jangan dianggap hasil demo.

---

## Slide 1 — Mengapa TypeScript Menjadi Standar Wajib

**Durasi:** ± 20 detik

**Script:**
"Halo gaes, selamat datang di Bab 7: TypeScript dalam Next.js. Di sub-bab pertama ini kita jawab satu pertanyaan besar: *kenapa sih TypeScript itu dianggap wajib?* Jawabannya ada di kalimat di slide ini: ini perbedaan antara bug yang **kamu** temukan, dan bug yang ditemukan **user**. Jelas lebih enak yang pertama, kan? Yuk kita mulai."

---

## Slide 2 — Kita Sudah Memakai TypeScript

**Durasi:** ± 40 detik

**Script:**
"Sebenarnya, dari bab pertama kita sudah pakai TypeScript lho, cuma belum dibahas serius. Coba buka project kita: ada `app/page.tsx`, `app/layout.tsx`, ada `tsconfig.json`, dan kalian pasti pernah lihat garis merah di editor pas ada salah. Itu semua TypeScript.

Nah, di bab ini kita berhenti sebentar buat paham apa yang sebenarnya dikerjakan TypeScript. Nanti kita lanjut ke `tsconfig.json`, tipe dasar, props, alias tipe, dan tipe `PageProps` serta `searchParams`. Tapi hari ini fokusnya satu: *kenapa*."

### 🖥️ Live Coding — tunjukin yang sudah ada

1. Buka file `app/type/index.ts` di editor. Tunjuk: ini file TypeScript biasa, isinya `interface BlogPost`, `type PostPreview`, dan `ActionResult<T>`. "Ini nanti kita bedah di sub-bab berikutnya, sekarang cukup tahu bahwa ini ada."
2. Buka `tsconfig.json`, tunjuk baris `"strict": true` dan `"allowJs": true`. "Dua baris ini yang bikin TypeScript galak, dan bikin file `.js` tetap boleh ada."

**Cek manual:** file `.ts`/`.tsx` terlihat di sidebar, `tsconfig.json` ada di root.

---

## Slide 3 — Apa itu TypeScript?

**Durasi:** ± 50 detik

**Script:**
"TypeScript itu apa? Gampangnya: JavaScript yang ditambah sistem tipe. Sistem yang ngecek kode kita *sebelum* kode dijalankan. Ada tiga hal yang perlu kalian ingat.

Satu, dia **static type checker**. Dia ngecek tipe data, string, number, dan seterusnya, pas kita nulis kode, bukan pas aplikasi jalan.

Dua, **tipe dihapus saat compile**. Hasil akhirnya tetap JavaScript biasa. Browser nggak tahu apa-apa soal TypeScript.

Tiga, **gratis di runtime**. Aplikasi nggak jadi lebih lambat. Manfaatnya semua ada di editor dan saat build."

### 🖥️ Live Coding — buktiin "tipe dihapus"

1. Buat folder demo dan satu file:
   ```bash
   mkdir latihan
   ```
   `latihan/halo.ts`:
   ```ts
   const nama: string = "Rizki";
   console.log(`Halo, ${nama}`);
   ```
2. Jalankan langsung dengan bun:
   ```bash
   bun latihan/halo.ts
   ```
   Output: `Halo, Rizki`. "Lihat, `: string` nggak ikut kebawa. Tipenya cuma buat kita dan editor."

**Cek manual:** output `Halo, Rizki` muncul tanpa error.

---

## Slide 4 — Mendefinisikan Tipe dengan Titik Dua ":"

**Durasi:** ± 40 detik

**Script:**
"Cara nulis tipe itu gampang banget: nama, titik dua, lalu tipenya. `namaVariabel: tipe`. Sama untuk parameter: `namaParameter: tipe`. Dan untuk return value fungsi, titik duanya ditaruh setelah kurung: `fungsi(): tipeKembalian`.

Tipe dasarnya ada tiga: `string`, `number`, `boolean`. Perhatikan: **huruf kecil semua**. Jangan `String` atau `Number` dengan huruf besar, itu hal lain. Dan tipe ini bisa dipasang di variabel, parameter, dan return value. Nanti di sub-bab selanjutnya kita bahas lebih dalam, termasuk objek dan props."

### 🖥️ Live Coding — tiga tempat memasang tipe

Tambahkan ke `latihan/halo.ts`:

```ts
const umur: number = 25;          // variabel
const aktif: boolean = true;      // variabel

function sapa(nama: string): string {   // parameter + return
  return `Halo, ${nama}`;
}

console.log(sapa("Rizki"), umur, aktif);
```

Tunjuk tiga posisi titik dua: variabel, parameter `nama: string`, dan return `): string`.

**Cek manual:** `bun latihan/halo.ts` → `Halo, Rizki 25 true`.

---

## Slide 5 — JavaScript Tanpa Tipe: Apa Risikonya?

**Durasi:** ± 50 detik

**Script:**
"Sekarang kita lihat masalahnya. JavaScript itu *nggak peduli* tipe. Salah baru ketahuan pas dijalankan, atau malah nggak ketahuan sama sekali.

Ada dua contoh klasik. Pertama, **typo di atribut objek**. Kalau kita salah ketik `user.nmae`, JavaScript nggak error. Dia diam-diam kasih `undefined`, dan bug-nya muncul jauh di bagian lain aplikasi. Kedua, **salah tipe di parameter**. Fungsi bisa dipanggil pakai tipe apa aja. `"5" + 3` hasilnya `"53"`, bukan 8. Dan kalau lupa isi argumen, hasilnya `NaN`."

---

## Slide 6 — Contoh: Bug Diam-diam di JavaScript

**Durasi:** ± 60 detik

**Script:**
"Yuk kita buktiin langsung. Dan buat yang nanya, *'bisa nggak sih jalanin JavaScript di project Next.js ini?'* Bisa! `tsconfig.json` kita punya `allowJs: true`, dan di laptop ada `node`. Jadi tinggal jalanin."

### 🖥️ Live Coding — jalankan `contoh.js`

1. Buat `latihan/contoh.js`:
   ```js
   const user = { name: "Rizki", age: 25 };

   console.log(user.nmae);               // undefined (typo, tanpa error)

   function tambah(a, b) { return a + b; }

   console.log(tambah(5, 3));   // 8
   console.log(tambah("5", 3)); // "53" — bukan 8!
   console.log(tambah(5));      // NaN

   console.log(user.nmae.toUpperCase()); // crash saat dijalankan
   ```
   (Baris `toUpperCase` sengaja ditaruh paling bawah supaya baris lain sempat tercetak sebelum crash.)
2. Jalankan:
   ```bash
   node latihan/contoh.js
   ```
3. Output yang akan muncul:
   ```
   undefined
   8
   53
   NaN

   TypeError: Cannot read properties of undefined (reading 'toUpperCase')
   ```
4. Narasi: "Lihat: `undefined`, `53`, `NaN`. Nggak ada satu pun peringatan di editor. Baru di baris terakhir program crash. Bayangin kalau ini ada di halaman checkout."

**Cek manual:** editor tidak menampilkan garis merah; terminal menampilkan `53` dan `NaN`, lalu `TypeError`.

---

## Slide 7 — Contoh: Versi TypeScript

**Durasi:** ± 60 detik

**Script:**
"Sekarang kesalahan yang sama, tapi di file `.ts`. Perhatikan bedanya: garis merah langsung muncul di editor, *sebelum* kita jalanin apa-apa."

### 🖥️ Live Coding — `contoh.ts` dan `tsc`

1. Buat `latihan/contoh.ts`:
   ```ts
   const user = { name: "Rizki", age: 25 };
   user.nmae;
   // Error: Property 'nmae' does not exist on type
   // '{ name: string; age: number; }'.

   function tambah(a: number, b: number): number {
     return a + b;
   }
   tambah("5", 3);
   // Error: Argument of type 'string' is not assignable
   // to parameter of type 'number'.
   tambah(5);
   // Error: Expected 2 arguments, but got 1.
   ```
2. Tunjukkan garis merah di editor pada `nmae`, `"5"`, dan `tambah(5)`. Arahkan kursor ke garis merah untuk menampilkan pesan error.
3. Cek lewat terminal, sama seperti yang dilakukan build:
   ```bash
   bunx tsc --noEmit
   ```
   Output (error dari demo):
   ```
   latihan/contoh.ts(2,6): error TS2339: Property 'nmae' does not exist on type '{ name: string; age: number; }'.
   latihan/contoh.ts(6,8): error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.
   latihan/contoh.ts(7,1): error TS2554: Expected 2 arguments, but got 1.
   ```
   (Mungkin ada satu baris tambahan soal `lucide-react` di `ThemeToggle.tsx`. Itu bawaan project, bukan dari demo.)
4. Poin penting: "Perhatikan, `bun latihan/contoh.ts` tetap bisa jalan tanpa protes, karena bun cuma menghapus tipe, nggak mengecek. Yang mengecek itu `tsc` dan editor."

**Cek manual:** 3 error `TS2339`, `TS2345`, `TS2554` muncul, masing-masing menunjuk baris yang tepat.

---

## Slide 8 — Intinya: Error Pindah ke Awal

**Durasi:** ± 40 detik

**Script:**
"Jadi intinya, TypeScript memindahkan error dari belakang ke depan. Di JavaScript, error muncul di browser atau server, bisa lolos sampai ke pengguna, dan nyari penyebabnya harus baca ulang banyak kode. Di TypeScript, garis merah langsung di editor, pesannya nunjuk baris yang salah, dan kita perbaiki sebelum aplikasi dijalankan."

### 🖥️ Live Coding — error menggagalkan build

1. Dengan `latihan/contoh.ts` masih ada, jalankan:
   ```bash
   bun run build
   ```
2. Hasilnya: build berhenti di tahap type-check. Menggagalkan build berarti kode salah tidak bisa sampai ke production.
   > Kalau build sudah gagal duluan karena `lucide-react`, itu masalah bawaan project. Jalankan `bun add lucide-react` dulu supaya yang tersisa hanya error dari demo.
3. **Bersihkan:**
   ```bash
   rm -rf latihan
   ```

**Cek manual:** `bunx tsc --noEmit` tidak lagi menampilkan error dari `latihan/`.

---

## Slide 9 — Kenapa Jadi Standar di Project Modern?

**Durasi:** ± 45 detik

**Script:**
"Tiga alasan kenapa TypeScript jadi standar. Satu, **autocomplete dan refactor lebih aman**: editor tahu atribut apa aja yang ada di objek, jadi nggak perlu hafal. Dua, **tipe yang error akan menggagalkan `next build`**: bug tipe tertahan sebelum production, dan barusan kita lihat sendiri. Tiga, **dokumentasi lebih hidup**: tipe menjelaskan bentuk data tanpa kita harus baca seluruh implementasi."

### 🖥️ Live Coding — autocomplete & dokumentasi hidup (opsional, 20 detik)

Di file `.tsx` mana saja, ketik sementara:

```ts
import type { BlogPost } from "@/app/type";

const post = {} as BlogPost;
post.   // ← berhenti di titik, tunjukkan daftar autocomplete
```

Editor menampilkan `id`, `title`, `slug`, `content`, `published`, `viewCount`, `createdAt`. "Nggak buka file lain, bentuk datanya sudah kelihatan." Hapus lagi setelah demo.

**Cek manual:** daftar autocomplete muncul saat mengetik `post.`.

---

## Slide 10 — TypeScript juga punya batas

**Durasi:** ± 45 detik

**Script:**
"Terakhir, jangan kebablasan: TypeScript juga punya batas. Tipe itu cuma ada saat development. Setelah di-compile, tipe dihapus. Artinya respons API, input form, dan isi database **nggak otomatis dicek** TypeScript pas aplikasi jalan. Kalau API mengirim `age: "dua puluh"` padahal tipenya `number`, TypeScript nggak tahu.

Makanya kita juga pakai **Zod**. TypeScript menjaga kode kita konsisten, Zod menjaga data yang masuk. Keduanya saling melengkapi. Sampai jumpa di sub-bab berikutnya!"

*(Zod belum terinstall di project ini. Cukup disebut sebagai pengantar. Instalasi dan pemakaian dibahas di bab validasi.)*

---

## Rekap Durasi

| Slide | Durasi |
|---|---|
| 1 | 0:20 |
| 2 | 0:40 |
| 3 | 0:50 |
| 4 | 0:40 |
| 5 | 0:50 |
| 6 | 1:00 |
| 7 | 1:00 |
| 8 | 0:40 |
| 9 | 0:45 |
| 10 | 0:45 |
| **Total** | **± 7:30** (potong demo opsional Slide 9 & `bun run build` Slide 8 kalau molor) |
