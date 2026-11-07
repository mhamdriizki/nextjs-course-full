# Script Ngajar — M7 Sub3: Tipe Dasar pada TypeScript

**Total durasi:** ± 11,5 menit penuh, ± 10 menit kalau live coding Slide 2 dan 7 dilewati (13 slide)
**Sumber:** `script/M7_Sub3_Tipe_Dasar.pptx.pdf`

## Persiapan sebelum rekam

- Semua demo memakai folder sementara `latihan/` di root project. **Hapus di akhir**: `rm -rf latihan`. Folder ini ikut dicek `tsc` (`include` memuat `**/*.ts`), jadi kalau lupa dihapus, `bun run build` bisa gagal.
- Cek tipe pakai `bunx tsc --noEmit`. Jalankan file dengan `bun latihan/<nama>.ts` (bun hanya menghapus tipe, tidak mengecek).
- **Wajib: tiap file demo diawali `export {};`**. Tanpa `import`/`export`, TypeScript menganggap file itu *script global*, jadi nama seperti `data`, `kota`, `nama`, atau `sapaAman` bentrok antar file (`Cannot redeclare block-scoped variable` / `Duplicate function implementation`). Ini sudah saya tes. Kalau kamu mau membahasnya di video: "satu baris ini bikin file jadi *module*, jadi variabelnya privat per file."
- Karena ada `export {};` di baris 1 dan baris kosong di baris 2, nomor baris di pesan error bergeser 2 dibanding yang ada di slide. Itu normal.
- Kondisi terakhir yang saya cek: `bunx tsc --noEmit` bersih (tanpa file demo).

---

## Slide 1 — Tipe Dasar pada TypeScript

**Durasi:** ± 25 detik

**Script:**
"Halo gaes, di sub-bab ketiga ini kita masuk ke bahan bakunya TypeScript: tipe dasar. Hari ini ada delapan hal yang kita bahas: `string`, `number`, `boolean`, array, `any`, union, serta `null` dan `undefined`. Tenang, semuanya pendek-pendek, dan tiap bagian kita buktiin langsung di terminal."

### 🖥️ Live Coding — siapkan folder demo

```bash
mkdir latihan
```

---

## Slide 2 — Tipe Primitif

**Durasi:** ± 50 detik

**Script:**
"Tiga tipe primitif yang paling sering kepake. **`string`** buat teks: judul artikel, nama, email. **`number`** buat angka. Dan ini penting buat yang datang dari bahasa lain: bilangan bulat maupun desimal itu sama-sama `number`. Nggak ada `int` atau `float` di TypeScript. Terakhir **`boolean`**: `true` atau `false`, misalnya status aktif atau sudah dibaca. Dan ingat dari sub-bab kemarin: semuanya **huruf kecil**."

### 🖥️ Live Coding — tiga primitif

`latihan/primitif.ts`:
```ts
export {};

const judul: string = "Belajar TypeScript";
const harga: number = 49000;     // bulat
const rating: number = 4.5;      // desimal, tetap number
const sudahDibaca: boolean = false;

console.log(judul, harga, rating, sudahDibaca);
```
```bash
bun latihan/primitif.ts
```
Output: `Belajar TypeScript 49000 4.5 false`.

**Cek manual:** `49000` dan `4.5` sama-sama bertipe `number`, tidak ada garis merah. Arahkan kursor ke `rating` untuk menampilkan tipenya.

---

## Slide 3 — Tipe Array

**Durasi:** ± 45 detik

**Script:**
"Array itu kumpulan nilai dengan tipe yang sama. Cara nulisnya: tipe elemen, diikuti `[]`. Jadi `number[]` artinya array yang isinya angka aja. Ada bentuk lain, `Array<number>`, artinya sama persis. Pilih salah satu dan konsisten ya. Dan yang paling penting: kalau kita coba masukin elemen bertipe lain, ditolak. Array string nggak bisa diisi angka."

