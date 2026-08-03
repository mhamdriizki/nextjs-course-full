# Naskah Live Demo — Modul 9 Bab 8: Connection Pooling untuk Serverless & Production

**Ini bab terakhir Modul 9.** Karakter bab ini beda dari 7 bab sebelumnya — durasi perkiraan 25-30 menit, dan **live-coding-nya minim, sengaja**. Alasannya dijelaskan di bawah, sampaikan juga ke siswa supaya mereka nggak bingung kenapa bab ini "kurang praktik" dibanding sebelumnya.

## Kenapa bab ini beda — sampaikan ini di awal, bukan disembunyikan

> "Tujuh bab sebelumnya, semua yang saya tunjukkan itu saya jalankan beneran di project ini — bikin schema, migrate, query, transaction, semuanya saya buktikan jalan. Bab ini beda. Topik utamanya — setup pooler di dashboard Neon, deploy ke Vercel, load testing pakai k6 — itu semua **aksi di luar kode**, di platform eksternal yang perlu akun masing-masing. Project kita sendiri development-nya pakai Docker Postgres lokal, konek langsung tanpa pooler sama sekali. Jadi hari ini lebih banyak **memahami konsep dan baca kode referensi**, dengan satu perubahan kecil tapi nyata yang saya terapkan ke project kita."

## ⚠️ Koreksi penting ditemukan saat prep — baca sebelum kelas

Slide halaman 4 (`Direct URL untuk prisma migrate`) menunjukkan `directUrl` sebagai field di `prisma.config.ts`. **Ini sudah dicoba langsung di project ini dan TIDAK berfungsi di Prisma 7.9.0**:
- Menambahkan `directUrl` ke `prisma.config.ts` → TypeScript menolak: field itu tidak ada di tipe `Datasource` (`node_modules/@prisma/config/dist/index.d.ts` cuma punya `url` dan `shadowDatabaseUrl`).
- Mencoba taruh `directUrl` di `schema.prisma` (cara lama) → IDE error, bilang "no longer supported in schema files, move to prisma.config.ts" — padahal di sana juga tidak didukung.

Solusi yang **benar-benar terverifikasi jalan**: override `DATABASE_URL` lewat environment variable khusus saat menjalankan command migrate — `DATABASE_URL="$DIRECT_URL" bunx prisma migrate deploy`. Detail lengkap ada di bagian 3. Jangan ajarkan pola `directUrl` di `prisma.config.ts` sesuai slide mentah-mentah — sudah dikoreksi di naskah ini.

---

## 1. Masalah unik serverless (7 menit) — slide halaman 2

**Gambarkan alurnya di papan, bukan di kode:**

```
Server tradisional:          Serverless (Vercel):
[1 proses persist]           [Request 1] → [Function baru] → [koneksi baru]
    ↓                        [Request 2] → [Function baru] → [koneksi baru]
[connection pool internal]   [Request 3] → [Function baru] → [koneksi baru]
    ↓                            ...
[10-20 koneksi ke DB]        [1000 concurrent] → [1000 koneksi ke DB!]
```

> "Di server tradisional — VPS, Docker container yang persist kayak yang kita pakai buat development — ada **satu proses** yang hidup terus. Proses itu bikin connection pool sendiri di dalam memori-nya, dan pool itu dipakai bergantian buat semua request yang masuk. Maksimal 10-20 koneksi cukup buat layani ratusan request, karena mereka gantian pakai koneksi yang sama."

> "Serverless (Vercel Functions, AWS Lambda) beda total. Tiap request **bisa** dapat instance/function baru — kadang malah cold start, proses baru dari nol. Kalau tiap instance bikin `new PrismaClient()` sendiri-sendiri dan connect ke Postgres, dan ada 1000 request bersamaan pas traffic tinggi... itu 1000 koneksi baru ke database. PostgreSQL default `max_connections` cuma 100. Database kalian bakal nolak koneksi baru — error 'too many connections' — bukan karena query-nya salah, tapi karena databasenya kehabisan slot koneksi."

