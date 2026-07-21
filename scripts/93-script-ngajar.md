# Naskah Live Demo — Modul 9 Bab 3: Prisma Schema, Model & Relasi

Durasi perkiraan: 40-45 menit (paling padat kode di modul ini). Fokus: bangun `schema.prisma` dari kosong sampai jadi schema blog lengkap, sambil jelasin tiap attribute begitu dipakai — bukan diceramahin dulu baru dipraktikkan.

## Prep sebelum kelas

- [ ] **Start Docker Desktop**, lalu `docker compose up -d` — supaya nanti pas live-coding sampai ke `prisma migrate dev`, benar-benar nyambung ke Postgres, bukan cuma baca schema.
- [ ] Kalau mau demo tanpa DB nyala dulu (misal waktu terbatas), boleh — `prisma format` dan `prisma validate` tidak butuh koneksi database, cuma `migrate dev`/`db push` yang butuh.
- [ ] Ingat: `prisma.config.ts` project ini saat ini pakai `process.env["DATABASE_URL"]`, bukan `env('DATABASE_URL')`. Ini sengaja dijadikan bahan ajar di bagian 4 — jangan diperbaiki duluan sebelum kelas.
- [ ] ⚠️ **Koreksi penting untuk versi Prisma 7.9.0 yang kita pakai**: slide halaman 2 menunjukkan `url = env("DATABASE_URL")` di dalam blok `datasource`. Ini **sudah tidak didukung lagi** — sudah dicoba langsung di editor dan errornya eksplisit: *"The datasource property `url` is no longer supported in schema files. Move connection URLs for Migrate to `prisma.config.ts` and pass either `adapter`... to the `PrismaClient` constructor."* Jangan ajarkan langkah itu sesuai slide mentah-mentah — lihat bagian 2 di bawah yang sudah disesuaikan.

---

## 1. Framing pembuka (2 menit)

> "Dua bab kemarin kita install Prisma dan siapin database-nya. Tapi `schema.prisma` kita masih kosong total — cuma ada `generator` sama `datasource`. Hari ini kita isi itu jadi schema project blog beneran: User, Post, Comment, lengkap sama relasinya. Ini bab paling penting di modul ini, karena schema ini yang jadi **satu sumber kebenaran** — dari sini Prisma generate types TypeScript-nya, generate SQL migration-nya, dan bentuk client-nya. Ubah satu baris di sini, semuanya ikut berubah otomatis."

---

## 2. Anatomi schema.prisma (8-10 menit) — live-coding, slide halaman 2

Buka `prisma/schema.prisma` — tunjukkan isinya sekarang cuma 2 blok:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
}
```

> "Dua blok ini sudah familiar dari Bab 1 — generator ngatur PrismaClient-nya digenerate ke mana, datasource ngatur provider database-nya."

**Live-demo koreksi penting (ini justru momen belajar yang bagus) — coba ketik dulu yang salah:**

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")   // <- coba tambahkan ini
}
```

Tunjukkan langsung error dari editor:
> `The datasource property 'url' is no longer supported in schema files. Move connection URLs for Migrate to prisma.config.ts and pass either 'adapter'... to the PrismaClient constructor.`

**Talking point — ini yang penting dipahami, bukan cuma dihafal:**
> "Di banyak tutorial Prisma yang kalian temukan — termasuk yang lama-lama — `url = env("DATABASE_URL")` di dalam `datasource` itu wajar. Tapi di Prisma 7.9.0 yang kita pakai, ini sudah **dilarang total**, bukan cuma tidak direkomendasikan. Kenapa? Karena Prisma 7 memisahkan dua kebutuhan koneksi yang dulu digabung jadi satu:
> 1. Koneksi buat **Prisma CLI** (`migrate`, `db push`, `studio`) — itu diatur di `prisma.config.ts`, yang sudah kita punya dari hasil `prisma init`.
> 2. Koneksi buat **PrismaClient di runtime aplikasi** — itu sekarang wajib lewat **driver adapter** yang di-pass langsung ke constructor `PrismaClient`, bukan dibaca otomatis dari schema.

