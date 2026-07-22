# Naskah Live Demo — Modul 9 Bab 5: Migrations (migrate dev vs migrate deploy)

Durasi perkiraan: 30-35 menit. Bab ini **sudah dieksekusi penuh** di branch `coba-95` sebagai persiapan — semua command di bawah sudah dicoba nyata terhadap Postgres di Docker, bukan cuma teori. Live demo di kelas tinggal mengulang langkah yang sama di layar.

## Status project setelah eksekusi (jangan diulang sebelum kelas, cukup direview)

- [x] Docker Postgres jalan (`docker compose ps` → healthy).
- [x] Ditemukan bug nyata di schema: field `Post.contet` (typo, harusnya `content`) — sudah diperbaiki lewat migration `fix_post_content_typo`.
- [x] Field baru `Post.excerpt String?` ditambahkan lewat migration `add_post_excerpt`.
- [x] `bunx prisma migrate deploy` dites — hasilnya "No pending migrations to apply" (idempotent, sesuai teori).
- [x] `bunx prisma db push` dites di schema yang sudah sinkron — hasilnya "already in sync", tanpa bikin file migration.
- [x] Prisma Studio dites jalan di port 5555 (HTTP 200), lalu dimatikan lagi.
- [x] `package.json` — `build` sekarang `"prisma generate && next build"`, ditambah script `"db:migrate": "prisma migrate deploy"`.
- [x] 3 user baru berhasil di-insert & di-query lewat `db.user.findMany()` — koneksi dan singleton dari Bab 4 terbukti masih berfungsi.

**Kenapa ini penting disebut ke siswa:** bug `contet` yang ditemukan ini bukan contoh buatan — itu benar-benar ada di schema project sebelum bab ini dimulai. Ini momen bagus buat bilang: "migration itu bukan cuma buat nambah fitur, tapi juga cara **aman** memperbaiki kesalahan schema yang sudah kepasang di database."

---

## 1. Framing pembuka (2 menit)

> "Sampai sekarang, tiap kali kita ubah `schema.prisma`, kita jalankan `prisma migrate dev` tanpa mikir dua kali. Tapi ada command lain, `prisma migrate deploy`, dan ada juga `prisma db push`. Ketiganya kelihatan mirip — sama-sama 'menyamakan database dengan schema' — tapi kalau salah pakai yang mana di production, ini salah satu cara paling gampang bikin data pelanggan hilang. Hari ini kita bedah tiga command ini satu-satu, plus kenalan sama Prisma Studio."

---

## 2. `migrate dev` — dan bug asli yang jadi bahan latihan (10 menit) — slide halaman 2

**Live-code — buka `prisma/schema.prisma`, tunjukkan model `Post`:**

```prisma
model Post {
  id        String  @id @default(cuid())
  title     String
  slug      String  @unique
  contet    String        // <- perhatikan ini
  published Boolean @default(false)
  viewCount Int     @default(0)
  // ...
}
```

> "Coba perhatikan baik-baik nama field ini. `contet`. Bukan typo saya — ini beneran ada di schema kita dari Bab 3. Siapa yang baru sadar?"

(Biarkan siswa merespons dulu — ini technique yang bagus buat ngetes seberapa teliti mereka baca kode sebelumnya.)

**Live-type — perbaiki:**

```prisma
content   String
```

**Jalankan di terminal:**

```bash
bunx prisma migrate dev --name fix_post_content_typo
```

**Tunjukkan output-nya persis (sudah dijalankan sebelumnya, hasilnya):**
```
Applying migration `20260722154056_fix_post_content_typo`

The following migration(s) have been created and applied from new schema changes:

prisma/migrations/
  └─ 20260722154056_fix_post_content_typo/
    └─ migration.sql

Your database is now in sync with your schema.
```

**Buka file SQL yang dibuat, `prisma/migrations/20260722154056_fix_post_content_typo/migration.sql`:**

```sql
/*
  Warnings:

  - You are about to drop the column `contet` on the `Post` table. All the data in the column will be lost.
  - Added the required column `content` to the `Post` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Post" DROP COLUMN "contet",
ADD COLUMN     "content" TEXT NOT NULL;
```

