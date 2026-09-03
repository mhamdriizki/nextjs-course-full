# Script Mengajar — 152.pdf: Deploy Full-Stack di Vercel

**Modul 15 · Deployment & Production — Bab 2**

## Slide 1 — Deploy Full-Stack di Vercel

**Durasi:** 2 menit

**Script:**
Lanjut ke Bab 2. Kalau di Bab 1 kita udah rapihin env vars, sekarang kita bahas gimana caranya dari `git push` sampai aplikasi kita bisa diakses orang lain di internet — pakai Vercel. Vercel itu platform hosting yang dibuat sama tim yang sama yang bikin Next.js, jadi integrasinya paling mulus dibanding platform lain. Tapi "paling mulus" bukan berarti "tinggal push terus beres" — ada beberapa hal yang WAJIB disiapin dulu, dan kalau lupa, deploy kalian bakal gagal atau — lebih parah — sukses tapi aplikasinya rusak diam-diam.

## Slide 2 — Persiapan Sebelum Deploy Pertama

**Durasi:** 6 menit

**Script:**
Enam checklist sebelum push pertama kali ke Vercel:

1. **`postinstall: prisma generate` di `package.json`** — Vercel itu build di container yang fresh setiap kali deploy, gak ada cache `node_modules` dari deploy sebelumnya secara default untuk Prisma client. Kalau `prisma generate` gak jalan otomatis setelah `bun install`, kode kalian yang import dari `@/generated/prisma/client` bakal error "module not found".
2. **Build command di Vercel**: `prisma generate && prisma migrate deploy && next build` — urutannya penting, nanti kita bahas detail di Bab 3.
3. **Semua env vars udah di Vercel dashboard** — bukan di file `.env` yang kalian commit (dan memang gak boleh di-commit, inget Bab 1).
4. **Database production siap** — URL dan credentials valid, bukan `localhost`.
5. **OAuth callback URLs di-update** — dari `localhost:3000` ke domain production.
6. **`BETTER_AUTH_URL` di-update** ke production URL.
7. **Test `bun run build` tidak ada error lokal** — kalau lokal aja udah error, di Vercel pasti juga error, cuma buang waktu tunggu build container nyala buat nemuin error yang sama.

Sekarang kita cek posisi proyek kita di checklist ini satu-satu.

### 🖥️ Live Coding

1. **Cek `postinstall` di `package.json`.** Buka `package.json`, lihat bagian `scripts`:
   ```json
   "postinstall": "prisma generate"
   ```
   ✅ Sudah ada — poin 1 checklist beres tanpa perlu diubah.

2. **Cek build command.** Bandingkan dengan checklist:
   ```json
   "build": "prisma generate && next build"
   ```
   Beda! `package.json` kita cuma `prisma generate && next build` — **tanpa `prisma migrate deploy`**. Ini sebenernya sengaja, bukan bug: `bun run build` sering dijalankan developer secara lokal (misal buat cek sebelum push), dan kita gak selalu mau tiap `bun run build` lokal otomatis nge-apply migration ke database — bisa production DB, bisa DB tim lain. Yang kita mau adalah: migration cuma auto-jalan di **build environment Vercel**, bukan di command umum `bun run build`.

   Solusinya: pisahkan. Vercel punya setting "Build Command" sendiri di dashboard yang bisa override script `build` di `package.json` — dan cara paling eksplisit buat declare itu di kode (biar ke-review, ke-versionkan di git) adalah lewat `vercel.json`.

3. **Buat `vercel.json` di root proyek:**
   ```json
   {
     "buildCommand": "prisma generate && prisma migrate deploy && next build",
     "outputDirectory": ".next",
     "framework": "nextjs"
   }
   ```
   Field `buildCommand` di `vercel.json` ini yang akan Vercel pakai saat build di production — override default (`bun run build` dari `package.json`). Jadi `bun run build` lokal tetap aman dipakai kapan aja tanpa risiko nge-apply migration ke DB yang salah, sementara Vercel selalu jalanin urutan penuh: generate → migrate deploy → build.

4. **Jalankan `bun run build` lokal buat cek poin 7 checklist:**
   ```bash
   bun run build
   ```

