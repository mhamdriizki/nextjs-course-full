# Script Ngajar — M7 Sub5: Alias Tipe

**Total durasi:** ± 15 menit penuh, ± 11 menit kalau live coding Slide 5, 10, dan 13 hanya ditunjukkan sekilas (14 slide)
**Sumber:** `script/M7_Sub5_Alias_Tipe.pptx.pdf`

## Persiapan sebelum rekam

- Semua demo memakai folder sementara `latihan/` di root project. **Hapus di akhir**: `rm -rf latihan`. Folder ini ikut dicek `tsc` (`include` memuat `**/*.ts`), jadi kalau lupa dihapus, `bun run build` bisa gagal.
- Cek tipe pakai:
  ```bash
  bunx tsc --noEmit --incremental false
  ```
  (`--incremental false` karena `bunx tsc --noEmit` pernah tidak menampilkan error yang seharusnya muncul.)
- **Tiap file demo diawali `export {};`** supaya jadi *module*. Penting di sub-bab ini karena `type Pengguna` ditulis ulang di banyak file demo (`pick.ts`, `omit.ts`, dst.). Tanpa `export {};`, nama itu bentrok antar file. Akibatnya nomor baris/kolom di pesan error bergeser dari yang tertera di slide.
- Di project ini ada folder `app/latihan/` milik kamu sendiri (berisi `halo.ts`). Itu bukan folder demo naskah ini, jangan ikut dihapus.
- Contoh nyata di repo untuk Slide 5–6: `type PostPreview = Pick<BlogPost, "id" | "title" | "slug" | "published">` di `app/type/index.ts`, dan dipakai di `app/blog/page.tsx` (`const dataPostDariDb: PostPreview[]`).
- Kondisi terakhir yang saya cek: `tsc --noEmit --incremental false` bersih (tanpa file demo).

---

## Slide 1 — Alias Tipe

**Durasi:** ± 20 detik

**Script:**
"Halo gaes, sub-bab kelima: alias tipe. Intinya satu: kita kasih **nama** pada sebuah tipe, supaya bisa dipakai ulang, gampang dibaca, dan gampang dirawat. Di akhir nanti kita juga kenalan sama tiga jurus bawaan TypeScript buat membuat tipe dari tipe lain: `Pick`, `Omit`, dan `Partial`."

### 🖥️ Live Coding — siapkan folder demo

```bash
mkdir latihan
```

---

## Slide 2 — Apa itu Alias Tipe?

**Durasi:** ± 50 detik

**Script:**
"Alias tipe itu sebuah nama untuk sebuah tipe, ditulis dengan `type NamaTipe = ...`. Ada tiga untungnya.

Satu, **ditulis sekali, dipakai di banyak tempat**. Kalau tipenya berubah, cukup ubah di satu tempat. Dua, **nama yang bermakna**: `Status` jauh lebih enak dibaca daripada `"aktif" | "nonaktif" | "selesai"` yang ditulis berulang-ulang. Tiga, **pesan error ikut memakai nama alias**. Error-nya nyebut `Status`, bukan deretan nilai union yang panjang."

---

## Slide 3 — Tanpa Alias vs Dengan Alias

**Durasi:** ± 80 detik

**Script:**
"Lihat bedanya. Di atas, union yang sama ditulis berulang di dua fungsi. Di bawah, kita bikin `type Status` sekali, lalu dipakai di mana saja. Dan buktiin poin ketiga tadi: pesan error ikut memakai nama alias."

### 🖥️ Live Coding — pesan error dengan dan tanpa alias

1. `latihan/alias.ts`:
   ```ts
   export {};

   // Tanpa alias: union yang sama ditulis berulang
   function tampil(s: "aktif" | "nonaktif" | "selesai") {}
   function ubah(s: "aktif" | "nonaktif" | "selesai") {}

   // Dengan alias: ditulis sekali, dipakai di mana saja
   type Status = "aktif" | "nonaktif" | "selesai";

   function tampilStatus(s: Status) {}
   function ubahStatus(s: Status) {}

   tampil("mati");
   ubahStatus("mati");
   ```
2. Cek:
   ```bash
   bunx tsc --noEmit --incremental false
   ```
   Output:
   ```
   latihan/alias.ts(13,8): error TS2345: Argument of type '"mati"' is not assignable to parameter of type '"aktif" | "nonaktif" | "selesai"'.
   latihan/alias.ts(14,12): error TS2345: Argument of type '"mati"' is not assignable to parameter of type 'Status'.
   ```
3. Narasi: "Dua kesalahan yang sama, tapi pesan kedua lebih singkat dan langsung menyebut `Status`. Bayangin kalau unionnya ada sepuluh nilai."

**Cek manual:** dua error `TS2345`; yang pertama menuliskan seluruh union, yang kedua menyebut `Status`.