> Jadi `datasource` block sekarang isinya cuma `provider`, penentu dialek SQL-nya doang. Urusan 'connect ke mana' dipisah total dari schema. Ini kita bahas detail banget di Bab 4 — Driver Adapter & Singleton — tapi kalian sudah lihat kenapa dari sekarang."

Hapus baris `url` yang tadi, balikin `datasource` jadi:

```prisma
datasource db {
  provider = "postgresql"
}
```

**Live-type — model pertama, `User`:**

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  role      UserRole @default(READER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum UserRole {
  READER
  AUTHOR
  ADMIN
}
```

**Jelaskan tiap baris begitu diketik (jangan borongan di akhir):**
- `@id @default(cuid())` — "Primary key, generate otomatis pakai `cuid()` — ID pendek yang bisa di-sort berdasarkan waktu dibuat. Alternatifnya `uuid()` kalau butuh standar UUID v4, atau `autoincrement()` kalau mau integer naik 1-1 kayak MySQL jaman dulu."
- `@unique` di `email` — "Database bakal nolak insert kalau email-nya sudah ada."
- `role UserRole @default(READER)` — "Ini contoh pakai enum. Enum-nya kita definisikan terpisah di bawah, `READER AUTHOR ADMIN`. Default-nya `READER` kalau tidak diisi."
- `@default(now())` vs `@updatedAt` — "`now()` isi sekali pas record dibuat. `@updatedAt` beda — dia **auto-update** setiap kali record ini di-update, tanpa kita tulis manual."

**Talking point tambahan (sebut, tidak perlu didemo semua):** `@map("column_name")` dan `@@map("table_name")` — "Ini dipakai kalau nama field di TypeScript kalian mau beda sama nama kolom di database — misal kalian mau tetap pakai `camelCase` di kode tapi tabel di database pakai `snake_case`."

---

## 3. Relasi — one-to-many dulu (10 menit) — slide halaman 3

> "Sekarang bagian paling sering bikin bingung pemula: relasi. Kita mulai dari yang paling umum — one-to-many. Satu User bisa punya banyak Post."

**Live-type — tambahkan ke model `User`:**

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  role      UserRole @default(READER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  posts     Post[]
}
```

**Live-type — model `Post` baru:**

```prisma
model Post {
  id         String   @id @default(cuid())
  title      String
  slug       String   @unique
  content    String
  published  Boolean  @default(false)
  viewCount  Int      @default(0)

  authorId   String
  author     User     @relation(fields: [authorId], references: [id], onDelete: Cascade)

  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

**Talking point, bedah baris relasinya khusus:**
> "Perhatikan, `posts Post[]` di `User` itu cuma **penanda arah relasi** buat TypeScript — dia nggak bikin kolom apa pun di database. Yang beneran jadi kolom itu di `Post`: `authorId String`, foreign key wajib ada manual, baru `author User @relation(fields: [authorId], references: [id])` yang bilang ke Prisma 'kolom `authorId` ini nunjuk ke `id`-nya `User`'."

> "`onDelete: Cascade` — kalau User-nya dihapus, semua Post miliknya ikut kehapus otomatis. Tanpa ini, defaultnya Prisma/Postgres bakal **menolak** hapus User yang masih punya Post — biar data tidak yatim piatu."

---

## 4. Relasi lanjutan — many-to-many & one-to-one (8 menit, boleh dipercepat kalau waktu mepet)

Ini konsep tambahan di luar yang wajib ada di homelab — cukup didemo di **scratch file terpisah** (jangan ditaruh permanen di schema utama), supaya siswa paham konsepnya tanpa bikin schema project kebanyakan model yang tidak dipakai.

**Many-to-many implicit** (paling simpel, cukup ditulis dua baris):

```prisma
model Post { tags Tag[] }
model Tag  { posts Post[] }
// Prisma otomatis bikin join table tersembunyi: _PostToTag
```

> "Ini yang paling gampang — tinggal saling nunjuk array, Prisma yang bikinin tabel penghubungnya sendiri di belakang layar. Tapi ada batasnya."

**Many-to-many explicit** — kapan dibutuhkan:

```prisma
model Post {
  tagLinks PostTag[]
}
model Tag {
  postLinks PostTag[]
}
model PostTag {
  postId  String
  tagId   String
  addedAt DateTime @default(now())

  post    Post     @relation(fields: [postId], references: [id])
  tag     Tag      @relation(fields: [tagId], references: [id])

  @@id([postId, tagId])
}
```

> "Bedanya cuma satu: implicit itu join table-nya **tidak bisa** kalian tambah kolom sendiri. Begitu kalian butuh nyimpen info tambahan di relasinya — contoh di sini `addedAt`, kapan tag itu ditempelkan ke post — kalian **wajib** bikin model join sendiri, eksplisit. `@@id([postId, tagId])` itu composite primary key, gabungan dua kolom jadi satu primary key."

**One-to-one** (cukup disebut + tunjuk contoh, tidak perlu ditulis panjang):

```prisma
model User    { profile Profile? }
model Profile { userId String @unique; user User @relation(fields: [userId], references: [id]) }
```

> "Kuncinya di sini: `@unique` di `userId`. Itu yang bikin relasinya jadi one-to-one, bukan one-to-many — karena satu `userId` cuma boleh muncul sekali di tabel `Profile`."

---

## 5. Selesaikan schema sesuai homelab — tambah `Comment` (5 menit)

> "Balik ke schema utama kita. Homelab minta satu model lagi: `Comment`, dengan dua relasi one-to-many — dari `Post` dan dari `User`."

**Live-type:**

```prisma
model Comment {
  id        String   @id @default(cuid())
  content   String

  postId    String
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)

  authorId  String
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
}
```

Jangan lupa tambahkan balik-relasi di `Post` dan `User`:

```prisma
model User {
  // ...field lain
  posts    Post[]
  comments Comment[]
}

