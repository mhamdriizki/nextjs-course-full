# Script Ngajar — M7 Sub4: Interface vs Type untuk Props

**Total durasi:** ± 13 menit penuh, ± 10 menit kalau live coding Slide 5, 10, dan 13 hanya ditunjukkan sekilas (14 slide)
**Sumber:** `script/M7_Sub4_Interface_vs_Type_Props (1).pptx.pdf`

## Persiapan sebelum rekam

- Semua demo memakai folder sementara `latihan/` di root project. **Hapus di akhir**: `rm -rf latihan`. Folder ini ikut dicek `tsc` (`include` memuat `**/*.ts` dan `**/*.tsx`), jadi kalau lupa dihapus, `bun run build` bisa gagal.
- Cek tipe pakai:
  ```bash
  bunx tsc --noEmit --incremental false
  ```
  `--incremental false` ditambahkan karena di sesi sebelumnya `bunx tsc --noEmit` pernah tidak menampilkan error yang seharusnya muncul (dugaan: cache `incremental: true`). Dengan flag ini hasilnya konsisten.
- **Tiap file demo diawali `export {};`** supaya jadi *module* (nama seperti `Tombol` tidak bentrok antar file). Karena itu nomor baris/kolom di pesan error bergeser dari yang tertera di slide.
- Contoh di slide memakai nama `Tombol` tiga kali dalam satu file. Itu bentrok kalau diketik utuh, jadi di naskah saya ganti `TombolA`, `TombolB`, `TombolC`.
- **Slide 11 memakai Zod.** Di `package.json` project ini `zod` **belum** tercatat sebagai dependency, tapi paketnya ada di `node_modules` (v3.25.76, ikut terpasang dari paket lain), jadi demo tetap jalan. Sebelum rekam, sebaiknya `bun add zod` supaya resmi. Kalau tidak mau, bagian Zod boleh dilewati.
- Di repo sudah ada contoh nyata untuk dua sisi: `interface PostListProps` di `app/blog/components/PostList.tsx` (props → interface), dan `type PostPreview = Pick<BlogPost, ...>` di `app/type/index.ts` (turunan → type). Dipakai di Slide 14.
- Kondisi terakhir yang saya cek: `tsc --noEmit --incremental false` bersih (tanpa file demo).

---

## Slide 1 — Interface vs Type untuk Props

**Durasi:** ± 20 detik

**Script:**
"Halo gaes, sub-bab keempat. Sekarang kita terapkan tipe ke sesuatu yang kalian tulis setiap hari di React: **props**. Pertanyaannya: ada dua cara memberi tipe, `interface` dan `type`. Apa bedanya, dan kapan pakai yang mana? Kita bahas sampai tuntas."

### 🖥️ Live Coding — siapkan folder demo

```bash
mkdir latihan
```

---

## Slide 2 — Contoh Props

**Durasi:** ± 50 detik

**Script:**
"Kita mulai dari contoh kecil. Komponen `Tombol` menerima satu props, `judul`, bertipe `string`. Kalau kita pakai `<Tombol judul={42} />`, TypeScript langsung protes: angka nggak bisa jadi `string`. Jadi props itu juga dijaga tipenya, persis seperti variabel dan parameter yang kemarin kita bahas."

### 🖥️ Live Coding — props salah tipe

1. `latihan/tombol.tsx`:
   ```tsx
   export {};

   function Tombol({ judul }: { judul: string }) {
     return <button>{judul}</button>;
   }

   export const a = <Tombol judul={42} />;
   // Error: Type 'number' is not assignable to type 'string'.
   export const ok = <Tombol judul="Simpan" />;
   ```
   (`export const ...` dipakai supaya JSX-nya dipakai dan tidak dianggap variabel tak terpakai.)
2. Tunjukkan garis merah di `{42}`.
3. Cek:
   ```bash
   bunx tsc --noEmit --incremental false
   ```
   Output:
   ```
   latihan/tombol.tsx(7,26): error TS2322: Type 'number' is not assignable to type 'string'.
   ```

**Cek manual:** satu error `TS2322` di `judul={42}`; baris `ok` tidak error.

---

## Slide 3 — Props = Parameter Komponen