---

## Slide 4 — Alias Bisa untuk Tipe Apa Saja

**Durasi:** ± 60 detik

**Script:**
"Ini kelebihan `type` dibanding `interface` yang kita bahas di sub-bab empat: alias bisa dipakai untuk tipe apa saja. Lima jenis.

**Union**: `type ID = number | string`. **Literal union**: `type Ukuran = "kecil" | "besar"`, nilainya cuma boleh salah satu dari yang terdaftar. **Objek**: `type Pengguna = { id: ID; nama: string }`, sama seperti `interface`. **Array**: `type Daftar = Pengguna[]`. Dan **fungsi**: `type Sapa = (nama: string) => string`, yaitu bentuk fungsi lengkap dengan parameter dan nilai kembaliannya."

---

## Slide 5 — Berbagai Jenis Alias

**Durasi:** ± 70 detik

**Script:**
"Satu contoh untuk tiap jenis. Perhatikan `Pengguna` memakai `ID` di dalamnya, jadi alias bisa dipakai di dalam alias lain. Lalu `Sapa` adalah tipe fungsi, dan `const sapa: Sapa = ...` artinya fungsi ini harus punya bentuk itu."

### 🖥️ Live Coding — lima jenis alias

1. `latihan/jenis-alias.ts`:
   ```ts
   export {};

   // union
   type ID = number | string;

   // objek
   type Pengguna = { id: ID; nama: string; email: string; umur: number };

   // array
   type Daftar = Pengguna[];

   // fungsi
   type Sapa = (nama: string) => string;
   const sapa: Sapa = (nama) => nama.toUpperCase();

   // literal union
   type Ukuran = "kecil" | "besar";
   const u: Ukuran = "sedang";
   // Error: Type '"sedang"' is not assignable to type 'Ukuran'.

   const d: Daftar = [{ id: "1", nama: "Ani", email: "a@b.c", umur: 20 }];
   console.log(sapa("ani"), d.length);
   ```
2. Hover `nama` di dalam `(nama) => nama.toUpperCase()`: tipenya `string`, ditebak dari `Sapa`. Tidak perlu ditulis lagi.
3. Cek:
   ```bash
   bunx tsc --noEmit --incremental false
   ```
   Output:
   ```
   latihan/jenis-alias.ts(17,7): error TS2322: Type '"sedang"' is not assignable to type 'Ukuran'.
   ```
4. (Opsional) jalankan `bun latihan/jenis-alias.ts` → `ANI 1`.

**Cek manual:** hanya satu error (`"sedang"`); `id: "1"` dan `id: 1` sama-sama boleh karena `ID = number | string`.

---

## Slide 6 — Derivative Type

**Durasi:** ± 60 detik

**Script:**
"Sekarang bagian yang paling berguna di dunia nyata: *derivative type*, tipe turunan. `Pick`, `Omit`, dan `Partial` itu bantuan bawaan TypeScript yang namanya *utility types*, buat bikin tipe dari tipe lain.

Polanya tiga langkah. Mulai dari **satu tipe asal**, misalnya `Pengguna` dengan `id`, `nama`, `email`, dan `password`. Lalu **turunkan, jangan salin**: kebutuhan lain seperti tampilan ringkas, form, dan update dibuat dari tipe asal itu. Hasilnya, **perubahan di tipe asal ikut mengalir**. Tambah satu properti di `Pengguna`, semua turunannya otomatis menyesuaikan."

### 🖥️ Live Coding — tunjukkan contoh nyata di repo

1. Buka `app/type/index.ts`. Tunjuk `BlogPost` sebagai tipe asal dan `PostPreview = Pick<BlogPost, ...>` sebagai turunannya.
2. Buka `app/blog/page.tsx`, tunjuk `const dataPostDariDb: PostPreview[]`. "Halaman daftar cuma butuh data ringkas, jadi pakai tipe turunan."

**Cek manual:** `PostPreview` terlihat di `app/type/index.ts` baris 11.

---

## Slide 7 — Pick: Ambil Sebagian Properti

**Durasi:** ± 50 detik

**Script:**
"`Pick<Tipe, "properti">` membuat tipe baru yang hanya berisi properti yang kamu sebutkan. Yang nggak disebut dibuang. Dipakai saat sebuah bagian aplikasi cuma butuh sedikit data, misalnya kartu atau daftar ringkas. Cara menyebut propertinya: satu, `"id"`. Beberapa, `"id" | "nama"`, dipisah tanda garis tegak."

---

## Slide 8 — Contoh Pick

**Durasi:** ± 60 detik

**Script:**
"Tipe `Ringkas` cuma berisi `id` dan `nama`. Kalau kita isi dengan properti lain, ditolak."

