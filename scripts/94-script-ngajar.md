# Naskah Live Demo — Modul 9 Bab 4: Driver Adapter & Prisma Client Singleton

Durasi perkiraan: 30-35 menit. Fokus: bikin `lib/db.ts` yang benar-benar dipakai project mulai sekarang — bukan cuma latihan sekali pakai. Bab ini nyambung langsung dari "kejutan" di akhir Bab 3 (kenapa `url` dihapus dari `datasource`).

## Prep sebelum kelas

- [ ] **Start Docker Desktop**, lalu `docker compose up -d` — masih belum jalan sampai sekarang. Tanpa ini, bagian "Test Import" & "Test Dev Reload" di homelab tidak bisa didemo nyambung ke DB beneran (cuma bisa tunjukkan type-check-nya).
- [ ] Isi `DATABASE_URL` di `.env` (masih kosong) sebelum kelas — pakai connection string Docker dari Bab 2: `postgresql://devuser:devpassword@localhost:5432/myapp_dev`.
- [ ] Sudah dicek: `bunx prisma generate` sudah pernah jalan, hasilnya ada di `generated/prisma/` — filenya `client.ts` (bukan folder `client/`). Jadi import path yang benar persis: `../generated/prisma/client`, sesuai peringatan di slide homelab.
- [ ] Pattern singleton di slide halaman 3 **sudah saya type-check langsung** terhadap client yang ter-generate di project ini — cocok 100%, tidak ada penyesuaian diperlukan (beda dari Bab 3 kemarin yang ternyata ada bagian slide yang sudah tidak berlaku).

---

## 1. Framing pembuka — sambungkan ke akhir Bab 3 (3 menit)

> "Kemarin di akhir Bab 3, kalian lihat sesuatu yang janggal: kita hapus `url` dari `datasource` di schema, dan errornya bilang 'pass adapter ke PrismaClient constructor'. Hari ini kita bereskan itu. Ini bab yang jawab pertanyaan: kalau bukan dari schema, gimana caranya PrismaClient tahu mau connect ke database mana?"

Tulis di papan: **Prisma 7 tidak bundling driver apa pun — kita yang pasang sendiri.**

---

## 2. Kenapa perlu driver adapter (5-6 menit) — slide halaman 2

**Talking point, bandingkan dua dunia:**
> "Di Prisma 6, semua serba otomatis — kalian tulis `provider = 'postgresql'` di schema, dan di baliknya ada Rust binary raksasa yang tahu cara ngomong ke Postgres. Enak, tapi ada harganya: binary itu ~14MB, kadang nggak kompatibel di environment tertentu, cold start-nya lambat di serverless (Vercel Edge misalnya), dan kalian nggak bisa pakai fitur-fitur `pg` yang sebenarnya didukung Postgres tapi nggak diimplementasikan di driver Rust-nya."

> "Prisma 7 balik badan total: **tidak ada driver bawaan sama sekali**. Kalian pilih sendiri driver JavaScript-nya — untuk kursus ini kita pakai `pg` (node-postgres), paling populer di ekosistem Node — terus Prisma nyediain 'jembatan' yang namanya **adapter** buat nyambungin driver itu ke PrismaClient."

**Live-code — dua langkah yang wajib diingat (tulis di editor, boleh di scratch file dulu):**

```ts
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Langkah 1: bikin adapter dengan connection string
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

// Langkah 2: pass adapter itu ke PrismaClient
const prisma = new PrismaClient({ adapter });
```

**Talking point:**
> "Perhatikan, ini persis dua baris yang errornya kasih tahu kemarin: `PrismaPg` dulu, baru di-pass sebagai `adapter`. Package `@prisma/adapter-pg` dan `pg` ini sudah ke-install dari Bab 1 kalau kalian ikutin urutan modul — cek `package.json`, dua-duanya sudah ada."

Verifikasi cepat di terminal:
```bash
grep -E "\"pg\"|adapter-pg" package.json
```