**Durasi:** ± 45 detik

**Script:**
"Kuncinya satu kalimat: komponen React itu **fungsi**, dan props itu **objek yang jadi parameternya**. Jadi semua yang kita pelajari soal parameter berlaku di sini.

Tanpa tipe, kesalahan lolos sampai dijalankan: salah ketik nama prop, atau kirim angka padahal butuh teks. Sama seperti risiko JavaScript di sub-bab pertama. Dengan tipe, editor mengingatkan langsung: prop wajib yang lupa diisi, prop yang nggak dikenal, dan salah tipe nilai."

---

## Slide 4 — Membedah Satu Baris Props

**Durasi:** ± 60 detik

**Script:**
"Sekarang kita bedah satu baris ini pelan-pelan: `function Tombol({ judul }: { judul: string })`. Ada dua kata `judul`, dan perannya **beda**.

Yang di kiri, `{ judul }`, itu **destructuring**, fitur JavaScript. Artinya: ambil properti `judul` dari objek props dan jadikan variabel bernama `judul`. Yang di kanan, `{ judul: string }`, itu **tipe**, fitur TypeScript. Artinya: objek props harus punya properti `judul` bertipe `string`.

Dan titik dua di tengah dibaca: *'yang kiri bertipe yang kanan'*. Nama di kiri dan di kanan harus sama. Kalau beda, TypeScript menolak."

---

## Slide 5 — Contoh Tanpa dan Dengan Destructuring

**Durasi:** ± 70 detik

**Script:**
"Ini tiga versi komponen yang sama. Yang pertama tanpa destructuring, kita akses lewat `props.judul`. Yang kedua dengan destructuring, ini yang paling umum. Yang ketiga sengaja salah: nama di kiri `judul`, di kanan `title`."

### 🖥️ Live Coding — nama kiri dan kanan beda

1. `latihan/destructuring.tsx`:
   ```tsx
   export {};

   // Tanpa destructuring
   function TombolA(props: { judul: string }) {
     return <button>{props.judul}</button>;
   }

   // Dengan destructuring (lebih umum)
   function TombolB({ judul }: { judul: string }) {
     return <button>{judul}</button>;
   }

   // Nama kiri dan kanan beda
   function TombolC({ judul }: { title: string }) {
     // Error: Property 'judul' does not exist on type '{ title: string; }'.
     return <button>{judul}</button>;
   }

   export { TombolA, TombolB, TombolC };
   ```
2. Tunjukkan garis merah di `judul` pada `TombolC`.
3. Cek:
   ```bash
   bunx tsc --noEmit --incremental false
   ```
   Output (selain error dari file lain yang masih ada):
   ```
   latihan/destructuring.tsx(14,20): error TS2339: Property 'judul' does not exist on type '{ title: string; }'.
   ```

**Cek manual:** hanya `TombolC` yang error; `TombolA` dan `TombolB` bersih.

---

## Slide 6 — Dua Cara Menamai Tipe Props

**Durasi:** ± 40 detik

**Script:**
"Tipe inline seperti tadi cepat, tapi begitu field-nya bertambah jadi susah dibaca. Solusinya: beri nama pada tipenya. Ada dua cara. **`interface NamaProps { ... }`**, deklarasi khusus untuk bentuk sebuah objek. Atau **`type NamaProps = { ... }`**, sebuah alias, artinya memberi nama pada sebuah tipe, termasuk bentuk objek."

---

## Slide 7 — Perbedaan Interface dan Type

**Durasi:** ± 30 detik

**Script:**
"Ini props yang sama, ditulis dengan dua cara. Kiri `interface`, kanan `type`. Perhatikan `type` pakai tanda sama dengan `=` dan di akhir ada titik koma. Tanda `?` setelah `aktif` artinya opsional."

### 🖥️ Live Coding — tunjukkan di repo yang sudah ada

1. Buka `app/blog/components/PostList.tsx`, tunjuk `interface PostListProps { post: PostPreview[]; }`. "Ini contoh nyata di project kita."

**Cek manual:** `PostListProps` terlihat di baris 7.

---

## Slide 8 — Contoh Memakai Props yang Sudah Bertipe

**Durasi:** ± 70 detik

