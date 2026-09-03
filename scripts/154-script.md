# Script Mengajar — 154.pdf: Logging, Error Monitoring & Connection Pooling

**Modul 15 · Deployment & Production — Bab 4**

## Slide 1 — Vercel Logs & Structured Logging

**Durasi:** 8 menit

**Script:**
Aplikasi kalian udah di production. Terus gimana kalian tau kalau ada yang error? Kalian gak akan selalu duduk depan browser nungguin. Di sinilah logging dan monitoring masuk — tujuannya: **tangkap error sebelum user yang lapor duluan.**

Vercel punya built-in logs, gratis, gak perlu setup apapun. Dashboard → Functions tab kasih kalian real-time logs, bisa filter by level, search by text. Retention-nya terbatas sih — 1 hari buat plan Hobby, 14 hari buat Pro. Ada juga CLI: `vercel logs --follow` buat liat log realtime dari terminal.

Log level yang umum dipake: `info` buat operasi normal, `warn` buat sesuatu yang gak biasa tapi masih oke, `error` buat yang butuh perhatian.

Yang PALING penting dari slide ini: **jangan pernah log data sensitif.** Gak boleh log password, API secret, session token, atau PII (nama lengkap, email, dll). Kenapa? Karena log itu sering ke-retain lama, bisa diakses banyak orang di tim, dan gak di-encrypt kayak database kalian. Kebocoran lewat log itu nyata dan sering kejadian.

Log context yang berguna itu bukan data sensitif, tapi metadata: `userId` (bukan email/nama), `postId`, `duration`, `error code`, `route`.

Konsep penting lain: **structured logging**. Bedanya sama `console.log` biasa? `console.log("user login", userId)` itu plain text — susah di-parse otomatis. Structured logging pakai format JSON konsisten, jadi log aggregator (atau bahkan `grep`/`jq` manual) bisa gampang filter dan search.

### 🖥️ Live Coding

Proyek kita masih pakai `console.log` biasa buat debugging (contoh: `lib/data/blog.ts` ada beberapa). Sekarang kita bikin logger terstruktur beneran, terus pakai buat nge-log durasi query di data-fetching functions — persis Homelab task 01 dan 04 yang bakal kalian kerjain.

1. **Buat `lib/logger.ts`:**
   ```ts
   type LogLevel = "info" | "warn" | "error";

   type LogContext = Record<string, string | number | boolean | null | undefined>;

   function write(level: LogLevel, message: string, context?: LogContext) {
     const entry = {
       level,
       message,
       time: new Date().toISOString(),
       ...context,
     };

     const line = JSON.stringify(entry);
     if (level === "error") {
       console.error(line);
     } else if (level === "warn") {
       console.warn(line);
     } else {
       console.log(line);
     }
   }

   export const logger = {
     info: (message: string, context?: LogContext) => write("info", message, context),
     warn: (message: string, context?: LogContext) => write("warn", message, context),
     error: (message: string, context?: LogContext) => write("error", message, context),
   };
   ```

   Perhatikan: kita masih pakai `console.log`/`console.warn`/`console.error` di dalemnya — itu sengaja! Vercel Logs capture semua output console standar. Yang bikin ini "structured" bukan API baru, tapi **format**-nya: selalu JSON, selalu ada `level`, `message`, `time`, plus context tambahan yang relevan.

2. **Pasang timing logging di 3 data fetching function terpenting** — ini `lib/data/post.ts`, yang paling sering dipanggil di proyek kita: `getPostBySlug`, `listPublishPosts`, `getPosts`. Tambahkan `const start = Date.now()` sebelum query, log durasi setelahnya:

   ```ts
   import { logger } from "../logger";

   export const getPostBySlug = cache(async (slug: string) => {
     const start = Date.now();
     const post = await db.post.findFirst({
       where: {slug, deletedAt: null},
       include: {author: { select: {name: true, email: true}}}
     });
     logger.info("query", { route: "getPostBySlug", slug, duration: Date.now() - start });
     return post;
   })
   ```

   Pola yang sama dipasang di `listPublishPosts` (log `rowCount` juga, karena berguna buat liat berapa banyak data yang ke-return) dan `getPosts` (log `page` juga, biar gampang liat pagination mana yang lambat).

   Catatan penting: kita **tidak** log `email` penulis atau konten post — cuma `slug`, `route`, `duration`, `rowCount`, `page`. Ini konsisten sama aturan slide: log metadata, jangan log data user yang sensitif.

