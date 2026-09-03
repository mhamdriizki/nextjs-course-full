# Script Mengajar — 151.pdf: Environment Variables: Server vs NEXT_PUBLIC

**Modul 15 · Deployment & Production — Bab 1**

## Slide 1 — Environment Variables: Server vs NEXT_PUBLIC

**Durasi:** 2 menit

**Script:**
Oke gaes, sekarang kita masuk ke Modul 15 — Deployment & Production. Ini bab pertama, kita bahas environment variables. Kelihatannya sepele ya, tinggal isi `.env`, tapi ini salah satu sumber security incident paling umum di proyek Next.js. Kenapa? Karena Next.js itu punya dua "dunia" — server dan browser — dan kalau kalian salah taruh secret di variabel yang ke-bundle ke browser, ya bocor. Judulnya jelas: "Server vs NEXT_PUBLIC". Aturannya nanti kita bedah satu-satu.

## Slide 2 — Server vs Public Environment Variables

**Durasi:** 8 menit

**Script:**
Aturan paling sederhana yang harus kalian inget: **kalau ada kata "SECRET" di namanya, JANGAN pakai prefix `NEXT_PUBLIC_`.** Titik.

Lihat contoh di slide. Variabel tanpa prefix — `DATABASE_URL`, `BETTER_AUTH_SECRET`, `CLOUDINARY_API_SECRET`, `GOOGLE_CLIENT_SECRET`, `OPENAI_API_KEY`, `STRIPE_SECRET_KEY` — ini semua **server-only**. Cuma bisa diakses lewat `process.env.NAMA` di Server Component, Server Action, atau API Route. Kalau kalian coba akses di Client Component, hasilnya `undefined`. Itu bukan bug, itu emang sengaja begitu — Next.js gak nge-bundle variabel tanpa prefix ke JavaScript yang dikirim ke browser.

Sebaliknya, variabel dengan prefix `NEXT_PUBLIC_` — kayak `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` — ini **ter-bundle ke JavaScript bundle saat build time**. Next.js literally replace `process.env.NEXT_PUBLIC_APP_URL` di kode kalian jadi string value-nya langsung, hardcoded ke bundle. Makanya bisa diakses di Client Component. Tapi ya itu — begitu ter-bundle, siapapun yang buka DevTools → Sources bisa cari dan nemuin nilainya. Makanya cuma boleh isi yang emang aman buat publik: URL aplikasi, cloud name (bukan secret), analytics ID.

Cara cek gampang: `typeof window !== 'undefined'` — kalau true, berarti kode itu jalan di browser.

Nah sekarang kita liat proyek kita sendiri. Ini proyek udah punya `lib/cloudinary.ts` yang pakai tiga env var: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — dan semuanya server-only, gak ada prefix `NEXT_PUBLIC_`. Bener, karena ini dipakai buat upload dari Server Action, gak pernah nyentuh browser.

### 🖥️ Live Coding

Kita akan buat validasi env vars yang typed dan fail-fast pakai Zod. Kenapa penting? Karena proyek kita udah pakai `process.env.X!` (non-null assertion) di beberapa tempat — itu artinya kalau env var lupa di-set, errornya baru muncul pas runtime, di tengah request, dan pesannya gak jelas ("Cannot read property of undefined").

