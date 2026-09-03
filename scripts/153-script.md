# Script Mengajar — 153.pdf: Prisma Generate & Migrate Deploy Pipeline

**Modul 15 · Deployment & Production — Bab 3**

## Slide 1 — ⚠️ KRITIS: migrate dev vs migrate deploy

**Durasi:** 8 menit

**Script:**
Ini bab yang judulnya sengaja dikasih tanda seru — karena kesalahan di sini itu paling nyebelin buat di-debug. Bayangin: kalian push kode, Vercel mulai build, terus... nge-hang. Gak ada error. Gak ada log yang jelas. Cuma stuck, sampai akhirnya timeout 30 menit terus deploy gagal. Penyebabnya hampir selalu satu hal: **`prisma migrate dev` dijalankan di CI/CD.**

Kenapa bisa gitu? Bedain dua command ini baik-baik:

**`prisma migrate dev`** — ini command buat **local development**:
1. Cek perbedaan `schema.prisma` vs database
2. Kalau ada beda, buat migration file baru
3. **Nunggu konfirmasi interaktif**: "Are you sure you want to create this migration? (y/n)"
4. CI/CD gak punya TTY (terminal interaktif) — jadi dia nunggu input yang gak akan pernah dateng, **selamanya**
5. Vercel build timeout setelah 30 menit
6. Deploy gagal, **tanpa error message yang jelas**

**`prisma migrate deploy`** — ini command buat **CI/CD**:
1. Baca folder `prisma/migrations/`
2. Cek migration mana yang belum di-apply ke database
3. Apply HANYA yang pending
4. **Tidak butuh konfirmasi interaktif**
5. Tidak buat migration file baru
6. Idempotent — aman dijalankan berkali-kali, gak akan re-apply migration yang udah jalan

Jadi aturannya: **`migrate dev` cuma buat: local development, bikin migration file baru, testing schema changes. `migrate deploy` buat: CI/CD, production.** Jangan pernah ketuker.

Real story yang sering kejadian: developer abis 30 menit debugging "silent deploy failure", ternyata gara-gara `migrate dev` nyangkut di Vercel build command. Jangan sampe kalian ngalamin ini.

### 🖥️ Live Coding

Kita cek apakah proyek kita udah "aman" dari jebakan ini.

1. **Cek `vercel.json`** yang kita buat di Bab 2 — pastikan pakai `migrate deploy`, bukan `migrate dev`:
   ```json
   {
     "buildCommand": "prisma generate && prisma migrate deploy && next build",
     "outputDirectory": ".next",
     "framework": "nextjs"
   }
   ```
   ✅ Sudah benar — `migrate deploy`, aman buat CI/CD.

2. **Cek script `db:migrate` di `package.json`** — proyek kita ternyata udah punya shortcut buat ini:
   ```json
   "db:migrate": "prisma migrate deploy"
   ```
   Ini script terpisah yang bisa dipanggil manual (`bun run db:migrate`) kalau kalian mau apply migration tanpa full build — misal lewat CI step terpisah, atau manual dari local ke database staging.

**✅ Verifikasi manual:**
```bash
grep -n "migrate" package.json vercel.json
```
Pastikan **tidak ada** satupun baris yang berbunyi `prisma migrate dev` di kedua file itu — kalau ada, itu bug yang harus difix sebelum deploy.

## Slide 2 — Full Deployment Pipeline

**Durasi:** 8 menit

**Script:**
Sekarang kita liat pipeline lengkap dari local sampai production, step by step, urutan yang gak boleh ditukar:

**Local development workflow:**
1. Ubah `schema.prisma` — tambah field, model, atau relasi
2. Buat migration file: `bunx prisma migrate dev --name "nama_migration_yang_deskriptif"`. Ini otomatis: bikin file migration di `prisma/migrations/timestamp_nama/`, generate ulang Prisma client, apply ke database lokal, dan jalanin seed kalau dikonfigurasi.
3. **Commit migration files** — ini WAJIB:
   ```bash
   git add prisma/migrations/
   git add prisma/schema.prisma
   git commit -m "feat: add published field to posts"
   git push origin main
   ```