**✅ Verifikasi manual:**
1. Jalankan `bunx tsc --noEmit` — pastikan `lib/logger.ts` dan perubahan di `lib/data/post.ts` gak nambah error baru (4 error pre-existing di `app/uploads/inspect-action.ts` tetep ada, gak berhubungan).
2. Test logger langsung, tanpa perlu database:
   ```bash
   bun -e "
   import('./lib/logger.ts').then(({logger}) => {
     logger.info('query', { route: 'getPostBySlug', slug: 'test', duration: 42 });
     logger.warn('slow query', { duration: 150 });
     logger.error('db error', { code: 'ECONNREFUSED' });
   });
   "
   ```
   Output harus JSON satu baris per log, contoh:
   ```json
   {"level":"info","message":"query","time":"2026-09-03T14:28:55.586Z","route":"getPostBySlug","slug":"test","duration":42}
   ```
3. Buat liat timing beneran jalan lewat query asli: jalankan `bun dev`, buka halaman yang manggil `getPosts` atau `listPublishPosts` (misal halaman daftar post), terus liat terminal — harus muncul baris JSON `"route":"getPosts"` dengan `duration` beneran dari database kalian. *(Butuh `DATABASE_URL` di `.env` kalian nunjuk ke database yang aktif dan reachable — kalau kalian pakai database lokal, pastikan servernya nyala dulu.)*

## Slide 2 — Connection Pooling di Production

**Durasi:** 8 menit

**Script:**
Ini topik yang sebenernya udah kita bahas di Modul 10 Bab 8 — sekarang kita ringkas jadi checklist production-readiness, plus kita cek beneran gimana proyek kita implement ini.

Enam poin checklist:
1. **Hosted database**, bukan `localhost` — pakai provider kayak Neon, Supabase, dll.
2. **Dua URL**: `DATABASE_URL` (pooled, buat runtime queries) dan `DIRECT_URL` (direct/non-pooled, buat migrate).
3. Config-nya pakai keduanya.
4. `lib/db.ts` pakai adapter `pg` — udah kita ajarkan di Modul 10 Bab 4.
5. Prisma client singleton pakai `globalThis` — juga udah diajarkan.
6. SSL selalu enabled untuk hosted DB.

Poin 4 dan 5 ini **udah** ke-cover di proyek kita — coba kita buktiin.

### 🖥️ Live Coding

**Cek poin 4 & 5 dulu — sudah ada, tinggal verifikasi:**

Buka `lib/db.ts`:
```ts
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: env.DATABASE_URL,
  });
  return new PrismaClient({ adapter, ... })
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db
}
```
✅ Singleton pattern pakai `globalThis` — ada. ✅ Adapter `pg` (`@prisma/adapter-pg`) — ada.

**Sekarang poin 2 & 3 — di sinilah proyek kita perlu kerja tambahan, dan ini bagian yang menarik.**

Slide contoh nunjukin cara set `directUrl` di `prisma.config.ts`:
```ts
export default defineConfig({
  datasource: {
    url:        env("DATABASE_URL"),  // pooled untuk runtime
    directUrl: env("DIRECT_URL"),     // direct untuk migrate
  }
})
```

Kita coba terapin ini persis di proyek kita... dan ternyata **error**:
```bash
bunx prisma validate
```
```
Error: Prisma schema validation - (validate wasm)
Error code: P1012
error: The datasource property `directUrl` is no longer supported in schema files.
Move connection URLs to `prisma.config.ts`. See https://pris.ly/d/config-datasource
```