**Talking point penting — luruskan miskonsepsi yang sering muncul:**
> "Ini bukan berarti singleton pattern yang kita pelajari di Bab 4 salah atau percuma. Singleton itu nyelesain masalah **hot-reload di development** — satu proses Next.js dev server, cegah dia bikin banyak instance PrismaClient sendiri. Masalah di bab ini beda: **banyak proses/instance terpisah** di production serverless, yang masing-masing punya singleton-nya sendiri-sendiri. Singleton nggak bisa nyambungin memori antar-instance yang berbeda proses — makanya butuh solusi di level infrastruktur, bukan di level kode aplikasi."

---

## 2. Solusi: connection pooler (8 menit) — slide halaman 2-3

**Gambar konsepnya:**
```
[1000 Vercel Functions] → [PgBouncer / Neon Pooler] → [PostgreSQL]
     1000 koneksi              proxy di tengah            max 20 koneksi
```

> "Connection pooler itu proxy yang duduk di antara aplikasi kalian dan database. Aplikasi konek ke pooler (boleh banyak, ribuan sekalipun), tapi pooler yang ngatur ke database aslinya cuma sedikit koneksi — dia reuse koneksi yang lagi nganggur buat request berikutnya. Analoginya kayak resepsionis hotel: ribuan tamu bisa antre ngomong ke resepsionis, tapi cuma resepsionis itu sendiri yang punya akses ke kunci-kunci kamar."

**Tiga opsi, jelaskan konteks masing-masing (baca dari slide, tidak perlu diketik ulang penuh):**

1. **Neon pooler (built-in)** — paling gampang. Kalau kalian pakai Neon buat hosted database (seperti yang direkomendasikan di Bab 2), pooling-nya **sudah otomatis aktif** begitu kalian ambil connection string yang "Pooled". Cukup pilih URL yang benar.
2. **Supabase pooler** — sama konsepnya, beda dashboard.
3. **`pg.Pool` manual** — **hanya relevan kalau deploy ke server tradisional/Node.js persist** (VPS, Docker container yang hidup terus), **bukan** buat serverless. Ini jawaban kuis nomor 3 nanti — poin yang paling sering disalahpahami.

**Talking point yang wajib ditekankan — ini bukan detail kecil:**
> "`pg.Pool` yang kalian lihat di slide itu berguna banget kalau deployment kalian itu Node.js server yang jalan terus — misal di VPS, Railway, atau Docker container produksi. Tapi kalau kalian deploy ke Vercel (serverless), `pg.Pool` **nggak menyelesaikan masalah** — karena pool itu sendiri dibuat ulang tiap function invocation baru, sama saja kayak bikin koneksi baru terus. Kalau target deployment kalian serverless, solusinya **wajib** hosted pooler (Neon/Supabase), bukan `pg.Pool` di kode sendiri."

---

## 3. `directUrl` — kenapa migrate butuh URL yang beda, DAN kenapa slide-nya perlu dikoreksi (8 menit) — slide halaman 4

**Talking point pembuka:**
> "Ada satu detail teknis yang gampang bikin bingung: pooler itu bagus buat query sehari-hari, tapi `prisma migrate` **tidak bisa** lewat pooler. Migration butuh koneksi yang persistent dan punya privilege tertentu buat ubah struktur tabel — pooler yang didesain buat gilir-gilir koneksi pendek nggak cocok buat itu. Makanya production setup yang benar itu punya **dua URL**: satu buat runtime query (lewat pooler), satu buat migrate (langsung ke Postgres)."

**Sekarang bagian yang penting — jangan langsung ketik `directUrl` ke `prisma.config.ts` seperti di slide. Buktikan dulu ke siswa kenapa:**

```bash
# Coba tambahkan directUrl ke prisma.config.ts persis seperti slide, lalu jalankan:
npx tsc --noEmit
```

