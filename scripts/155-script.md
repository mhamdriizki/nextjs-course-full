# Script Mengajar — 155.pdf: Security Checklist Production

**Modul 15 · Deployment & Production — Bab 5 (terakhir!)**

## Slide 1 — Update Dependencies: Patch CVE Secara Rutin

**Durasi:** 8 menit

**Script:**
Bab terakhir Modul 15. Sebelum kalian launch, ada tiga pilar security yang harus dicek: update dependencies, validasi input, dan rate limiting. Kita mulai dari yang paling gampang dilupain: **dependencies lama**.

Slide nyebut `CVE-2025-29927` — itu CVE beneran di Next.js soal middleware bypass authorization, cukup serius. Poinnya: dependency yang jarang di-update itu bukan cuma "kurang fitur baru", tapi **vulnerability aktif yang nunggu di-exploit**.

Command yang perlu kalian apal:
- `bun outdated` — nunjukin semua package + versi current vs terbaru.
- `bun audit` — nunjukin CVE yang affect dependencies kalian.
- `bun update next`, `bun update react react-dom`, dst — update satu package spesifik (safe kalau minor/patch).
- `bun update` — update semua ke versi minor/patch (aman).
- **JANGAN update major tanpa testing** — baca CHANGELOG dulu, major version = kemungkinan breaking changes.
- Setelah update: **selalu test** — `bun run build`, `bun run dev`, jalanin test kalau ada.
- Otomasi: Dependabot bikin PR otomatis mingguan buat update dependencies.

### 🖥️ Live Coding

Kita jalanin audit beneran di proyek kita — bukan simulasi, ini hasil asli dari codebase kita sekarang.

1. **Cek dependencies yang outdated:**
   ```bash
   bun outdated
   ```

2. **Cek vulnerability yang diketahui:**
   ```bash
   bun audit
   ```

**✅ Hasil beneran dari proyek kita (dijalankan barusan):**

`bun outdated` nunjukin beberapa package punya update minor/patch tersedia, contoh: `zod` 4.4.3 → 4.5.4, `@prisma/client` 7.9.0 → 7.10.0, `better-auth` 1.7.1 → 1.7.2, `next` 16.2.10 → 16.3.4 (patch, aman), `react`/`react-dom` 19.2.4 → 19.2.8. Semua ini minor/patch — aman di-`bun update`.

`bun audit` nemuin **50 vulnerabilities (28 high, 21 moderate, 1 low)**. Tapi — dan ini poin penting yang harus kalian pahami, bukan cuma "50 vulnerabilities, panik" — coba liat DARI MANA asalnya:
```
qs  >=6.14.2 <=6.15.3
  shadcn › @modelcontextprotocol/sdk › express › body-parser › qs

deepmerge-ts  <8.0.0
  prisma › @prisma/config › deepmerge-ts

brace-expansion  <1.1.17
  eslint › @eslint/eslintrc › minimatch › brace-expansion
```
Semua chain-nya lewat `shadcn` (CLI tool buat generate komponen — **devDependency**, cuma jalan pas kalian ngetik `bunx shadcn add`), `prisma` (CLI dev tool, bukan `@prisma/client` yang jalan di runtime), dan `eslint`. **Bukan satupun** yang ke-bundle ke aplikasi production kalian sebenernya — ini semua tooling development. Tetep worth di-update (`bun update`), tapi ini beda urgency-nya sama misalnya CVE di `next` atau `react-dom` yang beneran jalan di server production kalian.

Cara baca `bun audit` yang bener: cek dulu apakah package yang kena itu **direct runtime dependency** (ada di `"dependencies"` di `package.json` dan beneran di-import kode kalian) atau **transitive devDependency** (cuma numpang lewat tooling). Prioritaskan yang pertama.

**✅ Verifikasi manual:**
Jalankan `bun audit` sendiri, terus cek: apakah ada CVE yang chain-nya **tidak** lewat `shadcn`/`eslint`/`prisma` (dev tooling)? Kalau ada yang langsung dari `next`, `react`, `better-auth`, atau `@prisma/client` — itu prioritas nomor satu buat di-update sebelum launch.

## Slide 2 — Validasi Input & Rate Limiting (divider)

**Durasi:** 1 menit

**Script:**
Slide pembatas — dua pilar berikutnya: semua input dari user harus divalidasi, dan rate limiting buat cegah abuse/DoS. Kita bahas detail di slide checklist berikutnya.

## Slide 3 — Production Security Checklist

**Durasi:** 10 menit

**Script:**
Ini checklist penuh, dibagi 4 kategori. Alih-alih cuma baca daftarnya, kita **audit beneran** proyek kita item per item — dan bakal ada temuan menarik.

**Authentication:**
- ✅ Session check di setiap protected page dan Server Action
- ✅ RBAC check untuk admin-only features
- ✅ `BETTER_AUTH_URL` = production URL (udah kita bahas Bab 2)
- ✅ OAuth redirect URIs diupdate ke production domain (Bab 2)