**Keuntungan yang perlu disebut (dari slide):**
- Bundle 90% lebih kecil (cuma JS, nggak ada binary Rust).
- Support semua fitur `pg` — bukan cuma yang diimplementasikan ulang di Rust.
- Bisa pakai `pg` connection pool langsung.
- Deploy ke Vercel/Cloudflare/Bun jadi lebih mulus — nggak ada binary asing yang harus disesuaikan per-platform.

---

## 3. Masalah nyata: kenapa butuh singleton (5 menit) — slide halaman 3

**Jangan langsung kasih kode — bangun masalahnya dulu:**

> "Sekarang kalau kalian taruh dua baris tadi langsung di Server Component, terus jalankan `bun run dev`, edit filenya, save — apa yang terjadi? Next.js dev server itu **hot-reload**. Setiap kali kalian save, modul-modul di-reload. Kalau kode bikin `new PrismaClient()` ada di level modul biasa, tiap reload = instance baru = **koneksi baru** ke Postgres. Save 20 kali dalam 10 menit ngoding? 20 koneksi nyangkut, nggak pernah ditutup."

> "Postgres itu ada batas maksimum koneksi (`max_connections`, defaultnya di kisaran 100). Kalian bisa habisin itu cuma dari coding biasa di laptop sendiri, sebelum sempat deploy ke production."

**Live-type — `lib/db.ts`, bangun step by step, bukan copy-paste langsung:**

Langkah 1 — bikin `globalForPrisma` dulu:
```ts
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};
```

> "`globalThis` itu objek global yang **selamat** dari hot-reload module — beda dari variabel biasa di dalam modul yang di-reset tiap file di-reload. Kita simpen instance PrismaClient di situ."

Langkah 2 — factory function-nya:
```ts
function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  });
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}
```

> "`log` ini bonus yang berguna banget waktu development — di development kalian bakal lihat setiap query SQL yang dijalankan di terminal, jadi kelihatan langsung kalau ada query yang aneh atau berulang. Di production kita matiin, cukup log error saja — kalau semua query di-log di production, log kalian bakal penuh noise."

Langkah 3 — pakai instance yang sudah ada kalau ada, baru bikin baru kalau belum:
```ts
export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
```

**Talking point paling penting di bagian ini:**
> "`??` di sini kuncinya — 'pakai yang di `globalForPrisma.prisma` kalau ada, kalau nggak ada baru bikin'. Terus baris di bawahnya cuma nyimpen instance itu balik ke `globalForPrisma` — tapi **cuma di development**. Di production nggak perlu, karena di production nggak ada hot-reload yang bikin masalah ini muncul; tiap proses server memang cuma jalan sekali."

---

## 4. Pakai `db` di berbagai konteks Next.js (5-6 menit) — slide halaman 4

> "Sekarang `lib/db.ts` sudah jadi. Cara pakainya sama di mana pun — tinggal import `db`, bukan `PrismaClient` langsung."

**Live-type tiga contoh singkat, sambil jelasin bedanya:**

```ts
// Server Component — paling umum
import { db } from "@/lib/db";

export default async function UsersPage() {
  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
  });
  return <UserList users={users} />;
}
```

```ts
// Server Action
"use server";
import { db } from "@/lib/db";

export async function createUser(formData: FormData) {
  const user = await db.user.create({
    data: {
      email: formData.get("email") as string,
      name: formData.get("name") as string,
    },
  });
  return user;
}
```

```ts
// Route Handler — app/api/users/route.ts
import { db } from "@/lib/db";

export async function GET() {
  const users = await db.user.findMany();
  return Response.json(users);
}
```

**Peringatan yang wajib ditekankan, bukan sekadar disebut lewat:**
> "Satu aturan keras: **jangan pernah** import `db` di Client Component — file yang ada `'use client'` di atasnya. `pg` itu package Node.js, dia butuh TCP socket ke database, itu nggak ada di browser. Kalau kalian coba import di Client Component, build kalian bakal error atau lebih parah, bikin bundle kebengkak nyoba nge-bundle kode Node.js ke browser. Kalau butuh data dari database di Client Component, caranya bukan import `db` langsung — tapi lewat Server Component yang fetch datanya, atau lewat Server Action / Route Handler yang dipanggil dari client."

