# Naskah Live Demo — Modul 9 Bab 6: CRUD (Create, Read, Update, Delete)

Durasi perkiraan: 40-45 menit (bab paling banyak kode setelah Bab 3). Semua contoh di naskah ini **sudah dieksekusi dan jalan nyata** di branch `coba-96` — bukan disalin mentah dari slide. Implementasinya ada di `lib/data/post.ts`, `lib/data/user-preferences.ts`, `app/posts/actions.ts`, `app/posts/page.tsx`, `app/posts/[slug]/page.tsx`.

## Status setelah eksekusi (jangan diulang sebelum kelas, cukup direview)

- [x] Docker Postgres di-start, schema di-migrate (`post_soft_delete_and_user_preferences` — menambah `Post.deletedAt` untuk soft delete, dan model baru `UserPreferences` untuk demo upsert).
- [x] `lib/data/post.ts` — `createPost`, `getPostBySlug`, `listPublishedPosts`, `updatePost`, `incrementPostViewCount`, `softDeletePost`. Semua sudah dites end-to-end (create → publish → increment 2x → upsert idempotent → soft delete → post hilang dari `getPostBySlug`), lewat script sekali-pakai yang sudah dihapus lagi.
- [x] `app/posts/actions.ts` — Server Actions (`createPostAction`, `publishPostAction`, `softDeletePostAction`, `saveThemePreferenceAction`), ikut pola `"use server"` + `revalidatePath` yang sudah dipakai di `app/blog/action.ts`.
- [x] `app/posts/page.tsx` & `app/posts/[slug]/page.tsx` — didemo jalan di dev server beneran (`curl` ke `/posts` dan `/posts/[slug]` → HTTP 200/404 sesuai skenario).
- [x] `excerpt` di schema project ini **wajib diisi** (`excerpt String`), `content` **opsional** (`content String?`) — kebalikan dari asumsi umum. Semua contoh kode menyesuaikan ini.

### ⚠️ Bug nyata yang ditemukan & diperbaiki saat eksekusi — ini bahan ajar penting

Project ini pakai **Cache Components** (lihat catatan di `AGENTS.md`: "This is NOT the Next.js you know"). Dua kesalahan yang kejadian beneran dan wajib disebut ke siswa supaya mereka tidak mengulang:

1. **Jangan taruh mutasi (`db.user.create`, dst) langsung di render Server Component.** Percobaan pertama, `page.tsx` bikin "demo author" langsung di body komponen halaman — hasilnya *unique constraint error* karena Next.js retry render dan menjalankan `create()` dua kali. Perbaikannya: pindahkan logic "find-or-create" itu ke dalam Server Action (`createPostAction`), bukan di render.
2. **Query database live tidak boleh langsung di top-level Server Component tanpa penanda dinamis** — Cache Components menganggap komponen itu kandidat prerender statis secara default. Muncul error `used new Date() before accessing... uncached data`. **`export const dynamic = "force-dynamic"` TIDAK berlaku lagi** di sini (langsung error "not compatible with cacheComponents"). Pola yang benar (dari `node_modules/next/dist/docs/01-app/01-getting-started/08-caching.md`): pisahkan bagian yang baca data ke komponen async terpisah, bungkus dengan `<Suspense>`, dan panggil `await connection()` dari `next/server` di awal komponen itu sebelum query apa pun. Ini sudah diterapkan di `PostList` (`app/posts/page.tsx`) dan `PostDetailContent` (`app/posts/[slug]/page.tsx`).

Ada satu warning lagi yang **sengaja tidak diperbaiki** karena di luar cakupan bab ini: `RootLayout`/`Navbar` kena flag "accessed outside Suspense" begitu ada route yang benar-benar dynamic di bawahnya (dikonfirmasi tidak muncul di route lain seperti `/gym` yang tidak sepenuhnya dynamic). Ini soal migrasi layout global ke Cache Components, bukan soal Prisma — sebutkan ke siswa sebagai "known issue," jangan coba diperbaiki live supaya tidak melebar ke luar topik database.

---

## 1. Framing pembuka (2 menit)

> "Sampai sekarang kita sudah setup Prisma, koneksi database, singleton, dan migration. Tapi belum satu pun kita benar-benar **simpan atau ambil data**. Hari ini kita masuk ke yang paling sering dipakai sehari-hari: CRUD — Create, Read, Update, Delete. Empat operasi ini yang bakal kalian tulis ratusan kali di project manapun."

---

## 2. CREATE — insert data (10 menit) — slide halaman 2

**Live-type — single create, pakai `select`:**