Ini kejadian pas kita coba taruh `directUrl` di `datasource db { }` block di `schema.prisma` (cara lama, Prisma versi sebelumnya). Terus pas kita cek type definition `Datasource` dari package `@prisma/config` yang proyek kita pakai (Prisma **7.9.0**):
```ts
export declare type Datasource = {
    url?: string;
    shadowDatabaseUrl?: string;
};
```
**Gak ada field `directUrl`!** Ini contoh nyata kenapa kita harus selalu cek `node_modules` sebelum nulis kode — materi/slide bisa nunjukin API yang udah berubah di versi Prisma yang lebih baru dari yang dipakai buat bikin slide-nya.

Solusi yang tetap sesuai *tujuan* slide (pooled buat runtime, direct buat migrate) di Prisma 7 dengan config-based datasource: **`prisma.config.ts` cuma punya SATU `url`**, dan itu yang dipakai schema-engine (`migrate`, `introspect`). Karena schema-engine butuh koneksi direct (non-pooled, karena pooler kayak PgBouncer sering gak support command DDL kayak `CREATE TABLE`), maka **`url` di `prisma.config.ts` harus diisi `DIRECT_URL`** (fallback ke `DATABASE_URL` kalau gak ada pooler). Sementara runtime queries (lewat `PrismaPg` adapter di `lib/db.ts`) tetap connect pakai `DATABASE_URL` (pooled) — itu udah bener dari awal.

Update `prisma.config.ts`:
```ts
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migrasi/schema-engine butuh koneksi langsung (non-pooled) ke DB.
    // DIRECT_URL opsional: kalau kalian pakai pooler (Neon, Supabase, dst),
    // isi DIRECT_URL dengan connection string non-pooled di .env.
    // Tanpa pooler (kayak local dev kita), DIRECT_URL boleh kosong — fallback ke DATABASE_URL.
    url: process.env.DIRECT_URL ?? env("DATABASE_URL"),
  },
});
```

Tambahkan `DIRECT_URL` sebagai variabel opsional di `.env.example`:
```
# Opsional — cuma diisi kalau DATABASE_URL di atas pakai connection pooler
# (Neon, Supabase, PgBouncer, dst). DIRECT_URL harus non-pooled, dipakai
# Prisma khusus untuk migrate/introspect. Tanpa pooler: biarkan kosong.
# DIRECT_URL="postgresql://{user}:{password}@{direct-host:port}/{dbName}"
```

Dan update `lib/env.ts` supaya `DIRECT_URL` tervalidasi sebagai optional (kalau diisi, gak boleh string kosong):
```ts
DATABASE_URL: z.string().min(1, "DATABASE_URL wajib diisi"),
DIRECT_URL: z.string().min(1).optional(),
```

Proyek kita sendiri masih pakai satu database Postgres lokal (bukan pooled), jadi `DIRECT_URL` sengaja kita biarin opsional dan fallback ke `DATABASE_URL` — persis kayak kondisi "tanpa pooler" yang disebut di komentar. Begitu kalian deploy ke Neon dengan pooler beneran, tinggal isi `DIRECT_URL` di Vercel env vars, gak perlu ubah kode lagi.

**✅ Verifikasi manual:**
```bash
bunx prisma validate
```
Harus keluar `The schema at prisma/schema.prisma is valid 🚀` — bukti `prisma.config.ts` dan `schema.prisma` sinkron setelah perubahan.

## Slide 3 — Kuis

**Durasi:** 5 menit

**Script:**

**Q1 — Apa manfaat structured logging (JSON) dibanding `console.log` biasa?**
Jawaban: **B) Mudah di-parse, di-search, dan di-filter oleh log aggregator. Consistent format.**
Pembahasan: `lib/logger.ts` yang kita buat tadi selalu ngeluarin JSON dengan field `level`, `message`, `time` yang konsisten — jadi biarpun kalian punya ribuan baris log, tools log aggregator (atau bahkan `jq` manual) bisa filter `level=error` doang dengan gampang.