### 🖥️ Live Coding — `Pick`

1. `latihan/pick.ts`:
   ```ts
   export {};

   type Pengguna = { id: number; nama: string; email: string; password: string };

   type Ringkas = Pick<Pengguna, "id" | "nama">;
   // sama dengan: { id: number; nama: string }

   const a: Ringkas = { id: 1, nama: "Ani" };
   // OK

   const b: Ringkas = { id: 1, nama: "Ani", email: "ani@mail.com" };
   // Error: Object literal may only specify known properties,
   // and 'email' does not exist in type 'Ringkas'.
   ```
2. Hover `Ringkas` untuk menampilkan bentuk hasilnya.
3. Cek:
   ```bash
   bunx tsc --noEmit --incremental false
   ```
   Output:
   ```
   latihan/pick.ts(9,42): error TS2353: Object literal may only specify known properties, and 'email' does not exist in type 'Ringkas'.
   ```

**Cek manual:** `a` bersih; `b` error `TS2353` di `email`.

---

## Slide 9 — Omit: Buang Sebagian Properti

**Durasi:** ± 50 detik

**Script:**
"`Omit` kebalikan `Pick`: ambil semua properti, lalu buang yang disebut. Dipakai buat menyembunyikan data sensitif seperti `password`, atau bikin form tanpa properti yang diisi server, seperti `id`.

Cara milih? Gampang. **Yang diambil sedikit: `Pick`. Yang dibuang sedikit: `Omit`.**"

---

## Slide 10 — Contoh Omit

**Durasi:** ± 70 detik

**Script:**
"Dua turunan dari `Pengguna` yang sama untuk dua kebutuhan berbeda. `PenggunaAman` membuang `password`, jadi aman dikirim ke tampilan. `FormDaftar` membuang `id`, karena `id` dibuat oleh server, bukan diisi di form."

### 🖥️ Live Coding — `Omit` dan tipe asal yang berubah

1. `latihan/omit.ts`:
   ```ts
   export {};

   type Pengguna = { id: number; nama: string; email: string; password: string };

   type PenggunaAman = Omit<Pengguna, "password">;
   // sama dengan: { id: number; nama: string; email: string }

   type FormDaftar = Omit<Pengguna, "id">;
   // sama dengan: { nama: string; email: string; password: string }
   // id dibuat oleh server, jadi tidak diisi di form

   const p: PenggunaAman = { id: 1, nama: "Ani", email: "a@b.c", password: "x" };
   // Error: Object literal may only specify known properties,
   // and 'password' does not exist in type 'PenggunaAman'.
   const f: FormDaftar = { nama: "Ani", email: "a@b.c", password: "x" };
   ```
2. Cek:
   ```bash
   bunx tsc --noEmit --incremental false
   ```
   Output:
   ```
   latihan/omit.ts(9,63): error TS2353: Object literal may only specify known properties, and 'password' does not exist in type 'PenggunaAman'.
   ```
3. **Buktikan "perubahan mengalir"** (poin dari Slide 6). Tambahkan `umur: number` ke `type Pengguna` (tanpa menyentuh dua turunannya), perbaiki `p` dan `f` supaya tidak ada `password`/`id` berlebih, lalu cek lagi. Contoh hasil yang saya uji:
   ```
   Property 'umur' is missing in type '{ id: number; nama: string; email: string; }' but required in type 'PenggunaAman'.
   Property 'umur' is missing in type '{ nama: string; email: string; password: string; }' but required in type 'FormDaftar'.
   ```
   Narasi: "`umur` cuma ditambah di satu tempat, tapi dua turunannya langsung tahu. Itu maksud 'turunkan, jangan salin'."

**Cek manual:** langkah 2 menampilkan satu error `TS2353`; langkah 3 menampilkan error `umur` di kedua turunan.

---

## Slide 11 — Jebakan Omit

**Durasi:** ± 80 detik

**Script:**
"Ini jebakan yang sering lolos. **`Omit` nggak mengecek nama properti. `Pick` mengecek.**

Lihat: `Omit<Pengguna, "passwrd">`, salah ketik, hilang satu `o`. TypeScript diam saja. Hasilnya tipe yang tetap berisi `password`, dan kita kira sudah aman. Sedangkan `Pick<Pengguna, "nmaa">` langsung error, karena `"nmaa"` bukan `keyof Pengguna`. Jadi kalau pakai `Omit` buat menyembunyikan data sensitif, **teliti ejaannya**."

### 🖥️ Live Coding — `Omit` diam, `Pick` protes