**Data Security:**
- ✅ Semua input divalidasi dengan Zod
- ✅ Ownership check: `WHERE userId = session.user.id`
- ✅ Tidak ada SQL injection via `$queryRaw` tanpa sanitasi
- ✅ File upload: MIME + size validation + random filename

**Dependencies:**
- Next.js 16+ (fix CVE-2025-29927)
- `bun audit`: tidak ada critical vulnerability
- Dependabot atau update rutin terjadwal
- CHANGELOG dibaca sebelum major update

**Infrastructure:**
- HTTPS enforced (Vercel otomatis)
- Env vars di Vercel dashboard, bukan di file yang di-commit (Bab 1-2)
- Rate limiting untuk endpoints publik dan mutasi
- Error monitoring (Sentry) untuk tangkap error production (Bab 4)

### 🖥️ Live Coding

**Audit Authentication & Data Security — cek beneran, bukan asumsi:**

1. **Session check di Server Actions:**
   ```bash
   grep -rl "auth.api.getSession\|getSession(" app lib --include="*.ts" --include="*.tsx"
   ```
   Hasil: 6 file. ✅ ada session check yang dipakai berulang.

2. **RBAC check:**
   ```bash
   grep -n "role ===" app/posts/action.ts
   ```
   Hasil, di `app/posts/action.ts`:
   ```ts
   const isAdmin = session.user.role === "ADMIN";
   // ADMIN : authorId di skip -> bisa hapus post siapapun
   await softDeletePost(id, isAdmin ? undefined : session.user.id);
   ```
   ✅ Ini SEKALIGUS RBAC check DAN ownership check dalam satu baris — admin bisa hapus post siapapun (authorId di-skip), user biasa cuma bisa hapus post dia sendiri (authorId di-pass ke `softDeletePost`, yang query-nya `where: authorId ? { id, authorId } : { id }` di `lib/data/post.ts`). Ini persis pola checklist "ownership check: WHERE userId = session.user.id".

3. **SQL injection via raw query:**
   ```bash
   grep -rl "\$queryRaw\|\$executeRaw" app lib --include="*.ts"
   ```
   Hasil: kosong, gak ada satupun pemakaian `$queryRaw`/`$executeRaw` di proyek ini. ✅ Semua query lewat Prisma Client typed methods (`db.post.findMany`, dst) — otomatis ter-parameterize, gak ada celah SQL injection dari raw string interpolation.

4. **File upload validation — ini bagian yang nemuin bug beneran.** Buka `lib/validation/file.ts`:
   ```ts
   export const MAX_IMG = 5*1024*1024; // 5mb max
   const MAX_DOC = 10&1024*1024; // 10mb max
   ```
   Perhatiin baris kedua. `10&1024*1024` — itu **bitwise AND** (`&`), bukan perkalian (`*`)! Ini bug ketikan yang gampang kelewat karena `&` dan `*` posisinya deket di keyboard, dan JavaScript gak error — dia tetep jalan, cuma hasilnya salah total.

   Kita hitung: `10 & (1024*1024)` = `10 & 1048576`. Dalam binary, `10` = `...00001010`, `1048576` = `2^20` = `...100000000000000000000`. Gak ada bit yang overlap, jadi hasilnya **0**. Artinya `documentFileSchema` punya `.max(0, ...)` — validasi ini nolak SEMUA upload dokumen, walopun ukurannya 1 byte! Ini bug fungsional yang nyamar jadi "security validation", padahal validasinya sendiri rusak.

   **Fix:**
   ```ts
   const MAX_DOC = 10*1024*1024; // 10mb max
   ```

   Setelah fix, `documentFileSchema.max(10485760, ...)` — batas 10MB yang bener, sesuai komentar aslinya.

   ✅ MIME type validation-nya sendiri udah bener (poin lain di checklist): `imageFileSchema` pakai `.mime([...IMAGE_TYPES], ...)` dari Zod — itu validasi tipe file yang proper, bukan cuma cek ekstensi nama file.

**Audit Infrastructure:**

5. **Rate limiting:**
   ```bash
   grep -rl "ratelimit\|upstash\|rate-limit" app lib --include="*.ts"
   ```
   Hasil: **kosong**. Ini **gap beneran** di checklist kita — belum ada rate limiting sama sekali di proyek ini. Endpoint kayak login atau create post bisa di-spam tanpa batas. Ini persis Homelab task 02 — belum kita kerjain di live coding karena butuh akun Upstash (external service), tapi ini temuan valid yang harus kalian tindaklanjuti sebelum launch beneran.

**✅ Verifikasi manual:**
1. `bunx tsc --noEmit` — pastikan fix `lib/validation/file.ts` gak nambah error baru (4 error pre-existing di `app/uploads/inspect-action.ts` tetep gak berhubungan).
2. Test schema yang udah difix:
   ```bash
   bun -e "
   import('./lib/validation/file.ts').then(({documentFileSchema}) => {
     // Bikin File 1MB, harus valid sekarang (sebelum fix: reject semua ukuran)
     const buf = new Uint8Array(1024*1024);
     const file = new File([buf], 'test.pdf', { type: 'application/pdf' });
     const result = documentFileSchema.safeParse(file);
     console.log('1MB PDF valid setelah fix:', result.success);
   });
   "
   ```
   Harus print `true`. Sebelum fix, ini bakal `false` untuk ukuran file berapapun (bahkan 1 byte), karena `MAX_DOC` = 0.