**✅ Verifikasi manual:**
1. Buka `package.json`, konfirmasi `"postinstall": "prisma generate"` ada.
2. Buka `vercel.json` yang baru dibuat, konfirmasi isinya match persis kayak slide: `buildCommand`, `outputDirectory: ".next"`, `framework: "nextjs"`.
3. Jalankan `bun run build` — di proyek kita hasilnya compile sukses, tapi type-check gagal di `app/uploads/inspect-action.ts` (4 error `FormDataEntryValue`). **Ini pre-existing, gak berhubungan sama perubahan Bab 1–2 kita** — tapi ini contoh nyata kenapa poin 7 checklist penting: kalau ini gak ketauan lokal, Vercel build bakal gagal juga dengan pesan yang sama, cuma kalian baru tau setelah nunggu build container Vercel nyala.

## Slide 3 — Setup Vercel: Import Project & Env Vars

**Durasi:** 8 menit

**Script:**
Enam langkah setup di Vercel — ini semua dikerjain di dashboard vercel.com, gak ada kode:

1. **Import Repository** — vercel.com → New Project → Import Git Repository, pilih repo GitHub kalian. Vercel auto-detect ini proyek Next.js.
2. **Build Command** — Settings → Build & Output Settings. *Catatan: kalau kalian udah punya `vercel.json` kayak yang baru kita buat, Vercel otomatis pakai itu — gak perlu diketik manual lagi di dashboard.*
3. **Environment Variables** — Settings → Environment Variables. Tambahin SEMUA secret yang ada di `.env.example` kita: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `NEXT_PUBLIC_APP_URL`. Inget, ini persis daftar yang divalidasi `lib/env.ts` di Bab 1 — kalau ada yang kelewat, deploy akan langsung gagal di build time karena Zod bakal throw. Justru itu bagus: fail fast di build, bukan nanti pas user pertama akses.
4. **Trigger Deploy** — push ke branch `main` → Vercel auto-deploy. Atau klik "Redeploy" di dashboard.
5. **Custom Domain** — Settings → Domains → Add domain, update DNS records. Setelah itu update `NEXT_PUBLIC_APP_URL` dan `BETTER_AUTH_URL` ke domain baru.
6. **Verify** — buka URL produksi, test login, test fitur utama (buat post, upload gambar), cek Vercel Logs kalau ada error.

Gak ada live coding baru di slide ini — konfigurasinya di dashboard Vercel, bukan di repo. Yang penting kalian paham: env vars yang kalian isi di Vercel dashboard itu harus **persis nama-nya** sama kayak yang divalidasi di `lib/env.ts` kita — beda satu huruf aja (misal `GOOGLE_CLIENTID` tanpa underscore) bakal bikin Zod parse gagal dan build Vercel merah.

## Slide 4 — Update OAuth & Better Auth untuk Production

**Durasi:** 6 menit

**Script:**
Ini yang paling sering kelupaan: setelah deploy, OAuth login sering langsung error di production padahal di local jalan mulus. Kenapa? Karena Google (atau provider OAuth lain) itu strict soal redirect URI — dia cuma terima callback ke URL yang udah kalian daftarin persis.

Di Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client ID → Edit, ada dua bagian yang harus diupdate:

**Authorized JavaScript Origins** — daftar origin yang boleh trigger OAuth flow:
- `http://localhost:3000` (dev)
- `https://yourapp.vercel.app` (preview/production default Vercel)
- `https://yourdomain.com` (custom domain kalian)

**Authorized Redirect URIs** — di project kita yang pakai Better Auth, formatnya `https://domain/api/auth/callback/google`:
- `http://localhost:3000/api/auth/callback/google`
- `https://yourapp.vercel.app/api/auth/callback/google`
- `https://yourdomain.com/api/auth/callback/google`

Kalau lupa nambahin salah satu, errornya bakal muncul di production sebagai `redirect_uri_mismatch` — dan ini bukan error di kode kalian, jadi jangan sibuk debug `lib/auth.ts`. Satu hal lagi: propagasi perubahan di Google Console itu gak instant, bisa 5 menit sampai beberapa jam. Jadi kalau abis update masih error, sabar dulu sebelum panik.