```ts
import { db } from "@/lib/db";

const user = await db.user.create({
  data: {
    email: "rizki@example.com",
    name: "Muhammad Rizki",
    role: "AUTHOR",
  },
  select: {
    id: true,
    name: true,
    email: true,
    // password dll tidak disebut → tidak ikut dikembalikan
  },
});
// user: { id: string; name: string; email: string }
```

**Talking point:**
> "`select` itu whitelist — kalian sebutkan field mana saja yang mau dikembalikan. Ini bukan cuma soal rapi, ini soal **performa**: kalau tabel kalian punya 20 kolom tapi cuma butuh 3, jangan tarik semuanya dari database. Makin sedikit data yang di-transfer, makin cepat query-nya, apalagi kalau nanti tabelnya sudah jutaan baris."

**Live-type — nested create dengan relasi, pakai `connect`:**

```ts
const post = await db.post.create({
  data: {
    title: "Belajar Prisma 7",
    slug: "belajar-prisma-7",
    excerpt: "Ringkasan singkat artikel ini",   // wajib diisi di schema kita
    content: "Konten lengkap artikel...",        // opsional di schema kita
    author: {
      connect: { id: user.id },   // hubungkan ke User yang sudah ada
      // atau: create: { email: "...", name: "..." } // buat User baru sekalian
    },
  },
  include: {
    author: { select: { name: true } },
  },
});
```

**Talking point, bedah `connect` vs `create` di sini:**
> "Perhatikan struktur relasinya. Alih-alih nulis `authorId: user.id` langsung, kita nulis `author: { connect: { id: user.id } }`. Ini bahasa Prisma buat bilang 'hubungkan ke record yang **sudah ada**'. Kalau kalian ganti jadi `author: { create: { email: ..., name: ... } }`, itu artinya 'buat User **baru sekalian**, terus hubungkan otomatis' — satu query, dua insert sekaligus (User baru + Post baru), dan Prisma yang urus foreign key-nya."

**Talking point — `select` vs `include`, ini yang sering ketuker:**
> "`select` dan `include` itu **saling eksklusif** buat level yang sama — kalian pilih salah satu. `select` untuk milih field spesifik (termasuk field dari relasi kalau kalian nested). `include` untuk narik **seluruh field** dari relasi, plus semua field utama model-nya otomatis ikut. Aturan sederhana: kalau kalian sudah pakai `select` di level atas, dan mau nyertain relasi, taruh relasinya **di dalam** `select` itu juga — jangan campur `select` dan `include` di level yang sama."

**Sebut cepat — `createMany` untuk bulk insert (tidak perlu didemo panjang):**
```ts
await db.post.createMany({
  data: [
    { title: "Post 1", slug: "post-1", excerpt: "...", authorId: user.id },
    { title: "Post 2", slug: "post-2", excerpt: "...", authorId: user.id },
  ],
});
```
> "Bedanya dari `create` biasa: `createMany` tidak bisa nested relasi (`connect`/`create` di dalamnya), dan tidak mengembalikan record yang dibuat — cuma jumlahnya. Cocok buat seed data massal, bukan buat insert satu-satu yang butuh hasilnya langsung."

---

## 3. READ — query data (10 menit) — slide halaman 3

**Live-type — `findMany` dengan filter, sort, pagination:**

```ts
const posts = await db.post.findMany({
  where: { published: true, authorId: user.id },
  orderBy: { createdAt: "desc" },
  take: 10,   // limit
  skip: 0,    // offset, buat pagination
  select: { id: true, title: true, slug: true, createdAt: true },
});
```

> "`take` sama `skip` ini pasangan buat pagination sederhana — halaman kedua tinggal `skip: 10, take: 10`. Kita bahas lebih detail pola pagination-nya di Bab 7."

**Live-type — `findUnique`, tekankan constraint-nya:**

```ts
const foundUser = await db.user.findUnique({
  where: { email: "rizki@example.com" },
});
// foundUser: User | null
```

**Talking point:**
> "`findUnique` cuma bisa dipakai dengan field yang di schema-nya ditandai `@id` atau `@unique` — di model `User` kita, itu `id` atau `email`. Coba kalian taruh `where: { name: 'Rizki' }` di situ — bakal error TypeScript, karena `name` bukan unique field. Dan perhatikan return type-nya: `User | null`. **Selalu** bisa `null` kalau tidak ketemu — jangan lupa cek sebelum akses property-nya."

**Live-type — `findFirst`, bandingkan dengan `findUnique`:**

```ts
const latestPost = await db.post.findFirst({
  where: { authorId: user.id, published: true },
  orderBy: { createdAt: "desc" },
});
```

**Talking point — inilah jawaban kuis nanti:**
> "Kalau `findUnique` cuma bisa pakai field unique, `findFirst` bisa pakai kondisi **apa saja** — bahkan kombinasi kondisi yang sama sekali nggak unik, seperti di sini `authorId` + `published`. Bedanya dari `findMany`, `findFirst` cuma balikin **satu** record pertama yang cocok (dari hasil `orderBy` di atas, ini efektif jadi 'ambil post terbaru milik user ini')."