1. **Cek env vars yang proyek ini butuhkan.** Buka `lib/db.ts`, `lib/auth.ts`, `lib/cloudinary.ts` — catat semua `process.env.X` yang dipakai:
   - `DATABASE_URL` (lib/db.ts)
   - `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (lib/auth.ts)
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (lib/cloudinary.ts)
   - `NEXT_PUBLIC_APP_URL` (client-side, dipakai di beberapa tempat buat generate absolute URL)

2. **Buat `lib/env.ts`** — schema Zod terpisah buat server vars dan client vars, biar jelas mana yang boleh nyentuh browser:

   ```ts
   import { z } from "zod";

   const serverEnvSchema = z.object({
     DATABASE_URL: z.string().min(1, "DATABASE_URL wajib diisi"),
     BETTER_AUTH_SECRET: z.string().min(1, "BETTER_AUTH_SECRET wajib diisi"),
     BETTER_AUTH_URL: z.url("BETTER_AUTH_URL harus URL yang valid"),
     GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID wajib diisi"),
     GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET wajib diisi"),
     CLOUDINARY_CLOUD_NAME: z.string().min(1, "CLOUDINARY_CLOUD_NAME wajib diisi"),
     CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY wajib diisi"),
     CLOUDINARY_API_SECRET: z.string().min(1, "CLOUDINARY_API_SECRET wajib diisi"),
   });

   const clientEnvSchema = z.object({
     NEXT_PUBLIC_APP_URL: z.url("NEXT_PUBLIC_APP_URL harus URL yang valid"),
   });

   function parseServerEnv() {
     const parsed = serverEnvSchema.safeParse(process.env);
     if (!parsed.success) {
       console.error("❌ Environment variables server tidak valid:", z.treeifyError(parsed.error));
       throw new Error("Invalid server environment variables — cek pesan di atas.");
     }
     return parsed.data;
   }

   function parseClientEnv() {
     const parsed = clientEnvSchema.safeParse({
       NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
     });
     if (!parsed.success) {
       console.error("❌ Environment variables client tidak valid:", z.treeifyError(parsed.error));
       throw new Error("Invalid client environment variables — cek pesan di atas.");
     }
     return parsed.data;
   }

   export const env = parseServerEnv();
   export const clientEnv = parseClientEnv();
   ```

   Catatan buat kelas: kita pakai `z.url()` dan `z.treeifyError()` — ini API Zod v4 (top-level, bukan `z.string().url()` kayak v3). Cek `package.json`, proyek kita udah pakai `"zod": "^4.4.3"`.

3. **Ganti `process.env.X!` jadi `env.X`** di file-file yang udah kita catat tadi:

   `lib/db.ts` — sebelumnya `connectionString: process.env.DATABASE_URL!`, jadi:
   ```ts
   import { env } from "./env";
   // ...
   const adapter = new PrismaPg({
     connectionString: env.DATABASE_URL,
   });
   ```

   `lib/auth.ts` — sebelumnya `clientId: process.env.GOOGLE_CLIENT_ID!`, jadi:
   ```ts
   import { env } from "./env";

   export const auth = betterAuth({
     // ...
     secret: env.BETTER_AUTH_SECRET,
     baseURL: env.BETTER_AUTH_URL,
     socialProviders: {
       google: {
         clientId: env.GOOGLE_CLIENT_ID,
         clientSecret: env.GOOGLE_CLIENT_SECRET
       }
     },
   ```

   `lib/cloudinary.ts` — sama pola:
   ```ts
   import { env } from "./env";

   cloudinary.config({
     cloud_name: env.CLOUDINARY_CLOUD_NAME,
     api_key: env.CLOUDINARY_API_KEY,
     api_secret: env.CLOUDINARY_API_SECRET
   })
   ```

   Perhatikan: gak ada lagi `!` non-null assertion. TypeScript sekarang tau `env.DATABASE_URL` itu pasti `string`, karena Zod udah validasi di module-load time, bukan kita "bohongin" compiler pakai `!`.

4. **Update `.env.example`** — lengkapi dengan semua var yang sekarang divalidasi, biar tim baru tau persis apa yang harus diisi:

   ```
   DATABASE_URL="postgresql://{user}:{password}@{host:port}/{dbName}"

   # Better Auth credential — generate secret dengan: openssl rand -base64 32
   BETTER_AUTH_SECRET="{isi dari openssl}"
   BETTER_AUTH_URL="http://localhost:3000"

   # Google OAuth — dari Google Cloud Console > APIs & Services > Credentials
   GOOGLE_CLIENT_ID="{isi dari google console}"
   GOOGLE_CLIENT_SECRET="{isi dari google console}"

   # Cloudinary credential — isi dari dashboard cloudinary.com (Settings > Access Keys)
   # JANGAN diprefix NEXT_PUBLIC_, ini rahasia dan cuma boleh dipakai di server!
   CLOUDINARY_CLOUD_NAME="{isi dari cloudinary}"
   CLOUDINARY_API_KEY="{isi dari cloudinary}"
   CLOUDINARY_API_SECRET="{isi dari cloudinary}"

   # Public — aman di-expose ke browser, TIDAK boleh berisi secret
   NEXT_PUBLIC_APP_URL="http://localhost:3000"

   # Production: JANGAN commit nilai asli. Set semua di atas lewat Vercel dashboard
   # (Settings > Environment Variables), bukan lewat file yang di-commit ke git.
   ```

**✅ Verifikasi manual:**
1. `bunx tsc --noEmit` — pastikan gak ada error baru dari `lib/env.ts`, `lib/db.ts`, `lib/auth.ts`, `lib/cloudinary.ts` (proyek ini punya 4 error TypeScript pre-existing di `app/uploads/inspect-action.ts`, gak related sama perubahan kita — abaikan).
2. Test fail-fast: hapus sementara satu baris di `.env` (misal `GOOGLE_CLIENT_SECRET`), lalu jalankan:
   ```bash
   bun -e "import('dotenv/config').then(()=>import('./lib/env.ts')).catch(e=>console.log('CAUGHT:', e.message))"
   ```
   Harusnya muncul log `❌ Environment variables server tidak valid` dengan detail field yang salah, terus `CAUGHT: Invalid server environment variables...`. Ini bukti fail-fast bekerja — error jelas di startup, bukan crash acak pas runtime.
3. Kembalikan baris yang tadi dihapus, lalu jalankan ulang perintah yang sama — harusnya gak ada error lagi.

## Slide 3 — Environment Files & Hierarki

**Durasi:** 6 menit

**Script:**
Next.js baca beberapa file `.env` sekaligus, dengan urutan prioritas. Yang paling tinggi menang kalau ada nama variabel yang sama di beberapa file:

1. **`.env.local`** — prioritas tertinggi. **JANGAN pernah di-commit.** Isinya secret buat development kalian sendiri.
2. **`.env.{NODE_ENV}`** — misal `.env.development` atau `.env.production`. Kalau kalian butuh nilai beda antara dev dan prod tanpa nyimpen secret.
3. **`.env`** — default, paling rendah prioritasnya. Ini **boleh** di-commit, tapi HANYA kalau isinya bukan secret — biasanya dipakai buat nilai default yang sama buat semua environment.

Terus ada juga **`.env.example`** — ini bukan file yang dibaca Next.js, dia cuma template. Isinya nama variabel + placeholder (bukan nilai asli), fungsinya biar developer baru tau apa aja yang harus mereka isi di `.env.local` mereka sendiri.

Nah, menarik nih — coba kita liat proyek kita. Buka `.gitignore`, cari baris env files.

Proyek kita itu strukturnya agak beda dari yang di slide: kita cuma punya **satu file `.env`** (bukan `.env.local`), dan `.env` itu di-gitignore sepenuhnya (lihat baris `# env files (can opt-in for committing if needed)` diikuti `.env` di `.gitignore`). Jadi walaupun namanya `.env` bukan `.env.local`, perlakuannya sama kayak yang slide bilang buat `.env.local` — isinya secret asli, gak pernah masuk git. Yang di-commit itu `.env.example`, isinya cuma placeholder.

Ini valid banget buat proyek solo/course kayak gini — gak semua tim butuh split `.env` vs `.env.local` vs `.env.production`. Tapi kalau kalian kerja di tim besar dengan environment dev/staging/prod yang beda-beda, pola `.env.local` (per-developer) + `.env.production` (nilai non-secret khusus prod) lebih masuk akal.

### 🖥️ Live Coding

Gak ada perubahan kode di slide ini — kita udah beresin `.env.example` di slide sebelumnya. Yang kita lakuin sekarang cuma **audit** posisi kita:

1. Jalankan `git check-ignore -v .env` — pastikan `.env` beneran ke-ignore git, bukan cuma asumsi.
2. Jalankan `git status --short` — pastikan `.env` gak muncul di daftar file yang mau di-commit.

**✅ Verifikasi manual:**
```bash
git check-ignore -v .env
```
Harus muncul output yang nunjuk ke baris `.env` di `.gitignore` (bukan kosong — kalau kosong berarti file itu KETRACK git, bahaya).

## Slide 4 — Validasi Environment Variables (Kuis)

**Durasi:** 5 menit

**Script:**
Sebelum lanjut, jawab tiga pertanyaan ini dulu.

**Q1 — Apa yang terjadi ketika `NEXT_PUBLIC_` prefix digunakan untuk API secret?**
Jawaban: **B) Secret ter-bundle ke JavaScript dan bisa dilihat siapapun di browser DevTools.**
Pembahasan buat disampaikan: Next.js gak nge-block ini saat build — dia nurut aja, replace `process.env.NEXT_PUBLIC_API_SECRET` jadi string literal di bundle. Gak ada warning, gak ada error. Baru ketauan pas ada yang buka DevTools atau — lebih parah — pas udah kena exploit.

**Q2 — File env mana yang TIDAK boleh di-commit ke git?**
Jawaban: **B) `.env.local` (berisi secrets lokal).**
Pembahasan: `.env.example` dan `.env` (kalau isinya cuma default non-secret) aman di-commit. `.env.local` — atau di proyek kita, `.env` — isinya kredensial asli, itu yang wajib di-gitignore.