**Vercel build pipeline (otomatis setelah push):**
- Step 1 — Install dependencies: `bun install` → otomatis trigger `postinstall` → `prisma generate`
- Step 2 — Build Command (dari `vercel.json` kita): `prisma generate && prisma migrate deploy && next build`

Kenapa `prisma generate` muncul dua kali (sekali di `postinstall`, sekali lagi eksplisit di `buildCommand`)? Karena dua trigger yang beda — `postinstall` jalan otomatis abis `bun install`, tapi `buildCommand` di `vercel.json` itu explicit dan self-contained, jadi walaupun `postinstall` somehow ke-skip, `prisma generate` tetep dijamin jalan sebelum `next build`. Idempotent, gak masalah dijalanin dua kali.

Proyek kita udah punya semua migration files ini beneran ke-commit — coba kita liat:

### 🖥️ Live Coding

1. **Konfirmasi migration files ada di git, bukan cuma lokal:**
   ```bash
   git ls-files prisma/migrations | head -10
   ```
   Kita punya 6 migration folder ter-track: `20260721152740_init`, `20260722162939_fix_post_content_typo`, `20260730153858_crud_user_post`, `20260803142007_pagination`, `20260819135158_add_better_auth`, `20260825011200_add_issuer_for_oauth`. Ini bukti nyata: setiap kali schema berubah di proyek ini, migration file-nya ikut ke-commit — persis alur yang barusan kita bahas.

2. **Test regenerasi client dari nol** — simulasi apa yang kejadian di Vercel container yang fresh:
   ```bash
   rm -rf generated/prisma
   bun install
   ls generated/prisma
   ```
   Kalau `postinstall` kerja bener, folder `generated/prisma` harus balik ada isinya (file `client.ts`, `models.ts`, dll) setelah `bun install` — **tanpa** kita jalanin `prisma generate` manual.

**✅ Verifikasi manual:**
Jalankan persis dua command di atas. Output yang bener kira-kira gini:
```
$ prisma generate
Loaded Prisma config from prisma.config.ts.
Prisma schema loaded from prisma/schema.prisma.
✔ Generated Prisma Client (7.9.0) to ./generated/prisma in ~30ms
```
Terus `ls generated/prisma` harus nunjukin file-file client (`client.ts`, `browser.ts`, `models.ts`, folder `models/`, dll) — kalau kosong atau folder gak ada, berarti `postinstall` gak jalan, itu bug yang sama kayak yang dibahas di troubleshooting slide berikutnya.

## Slide 3 — Troubleshooting Prisma di Vercel

**Durasi:** 6 menit

**Script:**
Tiga error paling umum yang bakal kalian temuin kalau ada yang salah di pipeline ini:

**Error: `Cannot find module './generated/prisma/client'`**
Sebab: Prisma client gak ke-generate. Bisa karena `postinstall` script gak jalan, atau path `output` di `schema.prisma` gak match sama import path di kode.
Fix: Cek `package.json` ada `"postinstall": "prisma generate"`. Cek `generator client { output = "..." }` di `schema.prisma` match sama import kalian — di proyek kita, itu `output = "../generated/prisma"`, dan kode kita import dari `@/generated/prisma/client` — konsisten.

**Error: `PrismaClientKnownRequestError` — connection refused**
Sebab: `DATABASE_URL` gak ke-set di Vercel, atau URL-nya salah — misal masih nunjuk ke `localhost` padahal harusnya cloud database URL.
Fix: Vercel → Settings → Env Vars → pastikan `DATABASE_URL` ke-set untuk environment Production, dan bukan `localhost`. Ini juga ke-cover otomatis sama validasi `lib/env.ts` kita dari Bab 1 — kalau `DATABASE_URL` kosong sama sekali, Zod bakal throw error jelas di build time, bukan connection error yang lebih membingungkan di runtime.

**P3009: migrate found failed migrations**
Sebab: ada migration yang gagal sebelumnya tapi masih tercatat di migration history, jadi database dan folder migration jadi gak sinkron.
Fix: cek Vercel logs buat detail migration mana yang gagal. Biasanya perlu `prisma migrate resolve --rolled-back <nama_migration>` buat mark migration itu sebagai failed secara manual, baru `migrate deploy` bisa lanjut ke migration berikutnya.