model Post {
  // ...field lain
  comments Comment[]
}
```

> "Perhatikan `Comment` ini contoh model yang punya **dua** foreign key ke tabel berbeda sekaligus — `postId` ke `Post`, `authorId` ke `User`. Ini normal, satu model boleh punya banyak relasi keluar."

---

## 6. prisma.config.ts — upgrade ke env() (5 menit) — slide halaman 4

Buka `prisma.config.ts`, tunjukkan isinya sekarang:

```ts
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
```

> "Ini hasil generate default. Perhatikan baris terakhir: `process.env["DATABASE_URL"]`. Ini **jalan**, tapi bukan cara yang direkomendasikan Prisma 7. Kenapa?"

**Live-edit — ganti ke `env()`:**

```ts
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
```

**Talking point sambil hover ke `process.env["DATABASE_URL"]` vs `env("DATABASE_URL")`:**
> "`process.env["DATABASE_URL"]` tipenya `string | undefined` — TypeScript nggak maksa kalian cek dulu sebelum pakai, kalau env var-nya lupa diisi, error-nya baru muncul pas runtime, ngambang di tengah proses. `env(...)` dari `prisma/config` itu type-safe — kalau variabelnya nggak ada, dia **error duluan**, jelas dan cepat ketahuan."

**Catatan penting yang wajib disebut, sering disalahpahami:**
> "Yang perlu digarisbawahi: `prisma.config.ts` ini **bukan pengganti** `.env`. File ini cuma ngatur *bagaimana Prisma CLI baca konfigurasinya* — command `migrate`, `push`, `generate`. Nilai variabelnya sendiri tetap harus ada di `.env`. Dan tanpa `prisma.config.ts` ini ada, command macam `prisma migrate dev` di Prisma 7 malah **akan error** — beda dari Prisma 6 yang masih auto-detect dari `package.json`."

> "Ini juga jawaban kenapa tadi kita hapus `url` dari `datasource` di schema. `prisma.config.ts` yang barusan kita edit ini — yang sekarang pegang `DATABASE_URL` buat kebutuhan CLI (`migrate`, `db push`, `studio`). Sementara PrismaClient yang dipakai di kode aplikasi kalian nanti (Bab 4) butuh cara sendiri buat connect, lewat driver adapter, bukan baca dari sini. Tiga tempat, tiga tanggung jawab beda: schema cuma definisi struktur, `prisma.config.ts` buat CLI, adapter buat runtime."

---

## 7. Jalankan & verifikasi (5-7 menit)

```bash
bunx prisma format
```
> "Ini auto-rapiin indentasi & alignment schema kalian. Jalankan tiap habis ubah schema, jadi kebiasaan."

```bash
bunx prisma validate
```
> "Ini cek schema-nya valid secara sintaks — belum coba konek ke database. Kalau ada typo tipe data atau relasi yang nunjuk ke model yang nggak ada, ketahuan di sini."

Kalau Docker sudah jalan (`docker compose up -d` sudah dilakukan sebelumnya):

```bash
bunx prisma migrate dev --name init
```

> "Perhatikan output-nya — Prisma generate file SQL migration di `prisma/migrations/`, jalankan ke database Docker kita, terus regenerate PrismaClient-nya juga. Satu perintah, tiga hal sekaligus: SQL, types, client — semuanya sinkron otomatis. Ini yang dimaksud 'schema sebagai satu sumber kebenaran' di judul slide tadi."

```bash
bunx prisma studio
```
Tunjukkan tabel `User`, `Post`, `Comment` sudah muncul dengan kolom-kolom sesuai schema.

---

## 8. Kuis cepat (3 menit) — slide halaman 5

1. Selain `provider`, apa yang wajib ada di generator block Prisma 7? → **B** (`output = "../path/to/generated"`)
2. Beda many-to-many implicit vs explicit? → **B** (explicit pakai model join sendiri, berguna kalau join table butuh field tambahan)
3. `prisma.config.ts` dipakai oleh apa? → **B** (Prisma CLI — migrate, push, dll — bukan runtime aplikasi)

Kalau ada yang jawab C di Q3, tekankan lagi: file ini tidak ikut ke-bundle ke aplikasi Next.js yang jalan di production, cuma dipakai pas kalian ketik command `prisma ...` di terminal.

---

## 9. Tutup + homelab (2 menit) — slide halaman 6-7

Rangkuman lisan:
- `schema.prisma` = generator (output wajib!) + datasource + models.
- Field attributes: `@id`, `@unique`, `@default(cuid())`, `@updatedAt`, `@relation`.
- Relasi: one-to-many (yang kita pakai di `User`→`Post`→`Comment`), many-to-many implicit/explicit, one-to-one.
- `prisma.config.ts` wajib ada untuk migrate commands di Prisma 7, pakai `env()` bukan `process.env`.

Homelab (sudah kebanyakan terselesaikan live kalau demo di atas diikuti penuh — tinggal minta siswa replikasi sendiri di project masing-masing):
1. `schema.prisma` — model `User`, `Post`, `Comment` (sudah didemo persis).
2. Relasi + `onDelete: Cascade` di semua FK (sudah didemo).
3. `prisma.config.ts` — schema path, migration path, seed command (sudah didemo, tinggal siswa bikin `prisma/seed.ts`-nya sendiri kalau mau `seed` beneran jalan).
4. `bunx prisma validate` dan `bunx prisma format`, commit schema yang bersih.

Tutup: "Selanjutnya Bab 4 — Driver Adapter & Singleton di Next.js. Kita bakal bahas gimana caranya PrismaClient ini dipakai dengan benar di Next.js supaya nggak bikin banyak koneksi database yang mubazir."