Hasilnya (sudah dicoba nyata di project ini):
```
prisma.config.ts: error TS2353: Object literal may only specify known properties,
and 'directUrl' does not exist in type '{ url?: string; shadowDatabaseUrl?: string }'.
```

> "TypeScript langsung nolak. Saya cek lebih dalam ke source type Prisma versi kita (`node_modules/@prisma/config/dist/index.d.ts`) — tipe `Datasource` di `prisma.config.ts` cuma punya dua field: `url` dan `shadowDatabaseUrl`. `directUrl` **tidak ada** di sana sama sekali."

> "Terus saya coba taruh `directUrl` di `schema.prisma` (cara lama, sebelum `prisma.config.ts` ada) — error lagi, kali ini bilang 'no longer supported in schema files, move to prisma.config.ts'. Jadi errornya nyuruh pindah ke tempat yang justru **tidak mendukungnya**. Ini kontradiksi kecil di Prisma 7.9.0 — kemungkinan `directUrl` di `prisma.config.ts` itu fitur yang direncanakan tapi belum sepenuhnya di-ship di versi ini."

**Talking point paling penting di bagian ini:**
> "Ini pelajaran besar buat kalian: slide, dokumentasi, bahkan pesan error resmi sekalipun **bisa saja menggambarkan versi yang beda** dari yang benar-benar kalian install. Cara paling meyakinkan buat tahu kebenarannya bukan percaya ke satu sumber, tapi **coba langsung** dan baca tipe/source code aslinya kalau perlu."

**Solusi yang benar-benar berfungsi untuk versi ini — override env var pas jalankan command migrate:**

```bash
# Simpan direct URL sebagai DIRECT_URL di .env, lalu pas migrate:
DATABASE_URL="$DIRECT_URL" bunx prisma migrate deploy
```

**Talking point:**
> "Ini tetap mencapai tujuan yang sama — `migrate deploy` jalan pakai koneksi langsung, bukan lewat pooler — tanpa butuh field config yang belum ada. `prisma.config.ts` kita tetap baca `DATABASE_URL` seperti biasa lewat `env('DATABASE_URL')`; kita cuma **override nilai environment variable itu** khusus buat satu command ini saja, di command yang lain (`dev`, runtime aplikasi) tetap pakai `DATABASE_URL` yang mengarah ke pooler."

**Verifikasi ke kelas — buktikan pola ini benar-benar jalan (sudah dites nyata):**
```bash
bunx prisma validate        # tetap "valid", prisma.config.ts kita bersih
bunx prisma migrate status  # konek normal ke Docker Postgres kita
DATABASE_URL="postgresql://devuser:devpassword@localhost:5432/myapp_dev" bunx prisma migrate status
# ↑ override berhasil, tetap connect normal — buktinya trik ini valid
```

---

## 4. Baca kode referensi — Neon adapter & pg.Pool (5 menit, cukup dibaca bareng, tidak perlu diketik)

**Tunjukkan dari slide, kontraskan dengan `lib/db.ts` kita yang sudah ada:**

```ts
// Yang kita pakai sekarang (lib/db.ts) — Docker lokal, PrismaPg biasa
import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });

// Kalau nanti deploy pakai Neon — tinggal ganti adapter-nya
import { PrismaNeon } from "@prisma/adapter-neon";
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
```

> "Perhatikan, strukturnya **sama persis** dengan singleton yang kita bangun di Bab 4 — cuma beda nama class adapter-nya, `PrismaPg` jadi `PrismaNeon`. Filosofi driver adapter dari Bab 4 itu memang didesain supaya gampang di-switch kayak gini. Kalau nanti project kalian pindah dari Docker lokal ke Neon production, yang berubah cuma baris ini, bukan seluruh cara kalian nulis query di `lib/data/*.ts`."