**Script:**
"Hasilnya sama, baik pakai `interface` maupun `type`. Kita pakai `TombolProps` di komponen, lalu coba tiga pemanggilan: yang benar, yang lupa `judul`, dan yang salah tipe di `aktif`."

### 🖥️ Live Coding — props wajib dan opsional

1. `latihan/props.tsx`:
   ```tsx
   export {};

   interface TombolProps {
     judul: string;
     aktif?: boolean;
   }

   function Tombol({ judul, aktif }: TombolProps) {
     return <button disabled={!aktif}>{judul}</button>;
   }

   export const a = <Tombol judul="Simpan" />;
   export const b = <Tombol />;
   // Error: Property 'judul' is missing in type '{}'
   // but required in type 'TombolProps'.
   export const c = <Tombol judul="Simpan" aktif="ya" />;
   // Error: Type 'string' is not assignable to type 'boolean | undefined'.
   ```
2. Cek:
   ```bash
   bunx tsc --noEmit --incremental false
   ```
   Output:
   ```
   latihan/props.tsx(13,19): error TS2741: Property 'judul' is missing in type '{}' but required in type 'TombolProps'.
   latihan/props.tsx(14,41): error TS2322: Type 'string' is not assignable to type 'boolean | undefined'.
   ```
3. Ganti `interface TombolProps { ... }` jadi `type TombolProps = { ... };`, lalu cek lagi. **Dua error yang sama muncul**. "Lihat, sama persis."

**Cek manual:** baris `a` bersih; baris `b` dan `c` error; hasilnya identik untuk `interface` maupun `type`.

---

## Slide 9 — interface vs type: Apa Bedanya?

**Durasi:** ± 100 detik

**Script:**
"Untuk props, hampir semua hal bisa dilakukan keduanya. Tapi ada empat perbedaan nyata.

Satu, **memperluas**: `interface` pakai `extends`, `type` pakai *intersection* `&`. Dua, **dideklarasikan dua kali**: `interface` digabung otomatis, namanya *declaration merging*. `type` malah error *Duplicate identifier*. Tiga, **apa yang bisa dinamai**: `interface` hanya bentuk objek, `type` bisa apa saja: objek, union, primitif, tuple, tipe fungsi. Empat, **properti bentrok saat memperluas**: `interface` langsung error, sedangkan `type` dengan `&` diam-diam menjadi `never`. Itu yang berbahaya karena nggak ada peringatan."

### 🖥️ Live Coding — buktikan perbedaannya

1. `latihan/bedatype.ts`:
   ```ts
   export {};

   // 1. Declaration merging: interface digabung otomatis
   interface Hewan { nama: string }
   interface Hewan { umur: number }
   const h: Hewan = { nama: "Kucing", umur: 2 }; // OK, kedua properti wajib

   // 2. type dua kali → error
   type Burung = { nama: string };
   type Burung = { umur: number };
   // Error: Duplicate identifier 'Burung'.

   // 3. Properti bentrok pada interface → error langsung
   interface A { id: string }
   interface B extends A { id: number }
   // Error: Interface 'B' incorrectly extends interface 'A'.

   export { h };
   ```
2. Cek:
   ```bash
   bunx tsc --noEmit --incremental false
   ```
   Output:
   ```
   latihan/bedatype.ts(8,6): error TS2300: Duplicate identifier 'Burung'.
   latihan/bedatype.ts(9,6): error TS2300: Duplicate identifier 'Burung'.
   latihan/bedatype.ts(19,11): error TS2430: Interface 'B' incorrectly extends interface 'A'.
     Types of property 'id' are incompatible.
       Type 'number' is not assignable to type 'string'.
   ```
   Perhatikan: `Hewan` yang dideklarasikan dua kali **tidak** error.
3. Sekarang sisi `type` yang diam-diam jadi `never`. `latihan/never.ts`:
   ```ts
   export {};

   type AT = { id: string };
   type BT = AT & { id: number };

   type Cek = BT["id"];
   const v: Cek = "a";
   // Error: Type '"a"' is not assignable to type 'never'.
   ```
   Cek lagi, output:
   ```
   latihan/never.ts(7,7): error TS2322: Type '"a"' is not assignable to type 'never'.
   ```
   Narasi: "Pembuatan `BT` sendiri **tidak error**. Baru ketahuan nanti pas dipakai, `id`-nya jadi `never`, nilai apa pun ditolak. Bandingkan dengan `interface` tadi yang protes di tempat."