**Q3 — Mengapa validasi env vars dengan Zod lebih baik dari mengakses `process.env` langsung?**
Jawaban: **B) Fail fast: server stop di startup dengan error jelas daripada crash saat request runtime.**
Pembahasan: ini persis yang kita demoin di live coding tadi — tanpa Zod, `process.env.DATABASE_URL!` itu ngebohongin TypeScript (bilang "pasti string" padahal bisa `undefined`), dan errornya baru muncul pas ada request yang butuh DB, di tengah production traffic. Dengan Zod, errornya muncul sebelum server bahkan mulai nerima request.

## Slide 5 — Homelab: Tugas Mandiri

**Durasi:** 3 menit (penjelasan, tugas dikerjain di luar kelas)

**Script:**
Empat tugas buat kalian kerjain sendiri. Saya jelasin mana yang udah kesentuh di live coding tadi, mana yang masih PR kalian.

**01 — `.env` Audit:** Review semua variabel di `.env` kalian (atau `.env.local` kalau kalian pakai pola itu). Cek ada yang salah pakai `NEXT_PUBLIC_` padahal harusnya server-only. *Belum kita kerjain di live coding — proyek kita sendiri udah bersih (gak ada secret ber-prefix `NEXT_PUBLIC_`), tapi kalian tetep harus latihan cek manual di proyek kalian sendiri.*