---

## 5. Live test end-to-end (5-7 menit, kalau Docker & DATABASE_URL sudah siap)

**Langkah 1 — buat `lib/db.ts` beneran di project** (gabungan dari bagian 3):

```bash
mkdir -p lib
```
Isi filenya persis hasil live-coding tadi.

**Langkah 2 — pakai di `app/page.tsx` sebentar buat test (nanti bisa dibalikin):**

```ts
import { db } from "@/lib/db";

export default async function Home() {
  const userCount = await db.user.count();
  return <p>Jumlah user di database: {userCount}</p>;
}
```

```bash
bun run dev
```

> "Kalau database masih kosong (belum ada seed data), harusnya muncul angka 0 — itu tandanya **koneksi berhasil**, bukan error. Kalau error, biasanya karena `DATABASE_URL` belum keisi atau Docker belum jalan — dua hal yang sudah kita siapkan sebelum kelas."

**Langkah 3 — buktikan singleton-nya beneran jalan:**

> "Sekarang bagian yang paling penting dibuktikan, bukan cuma diomongin: edit `app/page.tsx`, ubah teksnya dikit, save. Ulangi 5-6 kali cepat. Perhatikan terminal — kalau `log: ['query', ...]` di `lib/db.ts` aktif, kalian bakal lihat query `SELECT COUNT...` muncul ulang tiap reload, **tapi tidak ada pesan koneksi baru dibuat berkali-kali**. Itu buktinya: instance PrismaClient-nya sama terus, cuma query-nya yang jalan ulang."

(Opsional, kalau ada waktu) Tunjukkan perbandingan: hapus sementara logic `globalForPrisma` (langsung `export const db = createPrismaClient()` tanpa cache), lakukan hot-reload berkali-kali, lalu kalau memungkinkan tunjukkan lewat `docker compose logs postgres` bagaimana jumlah koneksi masuk bertambah terus. Baru kembalikan ke versi singleton yang benar.

---

## 6. Kuis cepat (3 menit) — slide halaman 5

1. Kenapa Prisma 7 butuh `@prisma/adapter-pg` terpisah? → **C** (Prisma 7 hapus built-in Rust driver, kita pilih sendiri driver JS)
2. Masalah apa yang diselesaikan singleton pattern di development? → **A** (cegah koneksi berlebih akibat hot-reload)
3. Boleh `db` diimport di Client Component? → **B** (tidak — `pg` package Node.js, tidak ada di browser bundle)

Kalau ada yang jawab A/C di Q3, ulangi lagi bagian 4 — banyak yang salah kira ini soal "boleh asal hati-hati", padahal ini batasan teknis keras (Node.js API tidak ada di browser), bukan soal best practice.

---

## 7. Tutup + homelab (2 menit) — slide halaman 6-7

Rangkuman lisan:
- `@prisma/adapter-pg`: driver PostgreSQL eksplisit, wajib install di Prisma 7.
- Dua langkah: `new PrismaPg({ connectionString })` → `new PrismaClient({ adapter })`.
- Singleton via `globalThis` mencegah connection exhaustion saat hot-reload.
- Import `db` dari `@/lib/db`, jangan `@prisma/client` langsung — dan jangan sekali-kali dari Client Component.

Homelab (kalau demo di atas diikuti penuh, ini tinggal replikasi mandiri):
1. **Install Adapter** — sudah ada di project ini dari Bab 1, siswa tinggal verifikasi di project masing-masing.
2. **`lib/db.ts`** — sudah didemo lengkap di bagian 3.
3. **Test Import** — sudah didemo di bagian 5, siswa ulangi sendiri dengan model lain (`db.post.count()` misalnya).
4. **Test Dev Reload** — siswa wajib coba sendiri, catat di terminal apakah ada log koneksi baru tiap save.

Tutup: "Selanjutnya Bab 5 — Migrations: `migrate dev` vs `migrate deploy`. Sekarang koneksi kita sudah aman dan efisien, saatnya bahas cara paling benar mindahin perubahan schema ke database — beda banget antara pas development sama pas production."