**Cek manual:** `Hewan` tidak error, `Burung` error `TS2300` dua kali, `B` error `TS2430`, dan `BT` tidak error saat dibuat tapi `Cek` bertipe `never`.

---

## Slide 10 — extends vs Intersection

**Durasi:** ± 60 detik

**Script:**
"Dua cara membuat `KartuProps` yang menambahkan deskripsi di atas `DasarProps`. Kiri: `interface` dengan `extends`. Kanan: `type` dengan `&`. Hasil akhirnya sama: `KartuProps` punya `judul` dan `deskripsi`."

### 🖥️ Live Coding — dua cara memperluas

1. `latihan/perluas.tsx`:
   ```tsx
   export {};

   // interface + extends
   interface DasarProps { judul: string }
   interface KartuProps extends DasarProps { deskripsi: string }

   // type + &
   type DasarT = { judul: string };
   type KartuT = DasarT & { deskripsi: string };

   function Kartu({ judul, deskripsi }: KartuProps) {
     return <div>{judul}: {deskripsi}</div>;
   }
   function KartuB({ judul, deskripsi }: KartuT) {
     return <div>{judul}: {deskripsi}</div>;
   }

   export const a = <Kartu judul="Halo" deskripsi="Dunia" />;
   export const b = <KartuB judul="Halo" deskripsi="Dunia" />;
   export const c = <Kartu judul="Halo" />;
   // Error: Property 'deskripsi' is missing ...
   ```
2. Cek: `a` dan `b` bersih, `c` error karena `deskripsi` wajib.

   Output:
   ```
   latihan/perluas.tsx(20,19): error TS2741: Property 'deskripsi' is missing in type '{ judul: string; }' but required in type 'KartuProps'.
   ```

**Cek manual:** `Kartu` dan `KartuB` berperilaku sama; hanya `c` yang error.

---

## Slide 11 — Contoh Penggunaan dalam Deklarasi Variabel

**Durasi:** ± 70 detik

**Script:**
"Ini hal yang *hanya* bisa dilakukan `type`. Pertama **union**: `type Status = "aktif" | "nonaktif"`. Kedua **tipe turunan**: `Pick` mengambil sebagian properti dari tipe lain. Ketiga **tipe hasil Zod**: `z.infer` menghasilkan tipe langsung dari schema. Dan kalau kita isi `Status` dengan `"mati"`, ditolak."

### 🖥️ Live Coding — union, `Pick`, `z.infer`

1. (Opsional tapi disarankan) pasang Zod secara resmi: `bun add zod`.
2. `latihan/hanya-type.ts`:
   ```ts
   import { z } from "zod";

   type Status = "aktif" | "nonaktif";       // union

   interface KartuProps { judul: string; deskripsi: string }
   type Ringkas = Pick<KartuProps, "judul">; // tipe turunan

   const schema = z.object({ nama: z.string() });
   type Form = z.infer<typeof schema>;        // tipe dari Zod

   const s: Status = "mati";
   // Error: Type '"mati"' is not assignable to type 'Status'.
   const r: Ringkas = { judul: "a" };
   const f: Form = { nama: "b" };

   export { s, r, f };
   ```
3. Cek:
   ```bash
   bunx tsc --noEmit --incremental false
   ```
   Output:
   ```
   latihan/hanya-type.ts(11,7): error TS2322: Type '"mati"' is not assignable to type 'Status'.
   ```
4. Tunjuk bahwa project sudah punya contoh `Pick` sungguhan: `app/type/index.ts`, `export type PostPreview = Pick<BlogPost, "id" | "title" | "slug" | "published">`.

**Cek manual:** satu error `TS2322` di `"mati"`; `r` dan `f` bersih.

---

## Slide 12 — Pola Props yang Sering Muncul

**Durasi:** ± 70 detik

**Script:**
"Empat pola props yang bakal sering kalian temui.