## Slide 4 — Kuis

**Durasi:** 5 menit

**Script:**

**Q1 — Perintah apa yang digunakan untuk mengecek CVE yang mempengaruhi project?**
Jawaban: **B) `bun audit` — menampilkan known vulnerabilities di dependencies.**
Pembahasan: `bun outdated` cuma nunjukin versi lama vs baru, gak spesifik soal keamanan. `bun audit` yang cross-reference ke database CVE — kita udah liat hasil aslinya barusan, 50 vulnerabilities, dan penting buat tau cara filter mana yang beneran urgent (runtime deps vs dev tooling).

**Q2 — Rate limiting identifier mana yang lebih baik untuk API publik?**
Jawaban: **B) User ID (jika login) atau IP (jika guest) — IP bisa shared, userId lebih precise.**
Pembahasan: banyak user bisa share satu IP (kantor, kampus, NAT), jadi rate limit berbasis IP doang bisa salah blokir orang yang gak bersalah. Kalau user udah login, pakai `userId` lebih akurat; fallback ke IP cuma buat guest yang belum ada identifier lain.

**Q3 — Apakah Server Actions di Next.js butuh CSRF token manual?**
Jawaban: **B) Tidak — Next.js Server Actions sudah include CSRF protection otomatis.**
Pembahasan: Next.js Server Actions otomatis validasi `Origin` header terhadap host yang di-deploy, jadi request cross-origin otomatis ditolak tanpa kalian perlu nambahin token CSRF manual kayak di traditional form POST.

## Slide 5 — Homelab: Tugas Mandiri

**Durasi:** 3 menit

**Script:**
Empat tugas final security audit sebelum launch:

**01 — Dependency Audit:** Jalankan `bun audit` dan `bun outdated`. Fix semua critical/high vulnerabilities. Update Next.js ke versi terbaru. Dokumentasikan perubahan. *✅ Sebagian udah kita kerjain — kita jalanin kedua command dan analisis hasilnya. Update beneran (`bun update`) dan dokumentasi PR itu tugas kalian, karena butuh testing menyeluruh setelah update yang di luar scope sesi ini.*

**02 — Rate Limiting:** Setup Upstash Redis (upstash.com → free tier). `bun add @upstash/ratelimit @upstash/redis`. Tambahkan rate limit ke: login, createPost, uploadFile. *Belum kita kerjain — butuh akun Upstash eksternal. Live coding kita konfirmasi ini emang gap nyata di proyek (grep kosong), jadi kalian tau persis apa yang harus dikerjain.*

**03 — Security Scan:** Gunakan vercel.com/security atau OWASP ZAP. Identifikasi missing headers, exposed env vars, open redirects. *Butuh proyek yang udah live di production — di luar scope live coding lokal.*

**04 — Final Checklist:** Jalankan semua item di production security checklist, tandai yang sudah selesai. *✅ Kita udah audit sebagian besar item Authentication dan Data Security di live coding — plus nemuin dan nge-fix satu bug nyata (`MAX_DOC` bitwise bug). Sisanya (Dependencies update, Rate Limiting, Infrastructure scan) itu PR kalian.*

> 🔐 Sebelum launch: `bun audit` (zero criticals di runtime deps), auth check di semua protected routes, rate limiting aktif.

## Slide 6 — Rangkuman

**Durasi:** 2 menit

**Script:**
Rekap Bab 5 — sekaligus rekap penutup Modul 15:
- `bun audit`: cek CVE — tapi baca chain dependency-nya, prioritaskan runtime deps di atas dev tooling. `bun outdated`: cek versi lama. Update rutin mencegah vulnerability.
- Rate limiting dengan Upstash: max request per waktu per identifier. Proyek kita masih punya gap di sini — belum ada implementasi.
- Validasi input (Zod) + MIME check + ownership check + CSRF auto (Server Actions) — proyek kita udah cukup solid di sini, kecuali satu bug nyata yang kita temuin dan fix (`MAX_DOC` pakai `&` bukan `*`, bikin validasi dokumen reject semua ukuran).
- Security checklist: Authentication, Data Security, Dependencies, Infrastructure — kita audit satu-satu pakai grep beneran ke codebase, bukan cuma baca daftar.
- Launch checklist: zero critical CVE di runtime deps, auth di semua routes, rate limiting, error monitoring.

Dan itu penutup Modul 15 — Deployment & Production. Dari env vars yang rapi (Bab 1), deploy ke Vercel (Bab 2), pipeline migrate yang aman (Bab 3), logging dan connection pooling (Bab 4), sampai security checklist final (Bab 5) — kalian sekarang punya semua yang dibutuhin buat bawa aplikasi dari `bun dev` ke production beneran. Selanjutnya Modul 16 — Project Akhir: Project Management Dashboard, tempat kalian pakai semua yang udah dipelajari dari awal course ini buat bangun proyek dari nol.