---

## Slide 4 — Contoh Tipe Array

**Durasi:** ± 60 detik

**Script:**
"Yuk kita lihat langsung. Dua cara nulis array, dan satu kesalahan waktu nambah elemen."

### 🖥️ Live Coding — array dan `push` yang salah

1. `latihan/array.ts`:
   ```ts
   export {};

   let angka: number[] = [1, 2, 3];
   let nama: Array<string> = ["Ani", "Budi"];

   angka.push("4");
   // Error: Argument of type 'string' is not assignable
   // to parameter of type 'number'.
   ```
2. Tunjukkan garis merah di `"4"`.
3. Cek:
   ```bash
   bunx tsc --noEmit
   ```
   Output:
   ```
   latihan/array.ts(6,12): error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.
   ```
4. Narasi: "`number[]` dan `Array<string>` itu cuma beda penulisan. Tapi `push("4")` ditolak, karena `"4"` itu teks, bukan angka."

**Cek manual:** tepat satu error `TS2345` dari `array.ts`.

---

## Slide 5 — Type Inference

**Durasi:** ± 50 detik

**Script:**
"Kabar baik: kita nggak harus nulis tipe di mana-mana. TypeScript sering bisa **menebak** tipe dari nilai awalnya. Namanya *type inference*. Tiga aturan praktisnya.

Satu, variabel dengan nilai awal: `let kota = "Bandung"` otomatis bertipe `string`, nggak perlu anotasi. Dua, **parameter fungsi selalu kita tulis**, karena TypeScript nggak bisa nebak dari mana datanya datang. Tiga, **return type biasanya cukup dibiarkan**: hasil kali dua `number` ya ditebak `number`."

---

## Slide 6 — Contoh Type Inference

**Durasi:** ± 60 detik

**Script:**
"Perhatikan: di variabel nggak ada anotasi sama sekali, tapi tipenya tetap dijaga."

### 🖥️ Live Coding — tipe yang ditebak

1. `latihan/inference.ts`:
   ```ts
   export {};

   let kota = "Bandung";
   kota = 5;
   // Error: Type 'number' is not assignable to type 'string'.

   function kali(a: number, b: number) {
     return a * b;
   }

   const hasil = kali(2, 3);
   hasil.toUpperCase();
   // Error: Property 'toUpperCase' does not exist on type 'number'.
   ```
2. Arahkan kursor ke `kota` (tampil `let kota: string`) dan ke `hasil` (tampil `const hasil: number`). Tidak ada satu pun yang kita tulis tipenya.
3. Cek:
   ```bash
   bunx tsc --noEmit
   ```
   Output:
   ```
   latihan/inference.ts(4,1): error TS2322: Type 'number' is not assignable to type 'string'.
   latihan/inference.ts(11,7): error TS2339: Property 'toUpperCase' does not exist on type 'number'.
   ```

**Cek manual:** dua error, `TS2322` dan `TS2339`; hover menunjukkan `string` dan `number`.

---

## Slide 7 — any: Bypass Pengecekan

**Durasi:** ± 50 detik

**Script:**
"Sekarang bagian yang paling sering bikin masalah: **`any`**. Ini jalan pintas yang bikin TypeScript berhenti membantu.

Satu, `any` artinya *boleh apa saja*. Nilai bertipe `any` nggak dicek: boleh dipanggil, diisi, diakses properti apa pun. Dua, **`any` bisa muncul tanpa kita tulis**. Parameter tanpa tipe dianggap `any`, dan opsi `noImplicitAny` yang jadi bagian dari `strict` mengubahnya jadi error. Tiga, aturan di course ini: **hindari `any`**. Tulis tipe yang benar, karena `any` cuma mengembalikan risiko JavaScript."

### 🖥️ Live Coding — `any` yang muncul tanpa ditulis

1. `latihan/implisit.ts`:
   ```ts
   export {};

   function f(x) {
     return x;
   }
   ```