**Q2 — Kapan sebaiknya menggunakan `Sentry.captureException()` secara manual?**
Jawaban: **B) Di try/catch block untuk error yang butuh context tambahan (userId, action, dll).**
Pembahasan: Sentry otomatis nangkep unhandled error, tapi kalau kalian punya try/catch yang sengaja nangkep error buat recovery, error itu gak keliatan sama Sentry kecuali kalian panggil manual — dan momen itu juga pas buat nambahin context yang berguna buat debug nanti.

**Q3 — Mengapa `DATABASE_URL` dan `DIRECT_URL` harus berbeda di production?**
Jawaban: **B) `DATABASE_URL`: pooled URL untuk runtime. `DIRECT_URL`: direct URL untuk `prisma migrate` (pooler tidak support DDL).**
Pembahasan: ini persis yang kita temuin di live coding — pooler kayak PgBouncer itu bagus buat banyak koneksi pendek (query biasa), tapi migrate butuh command DDL (`CREATE TABLE`, `ALTER TABLE`) yang sering gak jalan lewat pooler. Makanya dipisah dua URL, dua tujuan beda.

## Slide 4 — Homelab: Tugas Mandiri

**Durasi:** 3 menit

**Script:**
Empat tugas setup logging dan monitoring:

**01 — `lib/logger.ts`:** Buat structured logger JSON. Replace `console.log` di Server Actions dengan `logger.info`/`error`, tambahkan context berguna (`userId`, `postId`). *✅ Logger-nya udah kita buat persis di live coding. Replace semua `console.log` di Server Actions proyek kalian sendiri itu PR kalian — kita baru nyentuh 3 data-fetching function di `lib/data/post.ts`.*

**02 — Sentry Setup:** `bun add @sentry/nextjs`, jalankan wizard, set `SENTRY_DSN` di `.env`, test `throw Error('test sentry')`. *Belum kita kerjain — install Sentry beneran butuh akun Sentry dan DSN asli, di luar scope live coding sesi ini. Kerjain ini di proyek kalian sendiri.*

**03 — DB Monitoring:** Buka Neon dashboard → Monitoring, identifikasi peak connection time. *Butuh akun Neon production beneran — di luar scope live coding, proyek kita masih pakai Postgres lokal.*

**04 — Query Timing:** Tambahkan timing logging ke 3 data fetching function terpenting, log route/duration/row count, identifikasi query yang > 100ms. *✅ Udah kita kerjain persis ini — `getPostBySlug`, `listPublishPosts`, `getPosts` di `lib/data/post.ts` sekarang semua nge-log `duration`.*

> 💡 Sentry gratis: 5000 errors/bulan. Cukup untuk project awal. Upgrade jika butuh lebih.

## Slide 5 — Rangkuman

**Durasi:** 2 menit

**Script:**
Rekap Bab 4:
- Structured logging (JSON) lebih mudah di-parse dan di-search dari plain `console.log` — kita buktiin lewat `lib/logger.ts`.
- Jangan log data sensitif: password, API secret, session token, PII.
- Sentry: error monitoring otomatis, gratis 5000 errors/bulan — belum kita install, PR kalian.
- `DATABASE_URL` (pooled) vs `DIRECT_URL` (direct) — kita temuin kalau cara set `directUrl` di slide udah outdated buat Prisma 7 yang proyek kita pakai, dan kita perbaiki lewat `prisma.config.ts` yang milih `DIRECT_URL` (fallback ke `DATABASE_URL`) khusus buat schema-engine.
- Monitor koneksi DB: alert kalau mendekati max connections limit — butuh dashboard provider (Neon dsb) beneran.

Selanjutnya Bab 5 — Security Checklist Production, bab terakhir sebelum kalian bener-bener launch.