Di sisi Vercel, pastikan `BETTER_AUTH_URL` di environment variables Production **bukan** `localhost` — harus domain production kalian. Ini konsisten sama yang kita setup di `lib/auth.ts` Bab 1 — inget, kita udah pass `baseURL: env.BETTER_AUTH_URL` ke `betterAuth()`. Kalau env var ini salah di Vercel, Better Auth generate cookie session dengan domain yang salah, dan user bakal selalu logout padahal baru login.

Tidak ada live coding di slide ini juga — semua konfigurasi di Google Console dan Vercel dashboard, di luar repo.

## Slide 5 — Kuis

**Durasi:** 5 menit

**Script:**

**Q1 — Mengapa `postinstall: prisma generate` wajib di `package.json` untuk Vercel?**
Jawaban: **B) Vercel build container fresh setiap deploy — `prisma generate` tidak auto-jalan tanpa postinstall.**
Pembahasan: Prisma client itu kode yang di-generate dari `schema.prisma`, bukan dependency biasa yang di-download. Kalau `postinstall` gak ada, container fresh Vercel gak akan pernah generate client itu, dan build gagal begitu ada import dari `@/generated/prisma/client`.

**Q2 — Apa yang terjadi jika `BETTER_AUTH_URL` masih `localhost:3000` saat deploy ke production?**
Jawaban: **A) Session tidak bekerja karena cookie domain mismatch — user selalu logout.**
Pembahasan: cookie session itu di-scope ke domain tertentu. Kalau Better Auth mikir base URL-nya `localhost:3000` padahal aplikasi jalan di `yourdomain.com`, cookie yang di-set gak akan match domain browser, jadi session gak pernah persist.

**Q3 — Kapan Vercel trigger deployment otomatis?**
Jawaban: **C) Setiap push ke branch yang di-connect (biasanya `main`) — dan setiap PR mendapat preview URL.**
Pembahasan: ini salah satu fitur paling berguna Vercel — tiap PR otomatis dapet URL preview terpisah, jadi kalian bisa test perubahan sebelum merge ke `main`, tanpa ganggu production.

## Slide 6 — Homelab: Tugas Mandiri

**Durasi:** 3 menit

**Script:**
Empat tugas deploy pertama kalian ke Vercel:

**01 — Pre-Deploy Check:** Jalankan `bun run build` lokal, fix semua TypeScript errors, target build sukses tanpa warning. *Kita udah jalanin ini di live coding — kalau proyek kalian sendiri ada error kayak yang kita temuin di `app/uploads/inspect-action.ts`, itu PR kalian buat fix sebelum deploy beneran.*

**02 — Vercel Import:** vercel.com → New Project → Import repo. Set Build Command lewat `vercel.json` (✅ udah kita buat) atau manual di dashboard. Tambahkan semua env vars.

**03 — OAuth Update:** Update Google Console — Authorized Origins dan Redirect URIs. Update `BETTER_AUTH_URL` di Vercel env vars. *Ini di luar repo, harus dikerjain manual di dashboard Google dan Vercel masing-masing.*

**04 — Smoke Test:** Setelah deploy, test login (email + Google), buat post, upload gambar, cek `sitemap.xml`, cek `/robots.txt`. Buka Vercel Logs kalau ada error.

> 💡 Vercel Logs: dashboard → project → Functions tab → real-time logs setiap request. Sangat berguna untuk debug production issues.

## Slide 7 — Rangkuman

**Durasi:** 2 menit

**Script:**
Rekap Bab 2:
- `postinstall: prisma generate` di `package.json` — wajib, sudah ada di proyek kita.
- Build command production: `prisma generate && prisma migrate deploy && next build` — kita declare eksplisit lewat `vercel.json`, terpisah dari `package.json`'s `build` script yang tetap aman dipakai lokal.
- Semua secrets di Vercel dashboard — bukan file yang di-commit.
- `BETTER_AUTH_URL` dan OAuth callback URLs harus diupdate ke domain production.
- Push ke `main` = auto-deploy. Setiap PR = preview URL otomatis.

Selanjutnya Bab 3 — kita bedah lebih detail kenapa urutan `prisma generate → prisma migrate deploy → next build` itu gak boleh ditukar, dan kenapa `migrate dev` bisa bikin build Vercel hang selamanya.