2. Cek:
   ```bash
   bunx tsc --noEmit
   ```
   Output:
   ```
   latihan/implisit.ts(3,12): error TS7006: Parameter 'x' implicitly has an 'any' type.
   ```
3. Narasi: "Ini `noImplicitAny` yang kerja, bagian dari `strict: true` yang kita bahas di sub-bab kemarin. Tanpa `strict`, `x` diam-diam jadi `any`."

**Cek manual:** error `TS7006` muncul. (Kalau ditambah `--noImplicitAny false`, errornya hilang.)

---

## Slide 8 — Bahayanya any

**Durasi:** ± 60 detik

**Script:**
"Lihat apa yang terjadi kalau kita pakai `any`. Editor diam saja. Padahal kode ini pasti gagal pas dijalankan."

### 🖥️ Live Coding — editor diam, runtime crash

1. `latihan/any.ts`:
   ```ts
   export {};

   let data: any = "halo";

   data.toFixed();
   // editor diam saja — crash saat dijalankan:
   // data adalah string, bukan number

   data = 42;
   data.toUpperCase();
   // editor diam saja — crash saat dijalankan
   ```
2. Tunjukkan: **tidak ada garis merah**.
3. Cek tipe:
   ```bash
   bunx tsc --noEmit
   ```
   Tidak ada error dari `any.ts`.
4. Jalankan:
   ```bash
   bun latihan/any.ts
   ```
   Output:
   ```
   TypeError: data.toFixed is not a function. (In 'data.toFixed()', 'data.toFixed' is undefined)
   ```
5. Narasi: "TypeScript tidak protes, tapi programnya tetap meledak. Itu persis risiko JavaScript yang tadi kita coba hindari."

**Cek manual:** `tsc` tidak menampilkan error untuk `any.ts`, tapi `bun latihan/any.ts` crash dengan `TypeError`.

---

## Slide 9 — Union Type: Lebih dari Satu Kemungkinan

**Durasi:** ± 50 detik

**Script:**
"Kadang sebuah nilai memang bisa lebih dari satu tipe. Misalnya ID yang bisa `101` atau `"101"`. Di situ kita pakai **union**, ditulis dengan garis tegak `|`, artinya *salah satu dari tipe ini*: `number | string`.

Aturannya: yang boleh dipakai hanya operasi yang valid untuk **semua** anggota union. Kalau mau pakai fungsi khusus string, cek dulu pakai `typeof`. Dan union bisa digabung dengan `null` dan `undefined`: `string | null` artinya teks, atau kosong."

---

## Slide 10 — Contoh Union Type

**Durasi:** ± 50 detik

**Script:**
"Cek tipe dengan `typeof` sebelum memakai fungsi khusus string."

### 🖥️ Live Coding — union dan `typeof`

1. `latihan/union.ts`:
   ```ts
   export {};

   function tampilkanId(id: number | string) {
     id.toUpperCase();
     // Error: Property 'toUpperCase' does not exist
     // on type 'string | number'.

     if (typeof id === "string") {
       id.toUpperCase(); // aman: id pasti string
     }
   }
   ```
2. Di dalam `if`, arahkan kursor ke `id`: tipenya menyempit jadi `string`.
3. Cek:
   ```bash
   bunx tsc --noEmit
   ```
   Output:
   ```
   latihan/union.ts(4,6): error TS2339: Property 'toUpperCase' does not exist on type 'string | number'.
     Property 'toUpperCase' does not exist on type 'number'.
   ```
   Hanya baris `id.toUpperCase()` di luar `if` yang error.

**Cek manual:** satu error `TS2339`; baris di dalam `if (typeof id === "string")` tidak error.

---

## Slide 11 — null, undefined, dan Parameter Opsional

**Durasi:** ± 50 detik