**Sebut cepat — `count`:**
```ts
const total = await db.post.count({ where: { published: true } });
```
> "Berguna banget buat nampilin 'Total: 42 artikel' tanpa perlu narik semua data-nya, cuma hitung."

---

## 4. UPDATE — mutasi data, fokus di atomic operations (10 menit) — slide halaman 4

**Live-type — `update` biasa dulu:**

```ts
const updated = await db.post.update({
  where: { id: post.id },   // harus field unique
  data: {
    title: "Judul Baru",
    published: true,
  },
});
```

**Sekarang bangun masalahnya sebelum kasih solusi atomic:**

> "Sekarang, gimana kalau kita mau nambah `viewCount` setiap kali post ini dibuka? Cara paling intuitif — tapi **salah** — begini:"

```ts
// ❌ JANGAN — race condition
const current = await db.post.findUnique({ where: { id: post.id } });
await db.post.update({
  where: { id: post.id },
  data: { viewCount: current!.viewCount + 1 },
});
```

> "Kelihatan masuk akal, tapi bayangin dua orang buka halaman post ini **bersamaan**, dalam hitungan milidetik. Request A baca `viewCount` = 10. Request B juga baca `viewCount` = 10 — sebelum request A sempat nulis hasilnya. Keduanya hitung 10+1=11, keduanya nulis 11. Padahal harusnya jadi 12. Satu view **hilang**, nggak ke-track. Ini yang namanya race condition."

**Live-type — solusi atomic:**

```ts
// ✅ BENAR — atomic, aman dari race condition
const viewed = await db.post.update({
  where: { id: post.id },
  data: {
    viewCount: { increment: 1 },
    updatedAt: new Date(),
  },
});
```

> "`{ increment: 1 }` ini bukan 'baca dulu di JavaScript, baru tambah' — ini diterjemahkan langsung jadi SQL `UPDATE ... SET "viewCount" = "viewCount" + 1`, dieksekusi **di dalam database**, atomic. Postgres yang jamin nggak ada dua request yang saling tabrakan. Operator lain yang sama-sama atomic: `{ decrement: 1 }`, `{ multiply: 2 }`, `{ divide: 2 }`."

**Sebut cepat — `updateMany`:**
```ts
const result = await db.post.updateMany({
  where: { authorId: user.id, published: false },
  data: { published: false },
});
console.log(`${result.count} post ter-update`);
```

**Live-type — `upsert`, bangun analoginya dulu:**

> "Kadang kalian butuh 'update kalau sudah ada, buat baru kalau belum ada' — dua langkah jadi satu. Contoh klasik: preferensi user."

```ts
const profile = await db.user.upsert({
  where: { email: "rizki@example.com" },
  update: { name: "Muhammad Rizki (updated)" },
  create: { email: "rizki@example.com", name: "Muhammad Rizki" },
});
```

> "Prisma cek dulu: ada `User` dengan email itu? Kalau ada, jalankan blok `update`. Kalau nggak ada, jalankan blok `create`. Satu query, idempotent — jalankan berkali-kali, hasilnya konsisten, nggak bikin duplikat."

---

## 5. DELETE — hapus data, dan peringatan keras soal deleteMany (7-8 menit) — slide halaman 4

**Live-type — delete satu record:**

```ts
const deleted = await db.post.delete({ where: { id: post.id } });
```

**Live-type — `deleteMany`, dengan `where` yang jelas dulu:**

```ts
const result = await db.post.deleteMany({
  where: {
    authorId: user.id,
    published: false,
    createdAt: { lt: new Date(Date.now() - 30 * 86400000) }, // lebih dari 30 hari
  },
});
console.log(`Deleted: ${result.count} posts`);
```

**Sekarang, ini bagian paling penting untuk ditekankan keras — jangan buru-buru lewat:**

> "Sekarang saya mau tunjukkan sesuatu yang bahaya. Perhatikan kalau `where`-nya saya hapus semua:"

```ts
// ⚠️ BAHAYA — jangan pernah jalankan ini tanpa sadar
await db.post.deleteMany({});
// atau bahkan tanpa argumen sama sekali:
await db.post.deleteMany();
```

> "Ini menghapus **SEMUA** baris di tabel `Post`. Semuanya. Dan Prisma **tidak** akan berhenti atau nanya konfirmasi — beda dari `migrate dev` yang tadi kita lihat suka nanya kalau destruktif. `deleteMany` di runtime aplikasi itu langsung eksekusi, karena ini memang dirancang untuk dipanggil dari kode, bukan dari terminal interaktif. Kalau ada bug di kode kalian yang bikin `where`-nya ke-generate kosong — misal karena variabel `undefined` dan lupa validasi — ini bisa kejadian di production tanpa kalian sadar sampai user lapor datanya hilang."