Gak ada live coding baru di slide ini — ini pure troubleshooting reference, gak ada state di proyek kita yang perlu diubah buat mensimulasikan errornya (butuh environment CI/CD beneran).

## Slide 4 — Kuis

**Durasi:** 5 menit

**Script:**

**Q1 — Mengapa `prisma migrate dev` menyebabkan Vercel build hang?**
Jawaban: **B) `migrate dev` menunggu konfirmasi interaktif 'y/n' yang tidak ada di CI/CD environment.**
Pembahasan: CI/CD gak punya TTY, jadi prompt konfirmasi itu nunggu selamanya sampai Vercel timeout di 30 menit.

**Q2 — Urutan yang benar di Vercel build command adalah?**
Jawaban: **B) `prisma generate → prisma migrate deploy → next build`.**
Pembahasan: generate dulu biar client TypeScript-nya ada (dibutuhin buat type-check saat `next build`), baru migrate biar schema database up to date, baru build aplikasinya. Ini persis isi `vercel.json` kita.

**Q3 — Mengapa migration files di `prisma/migrations/` harus di-commit ke git?**
Jawaban: **B) CI/CD (Vercel) membaca migration files dari repo untuk `migrate deploy`.**
Pembahasan: `migrate deploy` gak generate migration baru, dia cuma **baca** file yang udah ada di folder itu terus apply yang belum jalan. Kalau foldernya gak ke-commit, Vercel gak punya migration apapun buat di-apply — database production gak akan pernah ke-update.

## Slide 5 — Homelab: Tugas Mandiri

**Durasi:** 3 menit

**Script:**
Empat tugas setup dan test pipeline deployment:

**01 — `postinstall`:** Pastikan `package.json` punya `"postinstall": "prisma generate"`. Test: `rm -rf generated/` → `bun install` → cek apakah `generated/` kembali ada. *✅ Udah kita kerjain persis ini di live coding tadi — dan hasilnya bener, folder balik ke-generate.*

**02 — `vercel.json`:** Buat `vercel.json` di root dengan `buildCommand` yang benar. Push ke GitHub, cek Vercel build logs buat verifikasi urutan langkah. *✅ `vercel.json`-nya udah kita buat di Bab 2 — bagian push ke GitHub dan cek build logs itu PR kalian di proyek masing-masing, karena butuh akun Vercel beneran.*

**03 — Schema Change:** Tambahkan field baru ke schema. Jalankan `migrate dev` lokal. Commit migration files. Push → Vercel → verifikasi `migrate deploy` berhasil. *Belum kita kerjain di live coding — ini butuh perubahan schema yang scope-nya di luar bab ini (nambah field baru ke model beneran). Latihan ini buat kalian kerjain di proyek kalian sendiri.*

**04 — Build Test:** Sebelum push ke `main`, jalankan `bun run build` lokal. Target: zero TypeScript errors, zero build warnings. *Kita udah demoin di Bab 2 kalau proyek kita sendiri masih punya 4 TS error pre-existing di `app/uploads/inspect-action.ts` — itu contoh nyata kenapa checklist ini penting, dan itu PR yang harus difix sebelum proyek ini beneran di-deploy.*

> ⚠️ INGAT: `migrate dev` = local only. `migrate deploy` = CI/CD. Jangan tertukar!

## Slide 6 — Rangkuman

**Durasi:** 2 menit

**Script:**
Rekap Bab 3:
- `migrate dev` di CI/CD = hang selamanya. Gunakan `migrate deploy` untuk production.
- Urutan wajib: `prisma generate → prisma migrate deploy → next build`.
- `postinstall: prisma generate` di `package.json` — wajib agar client di-generate setelah `bun install`. Kita udah buktiin ini beneran jalan lewat test `rm -rf generated/`.
- Migration files WAJIB di-commit ke git — CI/CD baca dari repo untuk `migrate deploy`. Proyek kita udah konsisten soal ini, 6 migration folder semua ter-track.
- Error "Cannot find module" = `postinstall` gak jalan. Error connection = env vars salah — dan ini sebagian udah ke-cover otomatis sama validasi `lib/env.ts` dari Bab 1.

Selanjutnya Bab 4 — Logging, Error Monitoring & Connection Pooling. Setelah app kita jalan di production, gimana caranya kita tau kalau ada yang error tanpa nunggu user komplain?