**Talking point — ini bagian paling penting:**
> "Baca komentar `Warnings` di atas SQL-nya. Prisma **secara eksplisit** bilang: ini bakal drop kolom lama, dan semua data di kolom itu hilang. Karena tabel `Post` kita masih kosong, ini lewat tanpa masalah. Tapi kalau tabel ini sudah ada 10.000 baris data asli, Prisma CLI bakal **berhenti dan minta konfirmasi eksplisit** sebelum jalan — nggak langsung eksekusi diam-diam. Ini yang dimaksud slide tadi: `migrate dev` 'minta konfirmasi jika destructive'."

**Live-type — demo kedua, tambah field baru (non-destruktif), ganti dari homelab 'tambah published' jadi 'tambah excerpt' karena `published` sudah ada dari Bab 3:**

```prisma
model Post {
  // ...
  content   String
  excerpt   String?
  published Boolean @default(false)
  // ...
}
```

```bash
bunx prisma migrate dev --name add_post_excerpt
```

Buka SQL hasilnya:
```sql
-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "excerpt" TEXT;
```

**Talking point, bandingkan dua migration yang baru dibuat:**
> "Lihat bedanya. Migration pertama tadi ada warning destruktif — drop kolom, data bisa hilang. Migration ini kosong dari warning — kenapa? Karena `excerpt` itu `String?`, alias **nullable/optional**. Nambah kolom nullable itu selalu aman, baris lama otomatis diisi `NULL`. Ini kebiasaan bagus: kalau nambah field baru ke tabel yang sudah ada isinya, bikin dulu nullable atau kasih `@default(...)`, biar migration-nya nggak destruktif."

**Live-run — commit migration ke git (tekankan ini WAJIB):**

```bash
git add prisma/migrations prisma/schema.prisma
git commit -m "fix: perbaiki typo content, tambah field excerpt"
```

> "`prisma/migrations/` itu bukan file buangan yang boleh di-gitignore. Ini **riwayat versi database** kalian — persis kayak git history buat kode. Tanpa ini ke-commit, teman satu tim kalian nggak akan pernah tahu ada perubahan schema ini, dan `migrate deploy` di server production nggak akan nemu apa-apa buat di-apply."

**Kapan pakai `migrate dev` — bacakan cepat dari slide:**
✅ Tambah model baru, tambah/ubah field, tambah/hapus relasi, ubah constraint/index.
❌ **Jangan pernah** di production. ❌ Jangan di CI/CD ke staging.

---

## 3. `migrate deploy` — untuk production (7 menit) — slide halaman 3

**Talking point pembuka:**
> "Sekarang bayangin kalian mau deploy ke production. Server production itu **tidak boleh** bikin migration baru sendiri — nggak ada yang jaga di sana buat konfirmasi kalau ada perubahan destruktif. Makanya ada command terpisah: `migrate deploy`."

**Live-run — coba jalankan sekarang, tunjukkan hasilnya:**

```bash
bunx prisma migrate deploy
```

Output (sudah dicoba, persis begini):
```
3 migrations found in prisma/migrations

No pending migrations to apply.
```

**Talking point:**
> "Perhatikan, dia bilang 'No pending migrations to apply' — bukan error, bukan nge-generate apa-apa baru. Karena migration yang kita buat barusan **sudah** ke-apply lewat `migrate dev` tadi. `migrate deploy` sifatnya cuma **membaca** folder `prisma/migrations/`, cek mana yang belum jalan di database ini, terus jalankan yang belum saja. Kalau semua sudah jalan, dia diam — nggak ngapa-ngapain. Makanya aman dijalankan **berkali-kali**, ini yang disebut idempotent."