**pg.Pool config — cukup dibaca, jelaskan tiap opsi:**
```ts
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,                      // maksimal 10 koneksi dalam pool
  min: 2,                       // minimal 2 koneksi tetap idle, siap pakai
  idleTimeoutMillis: 30000,     // tutup koneksi nganggur setelah 30 detik
  connectionTimeoutMillis: 2000 // max tunggu 2 detik buat dapat koneksi
});
```
> "Sekali lagi — ini cuma relevan kalau target deploy-nya server yang hidup terus, bukan Vercel serverless."

---

## 5. Checklist production (3 menit) — slide halaman 6

Bacakan sebagai checklist, kaitkan ke apa yang sudah/belum ada di project kita:

- ✅ Connection pooler — **belum relevan untuk kita** (masih Docker lokal); wajib kalau nanti deploy ke Vercel + Neon.
- ✅ SSL enabled — otomatis aktif kalau pakai `?sslmode=require` di connection string hosted (sudah dibahas Bab 2).
- ✅ `DIRECT_URL` untuk migrate — sudah kita siapkan strukturnya di `prisma.config.ts`, tinggal isi `.env` kalau sudah pakai Neon beneran.
- ✅ `DATABASE_URL` di Vercel env — aksi manual di dashboard Vercel saat deploy, di luar kode.

---

## 6. Kuis cepat (3 menit) — slide halaman 5

1. Kenapa serverless bisa 'too many connections'? → **B** (tiap function invocation buka koneksi baru, ratusan concurrent request = ratusan koneksi)
2. Fungsi `directUrl` di `prisma.config.ts`? → **B** (URL untuk `prisma migrate` yang butuh direct connection, bypass pooler)
3. Apakah `pg.Pool` efektif di Vercel serverless? → **B** (tidak — pool dibuat ulang per-invocation; pakai hosted pooler Neon/Supabase)

Kalau ada yang jawab A di Q3, ulangi lagi penjelasan bagian 2 — ini poin yang paling sering salah dipahami di bab ini.

---

## 7. Tutup + homelab (2 menit) — slide halaman 6-7

Rangkuman lisan:
- Serverless = banyak koneksi serentak → connection exhaustion tanpa pooler.
- Hosted pooler (Neon/Supabase): paling mudah untuk Next.js + Vercel, built-in.
- `pg.Pool` untuk Node.js tradisional, **bukan** untuk serverless.
- Konsep `directUrl` (bypass pooler khusus buat migrate) tetap valid, tapi di Prisma 7.9.0 **belum ada field `directUrl` resmi** di `prisma.config.ts` maupun `schema.prisma` — sudah dibuktikan langsung lewat error TypeScript & IDE. Solusi yang benar-benar jalan: override `DATABASE_URL` lewat env var khusus pas menjalankan command migrate (`DATABASE_URL="$DIRECT_URL" bunx prisma migrate deploy`).
- Production: `DATABASE_URL` = pooled (dipakai runtime & `prisma.config.ts` default), `DIRECT_URL` = direct (dipakai lewat override manual pas migrate). Keduanya perlu di-set di Vercel env kalau sudah pakai pooler beneran.

Homelab — ini yang **paling jujur butuh siswa punya akun sendiri**, tidak bisa direplikasi di sesi kelas tanpa akun Neon/Vercel masing-masing:
1. Neon Setup — aktifkan Connection Pooling di dashboard Neon, catat Pooled URL & Direct URL.
2. `prisma.config.ts` — pola sudah ada di project kita, siswa tinggal isi `.env` sendiri dengan URL Neon mereka.
3. Vercel Deploy — set `DATABASE_URL`+`DIRECT_URL` di environment variables, build command `prisma generate && prisma migrate deploy && next build`.
4. Load Test — pakai k6/Artillery, di luar cakupan yang bisa didemo langsung di kelas kalau tidak semua siswa siap infrastruktur-nya.

Tutup: "Ini akhir Modul 9 — Database dengan Prisma 7. Dari sini kalian sudah punya seluruh alur: setup, schema, koneksi, CRUD, filtering/pagination/transaction, sampai kesiapan production. Selanjutnya Modul 11 — Validasi Data dengan Zod & Forms."
