# Naskah Live Demo — Modul 9 Bab 2: Setup PostgreSQL (Docker & Neon Console)

Durasi perkiraan: 30-35 menit. Fokus demo: **Docker lokal** untuk dev, **Neon Console** untuk hosted/staging (Supabase & Prisma Postgres disebut sekilas sebagai perbandingan, tidak didemokan).

## Prep sebelum kelas (jangan dilakukan live, siapkan dulu)

- [ ] **Start Docker Desktop.** Sudah dicek: `docker --version` OK (v29.4.0), tapi daemon belum jalan. Kalau lupa nyalain, `docker compose up -d` akan langsung error di depan siswa.
- [ ] **Perbaiki `.gitignore`.** Baris 34 saat ini `.env*` — ini ignore semua file termasuk `.env.example` yang seharusnya di-commit. Ganti jadi:
  ```gitignore
  .env
  .env.local
  .env*.local
  !.env.example
  ```
  Kalau tidak diperbaiki, nanti pas demo `git add .env.example` akan silent-gagal dan bikin bingung di depan kelas.
- [ ] Sudah punya akun **neon.tech**? Kalau belum, siapkan/login dulu supaya proses signup tidak makan waktu live (auth flow email bisa lambat).
- [ ] Ingat: dari Bab 1, `DATABASE_URL` di `.env` project masih kosong dan `prisma/schema.prisma` belum ada model — pas untuk demo dari nol di bab ini.

---

## 1. Buka dengan framing (2 menit)

> "Sebelumnya kita sudah install Prisma dan lihat kenapa Prisma 7 beda. Tapi Prisma butuh database beneran buat konek. Hari ini kita bahas dua cara paling umum: **Docker** buat development di laptop sendiri, dan **hosted provider** (kita pakai Neon) buat staging/production atau kalau kalian tidak mau install Postgres di laptop sama sekali."

Tulis di papan: **Docker = lokal dev · Neon = staging/production, serverless, gratis**.

---

## 2. Docker — PostgreSQL lokal (10-12 menit) — pakai slide halaman 2

**Talking point pembuka:**
> "Kenapa Docker, bukan install Postgres langsung ke laptop? Karena Docker itu bersih — sekali `docker compose down -v`, semua bekasnya hilang. Nggak nyampah di sistem kalian, dan setup-nya sama persis di laptop siapa pun."

**Langkah 1 — buat `docker-compose.yml` di root project (live-type):**

```yaml
services:
  postgres:
    image: postgres:17-alpine
    environment:
      POSTGRES_USER: devuser
      POSTGRES_PASSWORD: devpassword
      POSTGRES_DB: myapp_dev
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U devuser -d myapp_dev"]
      interval: 5s
      retries: 5

volumes:
  pgdata:
```

**Talking point sambil nulis:**
> "`ports: 5432:5432` — kiri itu port di laptop kalian, kanan port di dalam container. `volumes: pgdata` ini yang bikin data kalian nggak hilang walaupun container di-restart. Kalau mau reset total, nanti kita hapus volume ini juga."

**Langkah 2 — jalankan:**

```bash
docker compose up -d
docker compose ps      # tunjukkan status "healthy"
docker compose logs postgres   # opsional, tunjukkan log startup postgres
```

> "Perhatikan flag `-d` — detached. Tanpa ini terminal kalian bakal ke-block, log Postgres jalan terus di depan mata sampai di-Ctrl+C."

**Langkah 3 — isi `.env`:**

```bash
DATABASE_URL="postgresql://devuser:devpassword@localhost:5432/myapp_dev"
```

**Talking point:** bedah format-nya di papan: `postgresql://USER:PASS@HOST:PORT/DB` — cocokkan tiap bagian ke `docker-compose.yml` yang baru ditulis (`devuser`, `devpassword`, port `5432`, `myapp_dev`).

**Langkah 4 — test koneksi:**

```bash
bunx prisma db push
```

> "Karena schema kita masih kosong (belum ada model), yang penting di sini bukan tabelnya — tapi pesannya. Kalau muncul 'The database is already in sync' atau semacamnya tanpa error koneksi, artinya Prisma **berhasil connect** ke Postgres di Docker."

**Perintah harian yang perlu dihafal siswa** (tulis di papan, ini juga ada di komentar `docker-compose.yml`):

```bash
docker compose up -d      # start
docker compose stop       # stop (data tetap ada)
docker compose down -v    # reset total (data ikut hilang!)
docker compose ps         # cek status
docker compose logs postgres  # cek log
```

> "`down -v` itu yang paling berbahaya — `-v` hapus volume, artinya semua data hilang. Biasa dipakai kalau schema berantakan dan mau mulai ulang dari nol."

---

## 3. Hosted PostgreSQL — kenapa butuh, dan kenapa Neon (5 menit) — slide halaman 3

> "Docker bagus buat lokal, tapi begitu kalian deploy ke Vercel misalnya, aplikasi kalian nggak bisa connect ke Postgres di laptop kalian sendiri. Butuh database yang hidup di internet."

Sebutkan tiga opsi di slide, tapi kasih tahu kenapa fokus ke Neon:

| Provider | Sekilas | Kenapa/kenapa nggak dipakai hari ini |
|---|---|---|
| **Neon** | Serverless Postgres, branching, auto-sleep, free tier | **Ini yang kita demo** — paling ringan buat kursus |
| Supabase | Postgres + Auth + Storage + Realtime, dashboard lengkap | Disebut saja — bagus kalau butuh Auth/Storage sekalian, di luar cakupan hari ini |
| Prisma Postgres | Managed by Prisma, zero-config | Disebut saja — alternatif kalau mau paling mudah nyambung ke Prisma tanpa connection string manual |

---

## 4. Live demo Neon Console (10 menit) — pakai slide halaman 3-4

**Langkah 1 — buka browser, ke neon.tech, login/signup.**

**Langkah 2 — buat project baru di console** (klik "New Project", kasih nama sesuai project, pilih region — pilih yang paling dekat, misal Singapore/AWS ap-southeast kalau tersedia).

**Langkah 3 — di dashboard Neon, buka tab "Connection Details" / "Connect".**

> "Ini bagian yang paling penting saya tunjukkan: **jangan asal copy** connection string pertama yang muncul. Neon biasanya kasih beberapa varian (pooled vs direct). Untuk kebutuhan kursus ini, ambil yang paling standar dulu."

Tunjukkan di layar: connection string Neon formatnya seperti ini (jangan expose punya kalian sendiri di layar kalau sedang direkam):

```
postgresql://USER:PASS@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require
```

**Talking point kunci:** bandingkan langsung dengan connection string Docker tadi:

```bash
# Docker lokal — tidak perlu SSL
DATABASE_URL="postgresql://devuser:devpassword@localhost:5432/myapp_dev"

# Neon — WAJIB ?sslmode=require
DATABASE_URL="postgresql://USER:PASS@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require"
```

> "Format dasarnya sama persis: `postgresql://USER:PASS@HOST:PORT/DB`. Yang beda cuma dua: hostnya sekarang alamat internet, bukan `localhost`, dan ada `?sslmode=require` di belakang. Kalau ini lupa ditambahkan pas kalian copy-paste manual, koneksi ke Neon bakal ditolak."

**Langkah 4 — simpan sebagai variable terpisah, bukan menimpa `DATABASE_URL` lokal:**

```bash
# .env
DATABASE_URL="postgresql://devuser:devpassword@localhost:5432/myapp_dev"
DATABASE_URL_STAGING="postgresql://USER:PASS@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require"
```

> "Kita simpan dua-duanya. Development sehari-hari tetap pakai Docker lokal — cepat, gratis, tidak tergantung internet. Neon kita pakai kalau mau tes seolah-olah staging/production."

**Langkah 5 — test koneksi ke Neon (opsional kalau waktu cukup):**

```bash
DATABASE_URL=$DATABASE_URL_STAGING bunx prisma db push
```

> "Trik ini — override env var langsung di depan command — cara cepat pindah target database tanpa edit file tiap kali gonta-ganti."

---

## 5. Bikin `.env.example` + rapikan git (3 menit)

Setelah gitignore diperbaiki (lihat prep di atas):

```bash
# .env.example — commit ini
DATABASE_URL="postgresql://USER:PASS@HOST:PORT/DB_NAME"
```

```bash
git add docker-compose.yml .env.example .gitignore
git status   # tunjukkan .env TIDAK muncul di sini, tapi .env.example muncul
```

> "Ini yang wajib jadi kebiasaan: `docker-compose.yml` dan `.env.example` **di-commit**, `.env` **tidak pernah**. Kalau `.env` sampai ke-commit, password database kalian ada di git history selamanya — bahkan setelah dihapus di commit berikutnya."

---

## 6. Kuis cepat (3 menit) — slide halaman 5

1. Command Docker yang jalan di background, tidak block terminal? → **B** (`docker compose up -d`)
2. Format dasar connection string Postgres? → **B** (`postgresql://USER:PASS@HOST:PORT/DB`)
3. Apa yang beda di connection string hosted (Neon/Supabase) vs local? → **B** (`?sslmode=require` / parameter SSL)

Kalau ada yang jawab salah di Q3, balik tunjukkan lagi perbandingan dua `DATABASE_URL` di bagian 4.

---

## 7. Tutup + homelab (2 menit) — slide halaman 6-7

Rangkuman lisan:
- Docker: cara terbaik Postgres lokal, `docker compose up -d` langsung jalan.
- Format connection string: `postgresql://USER:PASS@HOST:PORT/DB`.
- Neon: serverless, gratis, recommended untuk kursus ini (Supabase & Prisma Postgres jadi alternatif kalau butuh fitur lain).
- Hosted wajib `?sslmode=require`, Docker lokal tidak perlu.
- `.env` selalu di-gitignore, `.env.example` selalu di-commit.

Homelab (sesuai slide, disesuaikan ke Docker+Neon):
1. **Docker Setup** — buat `docker-compose.yml` Postgres 17, `docker compose up -d`, verifikasi `docker compose ps`.
2. **.env Setup** — isi `DATABASE_URL` lokal, pastikan `.env` ke-gitignore, buat `.env.example`.
3. **Neon Signup** — daftar neon.tech, buat database, copy connection string, simpan sebagai `DATABASE_URL_STAGING`.
4. **Test Koneksi** — setelah Bab 3 (schema & model dibuat), jalankan `bunx prisma db push` ke dua-duanya (lokal & Neon), bandingkan hasilnya.

Tutup: "Selanjutnya Bab 3 — `prisma init`, Schema, Model & Relasi. Kita bakal isi `schema.prisma` yang masih kosong itu jadi model beneran."