**Script:**
"Sekarang sumber error yang paling sering di dunia JavaScript: *'Cannot read properties of undefined'*. Tiga hal.

Satu, dengan `strict`, `null` dan `undefined` **bukan** anggota tipe lain. `string` isinya teks doang. Yang bisa kosong harus ditulis `string | null`. Dua, tanda **`?`** bikin parameter opsional: `gelar?: string` artinya `string` atau `undefined`. Tiga, **cek dulu sebelum dipakai**: pakai `if`, atau *optional chaining* `?.`."

---

## Slide 12 — Contoh null dan undefined

**Durasi:** ± 50 detik

**Script:**
"TypeScript memaksa kita menangani kemungkinan kosong *sebelum* bug-nya terjadi."

### 🖥️ Live Coding — `string | null`

1. `latihan/null.ts`:
   ```ts
   export {};

   function panjang(teks: string | null) {
     return teks.length;
     // Error: 'teks' is possibly 'null'.
   }

   function panjangAman(teks: string | null) {
     if (teks === null) return 0;
     return teks.length; // aman: teks pasti string
   }
   ```
2. Cek:
   ```bash
   bunx tsc --noEmit
   ```
   Output:
   ```
   latihan/null.ts(4,10): error TS18047: 'teks' is possibly 'null'.
   ```
3. Narasi: "Ini efek `strictNullChecks` dari `strict`. Kalau `strict` dimatikan, error ini hilang, dan bug-nya pindah ke pengguna."

**Cek manual:** error hanya di fungsi `panjang`, bukan `panjangAman`.

---

## Slide 13 — Contoh Parameter Opsional

**Durasi:** ± 70 detik

**Script:**
"Terakhir, parameter opsional. Tanda `?` bikin `gelar` bisa `undefined`. Jadi kita harus pakai `?.` atau `if` sebelum mengaksesnya."

### 🖥️ Live Coding — `gelar?: string` dan `?.`

1. `latihan/opsional.ts`:
   ```ts
   export {};

   function sapa(nama: string, gelar?: string) {
     return gelar.toUpperCase();
     // Error: 'gelar' is possibly 'undefined'.
   }

   function sapaAman(nama: string, gelar?: string) {
     return gelar?.toUpperCase(); // aman: hasilnya string | undefined
   }

   console.log(sapaAman("Rizki"), sapaAman("Rizki", "s.kom"));
   ```
2. Cek tipe:
   ```bash
   bunx tsc --noEmit
   ```
   Output:
   ```
   latihan/opsional.ts(4,10): error TS18048: 'gelar' is possibly 'undefined'.
   ```
3. Jalankan versi aman:
   ```bash
   bun latihan/opsional.ts
   ```
   Output: `undefined S.KOM`
   "Tanpa gelar, hasilnya `undefined`, bukan crash. Dengan gelar, jadi huruf besar."
4. **Bersihkan:**
   ```bash
   rm -rf latihan
   ```
5. Penutup: "Itu dia tipe dasar: primitif, array, inference, `any`, union, serta `null` dan `undefined`. Di sub-bab berikutnya kita lanjut ke tipe untuk objek dan props. Sampai jumpa!"

**Cek manual:** satu error `TS18048`; `bun latihan/opsional.ts` mencetak `undefined S.KOM`; setelah `rm -rf latihan`, `bunx tsc --noEmit` bersih.

---

## Rekap Durasi

| Slide | Durasi |
|---|---|
| 1 | 0:25 |
| 2 | 0:50 |
| 3 | 0:45 |
| 4 | 1:00 |
| 5 | 0:50 |
| 6 | 1:00 |
| 7 | 0:50 |
| 8 | 1:00 |
| 9 | 0:50 |
| 10 | 0:50 |
| 11 | 0:50 |
| 12 | 0:50 |
| 13 | 1:10 |
| **Total** | **± 11:30** (potong live coding Slide 2 dan 7 kalau perlu masuk 10 menit) |