**02 — `.env.example`:** Buat lengkap dengan semua variabel tanpa nilai secret. *✅ Udah kita kerjain barusan di live coding — cek `.env.example` di root proyek.*

**03 — `lib/env.ts`:** Buat Zod schema validasi, import di `lib/db.ts` dan `lib/auth.ts`, test hapus satu variabel. *✅ Udah kita kerjain persis ini di live coding, termasuk test fail-fast-nya.*

**04 — `.gitignore` Check:** Pastikan `.gitignore` punya `.env.local`/`.env*.local`, jalankan `git status` pastikan gak ke-track. *Sebagian udah kita cek (`git check-ignore -v .env`) — tapi kalian ulang lagi dengan proyek kalian sendiri, dan kalau proyek kalian pakai pola `.env.local`, pastikan pattern `.env*.local` ada di `.gitignore`, bukan cuma `.env`.*

> 🔐 Rule: jika ragu apakah variabel aman di-expose → jangan pakai `NEXT_PUBLIC_`. Default ke server-only.

## Slide 6 — Rangkuman

**Durasi:** 2 menit

**Script:**
Rekap Bab 1:
- **Server-only** (tanpa prefix): cuma bisa diakses di server, gak pernah ke-bundle ke browser.
- **`NEXT_PUBLIC_`**: ter-bundle ke JavaScript browser saat build — cuma buat nilai yang emang aman dipublish.
- **Hierarki**: `.env.local` > `.env.{NODE_ENV}` > `.env`. Yang isinya secret = jangan commit.
- **`.env.example`**: template yang di-commit. Secret asli: JANGAN pernah nyentuh git.
- **Production secrets**: di-set di dashboard hosting (Vercel dsb), bukan di file yang di-commit.
- **Validasi Zod di `lib/env.ts`**: fail fast di startup, error jelas, gak ada lagi `process.env.X!` yang nge-bohongin compiler.

Selanjutnya kita lanjut ke Bab 2 — Deploy Full-Stack ke Vercel, di mana semua env var yang baru kita rapihin ini bakal kita masukin ke dashboard Vercel beneran.