1. `latihan/jebakan-omit.ts`:
   ```ts
   export {};

   type Pengguna = { id: number; nama: string; email: string; password: string };

   type Salah = Omit<Pengguna, "passwrd">;
   // tidak ada peringatan! Omit diam saja pada nama yang salah ketik
   // hasilnya tetap berisi password

   // Bukti: password masih wajib di tipe Salah
   const s: Salah = { id: 1, nama: "Ani", email: "a@b.c" };
   // Error: Property 'password' is missing ...

   type SalahPick = Pick<Pengguna, "nmaa">;
   // Error: Type '"nmaa"' does not satisfy the constraint 'keyof Pengguna'.
   ```
2. Cek:
   ```bash
   bunx tsc --noEmit --incremental false
   ```
   Output:
   ```
   latihan/jebakan-omit.ts(6,7): error TS2741: Property 'password' is missing in type '{ id: number; nama: string; email: string; }' but required in type 'Salah'.
   latihan/jebakan-omit.ts(8,33): error TS2344: Type '"nmaa"' does not satisfy the constraint 'keyof Pengguna'.
   ```
3. Narasi: "Baris `type Salah = Omit<...>` sendiri **tidak error**. Kita baru sadar ada yang salah karena `password` ternyata masih wajib. Sedangkan `Pick` protes tepat di nama yang salah."

**Cek manual:** tidak ada error di baris `type Salah`; error `TS2741` muncul di `const s`; error `TS2344` muncul di `Pick`.

---

## Slide 12 — Partial: Semua Properti Jadi Opsional

**Durasi:** ± 50 detik

**Script:**
"`Partial<Tipe>` mengubah setiap properti jadi boleh tidak diisi. Semua properti tetap ada, tapi masing-masing jadi opsional, kayak diberi tanda tanya. Dipakai buat update sebagian data: kirim hanya field yang berubah, misalnya edit nama tanpa menyentuh email. Dan tipe nilainya tetap dijaga: kalau `nama` dikirim, isinya tetap harus `string`."

---

## Slide 13 — Contoh Partial

**Durasi:** ± 70 detik

**Script:**
"Fungsi `ubahPengguna` menerima `id` dan sebagian data `Pengguna`. Kirim `{ nama: "Budi" }` saja boleh. Tapi kalau `nama`-nya angka, ditolak."

### 🖥️ Live Coding — `Partial`

1. `latihan/partial.ts`:
   ```ts
   export {};

   type Pengguna = { id: number; nama: string; email: string; password: string };

   // Partial<Pengguna> sama dengan:
   // { id?: number; nama?: string; email?: string; password?: string }

   function ubahPengguna(id: number, data: Partial<Pengguna>) {}

   ubahPengguna(1, { nama: "Budi" });
   // OK: cukup kirim yang berubah

   ubahPengguna(1, { nama: 5 });
   // Error: Type 'number' is not assignable to type 'string'.
   ```
2. Cek:
   ```bash
   bunx tsc --noEmit --incremental false
   ```
   Output:
   ```
   latihan/partial.ts(9,19): error TS2322: Type 'number' is not assignable to type 'string'.
   ```

**Cek manual:** pemanggilan pertama bersih; `{ nama: 5 }` error `TS2322`.

---

## Slide 14 — Ringkasan: Pick, Omit, dan Partial

**Durasi:** ± 60 detik

**Script:**
"Rangkumannya, diterapkan ke `Pengguna { id, nama, email, password }`.

`Pick<Pengguna, "id" | "nama">`: ambil hanya yang disebut, hasilnya `id` dan `nama`, dipakai buat tampilan atau data ringkas. `Omit<Pengguna, "password">`: ambil semua kecuali yang disebut, hasilnya `id`, `nama`, `email`, dipakai buat menyembunyikan data sensitif atau bikin form tanpa `id`. `Partial<Pengguna>`: semua properti jadi opsional, dipakai buat update sebagian data.

Satu hal yang harus diingat: **`Omit` nggak mengecek ejaan**. Itu dia alias tipe. Sampai jumpa di sub-bab berikutnya!"

### 🖥️ Live Coding — bersihkan

1. **Hapus file demo:**
   ```bash
   rm -rf latihan
   ```
2. Cek bersih:
   ```bash
   bunx tsc --noEmit --incremental false
   ```

**Cek manual:** tidak ada error setelah `rm -rf latihan`.

---

## Rekap Durasi

| Slide | Durasi |
|---|---|
| 1 | 0:20 |
| 2 | 0:50 |
| 3 | 1:20 |
| 4 | 1:00 |
| 5 | 1:10 |
| 6 | 1:00 |
| 7 | 0:50 |
| 8 | 1:00 |
| 9 | 0:50 |
| 10 | 1:10 |
| 11 | 1:20 |
| 12 | 0:50 |
| 13 | 1:10 |
| 14 | 1:00 |
| **Total** | **± 14:50** (potong live coding Slide 5, 10, dan 13 jadi sekilas kalau perlu mendekati 10 menit) |