Satu, **props opsional**: `aktif?: boolean`. Boleh nggak diisi, nilainya jadi `undefined`, dan bisa diberi nilai bawaan pas destructuring. Dua, **props fungsi atau callback**: `onKlik: () => void`. Ini tipe fungsi: tanpa parameter, dan nggak mengembalikan nilai. Tiga, **`children: React.ReactNode`**: isi yang ditaruh di antara tag pembuka dan penutup komponen. Empat, **`children` nggak bisa dibatasi jenis elemennya**. Menurut dokumentasi React, TypeScript nggak bisa memaksa `children` cuma berupa `<li>`, misalnya."

---

## Slide 13 — Tiga Pola Props dalam Satu Komponen

**Durasi:** ± 70 detik

**Script:**
"Ketiganya digabung dalam satu `interface`: opsional, callback, dan children. Perhatikan `aktif = true` di destructuring. Itu nilai bawaan kalau `aktif` nggak dikirim."

### 🖥️ Live Coding — satu komponen, tiga pola

1. `latihan/kotak.tsx`:
   ```tsx
   export {};

   interface KotakProps {
     judul: string;
     aktif?: boolean;           // opsional
     onKlik: () => void;        // fungsi callback
     children: React.ReactNode; // isi di dalam tag
   }

   function Kotak({ judul, aktif = true, onKlik, children }: KotakProps) {
     return <div onClick={onKlik}>{judul}{String(aktif)}{children}</div>;
   }

   export const k = <Kotak judul="x" onKlik={() => {}}><p>isi</p></Kotak>;
   export const k2 = <Kotak judul="x">isi</Kotak>;
   // Error: Property 'onKlik' is missing ...
   ```
2. Cek:
   ```bash
   bunx tsc --noEmit --incremental false
   ```
   Output:
   ```
   latihan/kotak.tsx(14,20): error TS2741: Property 'onKlik' is missing in type '{ children: string; judul: string; }' but required in type 'KotakProps'.
   ```
3. Narasi: "`k` lolos: `aktif` boleh dilewat, `onKlik` dikirim, dan `children` berupa elemen `<p>`. `k2` error karena lupa `onKlik`. `children` sendiri nggak masalah, string juga termasuk `ReactNode`."

**Cek manual:** hanya `k2` yang error (`TS2741`).

---

## Slide 14 — Kapan Memakai yang Mana?

**Durasi:** ± 70 detik

**Script:**
"Terakhir, kapan pakai yang mana. **Pakai `interface`** untuk bentuk objek murni: props komponen, bentuk objek yang mungkin diperluas dengan `extends`, atau kalau perlu menambah properti ke tipe yang sudah ada (*merging*). **Pakai `type`** untuk selain bentuk objek: union dan literal union, tipe turunan seperti `Pick`, `Omit`, `typeof`, dan tipe hasil Zod lewat `z.infer`.

Aturan di course ini: **props objek → `interface`; union, turunan, dan hasil Zod → `type`**. Panduan resminya: pakai `interface` sampai kamu butuh fitur `type`. Dan yang paling penting: **konsisten**.

Bisa kalian lihat sendiri di project kita: `PostListProps` itu `interface`, sedangkan `PostPreview` itu `type` karena hasil `Pick`. Itu aturan yang sama. Sampai jumpa di sub-bab berikutnya!"

### 🖥️ Live Coding — bersihkan dan cek aturan di repo

1. Tunjuk `app/blog/components/PostList.tsx` (`interface PostListProps`) dan `app/type/index.ts` (`interface BlogPost`, `type PostPreview = Pick<...>`, `type ActionResult<T> = ... | ...`).
2. **Hapus file demo:**
   ```bash
   rm -rf latihan
   ```
3. Cek bersih:
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
| 3 | 0:45 |
| 4 | 1:00 |
| 5 | 1:10 |
| 6 | 0:40 |
| 7 | 0:30 |
| 8 | 1:10 |
| 9 | 1:40 |
| 10 | 1:00 |
| 11 | 1:10 |
| 12 | 1:10 |
| 13 | 1:10 |
| 14 | 1:10 |
| **Total** | **± 13:20** (potong live coding Slide 5, 10, 13 jadi sekilas kalau perlu mendekati 10 menit) |