**Live-edit — update `package.json`:**

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "lint": "eslint",
    "postinstall": "prisma generate",
    "db:migrate": "prisma migrate deploy"
  }
}
```

> "Dua perubahan: `build` sekarang generate ulang Prisma Client dulu sebelum build Next.js — jaga-jaga kalau ada yang lupa jalanin generate manual. Terus ada script baru `db:migrate` yang manggil `migrate deploy` — ini yang nanti dipanggil di build command Vercel atau CI/CD, **bukan** `migrate dev`."

**Sebut config Vercel (cukup dibaca, tidak perlu didemo beneran deploy):**
```
# Build Command di Vercel:
prisma generate && prisma migrate deploy && next build
```

**Tabel perbedaan, tulis di papan:**

| | `migrate dev` | `migrate deploy` |
|---|---|---|
| Bikin migration baru? | Ya | Tidak — cuma apply yang sudah ada |
| Interaktif (minta konfirmasi)? | Ya, kalau destruktif | Tidak pernah |
| Aman di CI/CD? | Tidak | Ya |
| Jalankan seed? | Ya (kalau dikonfigurasi) | Tidak |

---

## 4. `db push` — prototyping, dan kenapa beda dari migrate (5 menit) — slide halaman 4

**Live-run:**

```bash
bunx prisma db push
```

Output (sudah dicoba):
```
The database is already in sync with the Prisma schema.
```

**Talking point:**
> "Hasilnya kelihatan mirip `migrate deploy` — sama-sama bilang 'sudah sinkron'. Tapi mekanismenya beda total. Coba cek folder `prisma/migrations/` setelah ini — nggak ada file baru. `db push` itu **langsung** ubah struktur database biar cocok sama schema saat ini, tanpa nyatet riwayatnya di mana pun. Kalau `migrate dev` itu kayak nulis commit message tiap perubahan, `db push` itu kayak langsung `git push --force` tanpa commit — cepat, tapi nggak ada jejak yang bisa di-rollback atau di-review."

**Kapan boleh pakai `db push`:**
✅ Proof of concept, eksplorasi awal schema, masih belum yakin desain modelnya final.
❌ **Jangan** dipakai lagi begitu project sudah punya data production — resiko-nya, perubahan destruktif bisa jalan **tanpa peringatan sama sekali**, beda dari `migrate dev` yang masih nanya dulu.

---

## 5. Prisma Studio (5 menit) — slide halaman 4

**Live-run:**

```bash
bunx prisma studio
```

> "Ini buka GUI di browser, `http://localhost:5555`. Prisma 7 sudah bundling Studio langsung — kalian nggak perlu install package terpisah kayak versi sebelum-sebelumnya."

Di browser, tunjukkan:
- Buka tabel `User` — sudah ada beberapa baris dari test sebelumnya.
- Klik "Add record" — isi user baru manual lewat form, bukan lewat kode.
- Klik salah satu `Post`, tunjukkan relasi `author` bisa di-klik langsung ke User terkait.

**Talking point:**
> "Ini yang paling sering dipakai buat debug: 'kok data user ini nggak update ya?' — daripada nulis query manual tiap kali, buka Studio, cek langsung. Juga berguna banget buat verifikasi migration barusan beneran nge-apply perubahan yang benar."

Tutup Studio dengan `Ctrl+C` di terminal setelah selesai didemokan — jangan biarkan nyala terus sepanjang kelas kalau tidak dipakai (biar port 5555 nggak bentrok kalau siswa nyoba sendiri).

---

## 6. Kuis cepat (3 menit) — slide halaman 5

1. Beda utama `migrate dev` vs `migrate deploy`? → **B** (`migrate dev` bikin migration baru untuk development; `migrate deploy` cuma apply yang sudah ada, untuk production)
2. Kapan file migration sebaiknya di-commit ke git? → **B** (segera setelah dibuat dengan `migrate dev` — ini database version control)
3. Risiko utama `db push` di production? → **B** (tidak ada migration history, schema berubah tanpa record, bisa destruktif tanpa warning)

---

## 7. Tutup + homelab (2 menit) — slide halaman 6-7

Rangkuman lisan:
- `migrate dev`: development — buat file SQL + apply + generate client.
- `migrate deploy`: production — hanya apply pending migrations, tidak destruktif, idempotent.
- Migration files **selalu** di-commit ke git — riwayat versi database.
- `db push`: prototyping cepat, tidak untuk project dengan data production nyata.
- Prisma Studio: GUI browser buat browse, edit, debug data.

Homelab (sudah selesai dieksekusi penuh di project ini — siswa tinggal replikasi di project masing-masing dengan schema mereka sendiri):
1. Initial migration — sudah ada dari Bab 3/4 (`20260721152740_init`).
2. Schema change — di project ini didemokan lewat 2 migration: fix typo (`fix_post_content_typo`) dan tambah field (`add_post_excerpt`).
3. Prisma Studio — sudah didemo, siswa tambah 2-3 user manual sendiri lalu verifikasi lewat `db.user.findMany()`.
4. Deploy script — `package.json` sudah diupdate (`build` + `db:migrate`), tinggal commit.

Tutup: "Selanjutnya Bab 6 — CRUD: insert, update, delete, query. Sekarang schema dan migration kita sudah rapi, saatnya benar-benar pakai `db` buat operasi data sehari-hari."