> "Aturan keras: **setiap** kali nulis `deleteMany`, cek dulu `where`-nya sebelum di-commit. Kalau perlu, tambahkan validasi eksplisit di kode kalian sendiri yang menolak `where` kosong."

**Live-type — pola yang lebih aman: soft delete:**

```ts
const softDeleted = await db.post.update({
  where: { id: post.id },
  data: { deletedAt: new Date() },   // field ini belum ada di schema kita
});
```

> "Ini bukan hapus beneran — cuma nandain 'kapan dianggap terhapus'. Datanya masih ada fisik di database, bisa di-restore kapan saja tinggal set `deletedAt` balik ke `null`. Field `deletedAt: DateTime?` ini **belum ada** di schema kita sekarang — nambahinnya jadi PR nomor 3 di homelab, sekalian latihan `migrate dev` lagi dari Bab 5."

**Talking point penutup bagian ini:**
> "Kalau pakai pola soft delete, satu konsekuensinya: **semua** query `findMany`/`findFirst` yang biasa kalian pakai sekarang harus ditambah `where: { deletedAt: null }`, supaya post yang 'terhapus' tidak ikut muncul. Ini gampang kelupaan — biasanya di-solve dengan bikin wrapper function sendiri di `lib/data/post.ts`, bukan manggil `db.post.findMany` langsung tiap kali."

---

## 6. Kuis cepat (3 menit) — slide halaman 5

1. Beda `findUnique` dan `findFirst`? → **B** (`findUnique` cuma untuk unique fields `@id`/`@unique`, `findFirst` bisa kondisi apapun)
2. Cara increment `viewCount` secara atomic? → **B** (`data: { viewCount: { increment: 1 } }` — atomic, aman dari race condition)
3. Risiko `db.post.deleteMany()` tanpa `where`? → **B** (hapus SEMUA records, tanpa konfirmasi dari Prisma)

Kalau ada yang jawab A di Q2, ulangi contoh race condition di bagian 4 — ini konsep yang gampang dikira "nggak penting kalau aplikasinya kecil", padahal ini soal korektnes, bukan skala.

---

## 7. Tutup + homelab (2 menit) — slide halaman 6-7

Rangkuman lisan:
- `create()` + `createMany()` untuk insert, nested `connect`/`create` untuk data relasi.
- `findUnique` (field unique) vs `findFirst` (kondisi bebas) — keduanya bisa return `null`.
- `{ increment: 1 }` dkk untuk atomic counter — lebih aman dari baca-lalu-tulis manual.
- `deleteMany` tanpa `where` = hapus semua. Selalu sertakan `where`.
- Soft delete: update `deletedAt`, bukan hapus fisik — lebih aman, bisa direstore.

Homelab — **sudah dieksekusi penuh** di project ini, siswa tinggal buka kode dan baca, atau replikasi pola yang sama di model lain:
1. **Create & Read** — `createPost(data)` dan `getPostBySlug(slug)` di `lib/data/post.ts`, dipanggil dari Server Action `createPostAction` di `app/posts/actions.ts`, ikut pola `app/blog/action.ts` yang sudah ada (`"use server"` di atas, panggil fungsi dari `lib/data/*.ts`, bukan `db` langsung di action). Dites lewat form nyata di `app/posts/page.tsx`.
2. **Update** — `updatePost(id, data)` dan `incrementPostViewCount(id)`, dipanggil otomatis tiap `app/posts/[slug]/page.tsx` dibuka.
3. **Soft Delete** — `Post.deletedAt DateTime?` sudah ditambah lewat migration, `softDeletePost(id)` sudah ada, dan semua query baca (`getPostBySlug`, `listPublishedPosts`) sudah difilter `deletedAt: null`.
4. **Upsert** — model `UserPreferences` sudah ditambah ke schema, `upsertUserPreferences` di `lib/data/user-preferences.ts` sudah dites idempotent (dipanggil 2x berturut-turut menghasilkan `id` yang sama, tidak duplikat).

Siswa yang ingin latihan sendiri: ganti model `Post` dengan model lain di project mereka, ikuti struktur file yang sama (`lib/data/<model>.ts` → `app/<route>/actions.ts` → page yang manggil action-nya).

Tutup: "Selanjutnya Bab 7 — Filtering, Sorting, Pagination & Transactions. CRUD dasar sudah di tangan kalian; sekarang kita perdalam cara query yang lebih kompleks dan gimana caranya beberapa operasi database dijalankan sebagai satu kesatuan yang aman."
