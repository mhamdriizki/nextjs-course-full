# Naskah Live Demo — Modul 9 Bab 7: Filtering, Sorting, Pagination, Relasi & Transaksi

Durasi perkiraan: 45-50 menit (bab paling padat konsep di modul ini). Semua contoh **sudah dieksekusi dan jalan nyata** di branch ini — bukan disalin mentah dari slide. Implementasinya ada di `lib/data/post.ts`, `prisma/seed.ts`, `prisma.config.ts`.

## Status setelah eksekusi (jangan diulang sebelum kelas, cukup direview)

- [x] Docker Postgres jalan, schema di-migrate (`post_category_follow_notification` — menambah `Post.category`, model `Follow` (self-relation many-to-many di `User`), model `Notification`).
- [x] `lib/data/post.ts` ditambah: `getPosts({ query, category, page })` (offset pagination + filter), `getPostsCursor(cursor?)` (cursor pagination), `createPostWithNotification(data)` (transaction).
- [x] `prisma/seed.ts` dibuat: 3 users (1 admin, 2 authors), 10 posts (tersebar 3 kategori: Tutorial, Tips & Trick, Berita), 20 comments, 2 relasi follow (buat demo notifikasi).
- [x] `prisma.config.ts` — ditambah `migrations.seed: "tsx prisma/seed.ts"`.
- [x] `tsx` di-install sebagai dev dependency (`bun add -d tsx`) — **wajib** ada di project supaya command seed di `prisma.config.ts` bisa jalan.
- [x] Semua path dites nyata: filtering (`contains`+`mode: insensitive`, filter `category`), offset pagination (total/totalPages/hasNext), cursor pagination (hasMore/nextCursor), transaction sukses (2 notifikasi ke follower), **dan transaction rollback** (post tidak tersimpan setelah `throw`).

### ⚠️ Hal yang perlu disebut ke siswa — ini menyimpang dari slide, dan itu penting dijelaskan kenapa

1. **Slide contoh pakai `tags`, `featured`, `AuditLog`, `Follow`, `Notification` sebagai model yang "sudah ada".** Di project kita, cuma `User`, `Post`, `Comment`, `UserPreferences` yang ada dari bab-bab sebelumnya. Untuk demo transaction & filtering relasi di bab ini beneran jalan, saya **tambah schema baru**: `Post.category` (field simpel buat filter exact-match), model `Follow` (self-relation many-to-many di `User` — siapa follow siapa), dan model `Notification`. Ini contoh nyata kenapa kalian harus baca schema project sendiri dulu sebelum nyontek kode dari tutorial manapun — field/model yang dipakai contoh belum tentu ada di project kalian.
2. **`bunx tsx prisma/seed.ts` gagal connect ke database** kalau dijalankan langsung — errornya nyasar ke `SASL: client password must be a string`, kelihatan kayak masalah kredensial padahal sebenarnya `DATABASE_URL` tidak ke-load sama sekali. Sebab: `tsx` lewat `bunx` jalan di atas Node.js biasa, yang **tidak** otomatis baca `.env` seperti `bun run`. Solusinya: tambahkan `import "dotenv/config"` di baris pertama `prisma/seed.ts` — pola yang sama persis dengan yang sudah ada di `prisma.config.ts`.
3. **`tsx` bukan dependency bawaan project ini.** Harus di-install manual (`bun add -d tsx`) sebelum command seed di `prisma.config.ts` bisa jalan — kalau lupa, `prisma migrate dev` atau `prisma db seed` bakal gagal cari binary `tsx`.

---

## 1. Framing pembuka (2 menit)

> "Sampai sekarang kita bisa create, read, update, delete satu-satu. Tapi di aplikasi nyata, kalian jarang cuma `findMany()` polos — kalian butuh: cari berdasarkan keyword, filter kategori, bagi ke halaman-halaman, dan kadang beberapa operasi database harus jalan **bareng, semua-atau-tidak-sama-sekali**. Itu semua yang kita bahas hari ini: filtering, pagination, dan transaction. Plus, cara isi database dengan data awal yang konsisten — seeding."

---

## 2. Filtering — operator yang perlu dihafal (10 menit) — slide halaman 2

**Live-type, satu-satu, jangan borongan. Buka scratch file atau langsung di `lib/data/post.ts` sambil dijelaskan:**

```ts
// Comparison operators
await db.post.findMany({ where: {
  viewCount: { gte: 100 },   // >= 100
  viewCount: { lte: 1000 },  // <= 1000
  createdAt: { gte: new Date("2025-01-01") },
}})
```

> "`gte`, `lte`, `gt`, `lt` — sama seperti operator matematika, cuma dieja. Ini bisa dipakai ke angka atau tanggal."

```ts
// String operators — case-insensitive search
await db.post.findMany({ where: {
  title: { contains: "Next.js", mode: "insensitive" },
}})
```

> "Ini yang paling sering dipakai buat fitur search. Tanpa `mode: 'insensitive'`, PostgreSQL default-nya **case-sensitive** — cari 'nextjs' tidak akan ketemu judul 'NextJS' atau 'Nextjs'. Ini juga jawaban kuis nanti."

**Live-run — buktikan langsung ke data seed project ini:**

```bash
bun run -e "
import('./lib/db').then(async ({db}) => {
  const found = await db.post.findMany({ where: { title: { contains: 'KE-1', mode: 'insensitive' } }, select: { title: true } });
  console.log(found);
});
"
```

> "Perhatikan saya sengaja ketik 'KE-1' huruf besar semua, padahal judul post kita 'Artikel ke-1'. Tetap ketemu — itu bukti `mode: insensitive` beneran jalan."

```ts
// Logical operators
await db.post.findMany({ where: {
  AND: [{ published: true }, { viewCount: { gte: 10 } }],
  OR: [{ category: "Tutorial" }, { viewCount: { gte: 100 } }],
}})
```

> "`AND`/`OR`/`NOT` dipakai kalau kondisi kalian lebih kompleks dari sekadar 'semua field harus cocok'. Default-nya, kalau kalian tulis beberapa key langsung di `where` tanpa `AND`/`OR`, itu otomatis di-AND-kan."

**Sebut relasi filter (`some`/`every`/`none`) — cukup dijelaskan konsepnya, karena project kita belum punya relasi many-to-many yang pas buat contoh ini:**
> "Kalau kalian punya relasi many-to-many — misal `Post` ke `Tag` — kalian bisa filter 'ada tag nextjs' pakai `tags: { some: { name: 'nextjs' } }`. `every` artinya semua item relasi harus cocok, `none` artinya tidak ada satupun yang cocok. Project kita belum punya model `Tag`, jadi ini cukup dipahami konsepnya dulu — pola yang sama nanti dipakai pas kalian butuh."

---

## 3. Implementasi nyata — `getPosts` dengan filter + offset pagination (10 menit) — slide halaman 3

**Live-type di `lib/data/post.ts` (sudah ada di project, jelaskan baris per baris):**

```ts
const PAGE_SIZE = 10;

export async function getPosts({
  query,
  category,
  page = 1,
}: {
  query?: string;
  category?: string;
  page?: number;
}) {
  const where = {
    published: true,
    deletedAt: null,
    ...(category ? { category } : {}),
    ...(query
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" as const } },
            { excerpt: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [posts, total] = await db.$transaction([
    db.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      select: { id: true, title: true, slug: true, excerpt: true, category: true },
    }),
    db.post.count({ where }),
  ]);

  return {
    posts,
    total,
    totalPages: Math.ceil(total / PAGE_SIZE),
    currentPage: page,
    hasNext: page * PAGE_SIZE < total,
    hasPrev: page > 1,
  };
}
```

**Talking point, dua bagian penting:**
> "Pertama, perhatikan `where` dibangun pakai spread operator (`...(category ? {...} : {})`) — ini trik biar filter opsional. Kalau `category` tidak diisi, bagian itu jadi objek kosong, tidak menyempitkan hasil. Kalau diisi, baru masuk sebagai kondisi tambahan."

> "Kedua — dan ini yang paling penting — kenapa `findMany` dan `count` dibungkus `db.$transaction([...])`? Karena kita butuh **dua angka yang konsisten satu sama lain**: daftar post di halaman ini, dan total keseluruhan buat hitung `totalPages`. Kalau dua query ini dijalankan terpisah (bukan transaction) dan ada post baru masuk di antara keduanya, `total` bisa saja tidak nyambung sama isi halamannya. `$transaction` dengan array begini menjalankan semuanya sebagai satu snapshot database yang sama."

**Live-run — buktikan ke data seed:**
```
getPosts({ page: 1 })       → 10 posts, total: 10, totalPages: 1, hasNext: false
getPosts({ query: "ke-1" }) → cocok "Artikel ke-1" DAN "Artikel ke-10" (contains, bukan exact match!)
getPosts({ category: "Tutorial" }) → 4 posts (dari 10 post seed, kategori dirotasi 3)
```
(Hasil ini sudah dites nyata sebelum kelas — tunjukkan langsung dari terminal kalau live.)

---

## 4. Cursor pagination — buat infinite scroll (8 menit) — slide halaman 3

**Talking point pembuka, bandingkan dengan offset:**
> "Offset pagination (`skip`/`take`) gampang dipahami, tapi ada masalah di dataset besar: `skip: 100000` artinya database harus **hitung dan lewati** 100 ribu baris duluan sebelum sampai ke baris yang kalian mau. Makin besar angkanya, makin lambat. Cursor pagination beda — dia bilang ke database 'mulai dari record **setelah** ID ini', pakai index, tanpa perlu hitung berapa baris yang dilewati."

**Live-type:**

```ts
export async function getPostsCursor(cursor?: string) {
  const posts = await db.post.findMany({
    where: { published: true, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 11, // ambil 11 untuk cek hasMore
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : 0, // skip cursor itu sendiri
    select: { id: true, title: true, slug: true, excerpt: true },
  });

  const hasMore = posts.length > 10;
  const data = hasMore ? posts.slice(0, 10) : posts;
  const nextCursor = hasMore ? data[9].id : null;

  return { posts: data, nextCursor, hasMore };
}
```

**Talking point — trik "ambil 11 padahal cuma butuh 10":**
> "Ini trik yang penting dipahami, bukan cuma dihafal. Kita minta 11 record, padahal per halaman cuma mau tampilin 10. Kenapa? Supaya kita tahu **apakah masih ada data setelahnya** tanpa query tambahan. Kalau yang balik cuma 10 atau kurang, berarti itu semua data yang ada — `hasMore: false`. Kalau balik 11, berarti masih ada lagi — kita potong jadi 10 buat ditampilkan (`slice(0, 10)`), dan simpan ID record ke-10 sebagai `nextCursor` buat request berikutnya."

> "`skip: cursor ? 1 : 0` ini detail yang gampang kelewat: cursor itu sendiri **ikut kehitung** hasil query kalau tidak di-skip — karena Prisma cursor pagination itu inklusif by default (mulai DARI record dengan ID itu, bukan SETELAHNYA). Makanya perlu `skip: 1` buat lewatin si cursor sendiri."

**Live-run — buktikan dengan data seed (cuma 10 post, jadi cukup 1 batch):**
```
getPostsCursor() → 10 posts, hasMore: false, nextCursor: null
```
> "Karena seed kita cuma 10 post, batch pertama langsung dapat semuanya dan `hasMore` sudah `false`. Kalau kalian tambah lebih dari 10 post lewat homelab, baru kelihatan `hasMore: true` dan bisa dites manggil `getPostsCursor(nextCursor)` buat ambil batch berikutnya."

---

## 5. Transaction — semua atau tidak sama sekali (12 menit) — slide halaman 4

**Bangun masalahnya dulu:**
> "Bayangin fitur: setiap kali seorang author bikin post baru, semua follower-nya dapat notifikasi. Itu dua operasi: `post.create` dan `notification.createMany`. Kalau `post.create` berhasil tapi `notification.createMany` gagal di tengah jalan — misal koneksi putus — apa yang terjadi? Post-nya sudah kepasang di database, tapi tidak ada satupun follower yang dapat notifikasi. Data jadi tidak konsisten."

**Live-type — pakai schema `Follow`/`Notification` yang baru ditambah:**

```ts
export async function createPostWithNotification(data: {
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  authorId: string;
}) {
  return db.$transaction(async (tx) => {
    const post = await tx.post.create({ data });

    const followers = await tx.follow.findMany({
      where: { followingId: data.authorId },
      select: { followerId: true },
    });

    if (followers.length > 0) {
      await tx.notification.createMany({
        data: followers.map((f) => ({
          userId: f.followerId,
          postId: post.id,
          message: `Post baru: ${post.title}`,
        })),
      });
    }

    return post;
  });
}
```

**Talking point paling penting di bagian ini — tulis besar-besar di papan:**
> "Perhatikan baik-baik: di dalam function ini, saya pakai `tx.post.create`, `tx.follow.findMany`, `tx.notification.createMany` — **bukan** `db.post.create` dst. Ini bukan soal gaya penulisan. `tx` adalah client versi khusus yang cuma hidup **di dalam** transaction ini. Kalau kalian iseng ganti salah satu jadi `db.something`, query itu keluar dari transaction scope — dia jalan sendiri, langsung commit ke database, **tidak ikut di-rollback** kalau ada bagian lain yang gagal. Ini jawaban kuis nomor 3 nanti."

**Live-run — buktikan skenario sukses (pakai data seed, `author1@example.com` punya 2 follower):**
```
Sebelum: notification count = 0
createPostWithNotification({ authorId: authorOne.id, ... })
Sesudah: notification count = 2   ← sesuai jumlah follower authorOne di seed
```

**Live-run — buktikan skenario GAGAL/rollback, ini bagian paling penting untuk didemo langsung:**

```ts
try {
  await db.$transaction(async (tx) => {
    await tx.post.create({
      data: { title: "Should Rollback", slug: "should-rollback", excerpt: "excerpt", authorId: authorOne.id },
    });
    throw new Error("test rollback");  // simulasi kegagalan di tengah transaction
  });
} catch (e) {
  console.log("caught:", e.message);
}

const check = await db.post.findUnique({ where: { slug: "should-rollback" } });
console.log(check); // null — post TIDAK tersimpan meskipun create() sempat jalan
```

**Talking point setelah run:**
> "Ini yang barusan kita buktikan, bukan cuma diomongin: `tx.post.create` di atas **sempat jalan** — kalau ini bukan transaction, post itu beneran kesimpen. Tapi karena `throw` terjadi sebelum function-nya selesai, Prisma otomatis rollback **semuanya**, termasuk `post.create` yang sudah 'jalan' tadi. Cek ke database, `slug: 'should-rollback'` itu `null` — tidak pernah ada. Ini yang bikin transaction powerful: kalian bisa nulis kode seolah-olah semua operasi pasti berhasil, dan percaya Prisma yang jamin konsistensinya kalau ternyata gagal di tengah."

**Sebut opsi konfigurasi (cukup dibaca, tidak perlu didemo):**
```ts
db.$transaction(async (tx) => { /* ... */ }, {
  timeout: 10000,      // max 10 detik
  maxWait: 5000,       // max tunggu koneksi tersedia
  isolationLevel: "Serializable", // isolasi paling ketat
})
```

---

## 6. Seeding (7 menit) — slide halaman 5

**Live-type — `prisma/seed.ts` (sudah ada di project, jelaskan strukturnya):**

```ts
import "dotenv/config";
import { db } from "../lib/db";

async function main() {
  console.log("Seeding database...");

  // Hapus data lama — urutan: child dulu, parent belakangan
  await db.notification.deleteMany();
  await db.follow.deleteMany();
  await db.comment.deleteMany();
  await db.post.deleteMany();
  await db.userPreferences.deleteMany();
  await db.user.deleteMany();

  // ... buat users, posts, comments, follows
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
```

**Talking point — urutan hapus itu bukan sembarangan:**
> "Lihat urutan `deleteMany` di atas: `notification` dan `follow` dulu, baru `comment`, baru `post`, baru `user` paling akhir. Kenapa? Karena ada foreign key. Kalau kalian coba hapus `User` duluan padahal masih ada `Post` yang nunjuk ke situ, database bakal nolak (atau di schema kita, karena `onDelete: Cascade`, itu ikut kehapus otomatis — tapi tetap, urutan child-dulu-parent-belakangan ini kebiasaan aman yang harus dipegang, apalagi kalau nanti relasinya tidak pakai cascade)."

**Live-run — dua cara menjalankan seed:**

```bash
bunx tsx prisma/seed.ts    # jalankan manual, langsung
bunx prisma db seed         # jalankan lewat Prisma CLI, baca config dari prisma.config.ts
```

**Ceritakan bug nyata yang kejadian saat prep** (lihat catatan di bagian atas naskah ini) — ini pengalaman belajar yang bagus buat siswa:
> "Waktu saya nyiapin demo ini, `bunx tsx prisma/seed.ts` sempat gagal dengan error yang kelihatannya soal password database — padahal aslinya `.env` tidak ke-load sama sekali, karena `tsx` lewat `bunx` itu jalan pakai Node.js polos yang tidak otomatis baca `.env` (beda dari `bun run`). Solusinya cuma satu baris: `import 'dotenv/config'` di paling atas file seed-nya."

**Live-edit — konfigurasi `prisma.config.ts` biar auto-run:**

```ts
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",   // ← baris ini
  },
  datasource: { url: env("DATABASE_URL") },
});
```

> "Setelah ini ada, tiap kali kalian jalankan `prisma migrate dev` dan ada migration baru yang berhasil ter-apply, Prisma otomatis jalanin seed ini juga — kecuali kalau kalian sudah punya data yang nggak mau ketimpa, di situ pertimbangkan bikin seed-nya idempotent atau jalankan manual saja."

---

## 7. Kuis cepat (3 menit) — slide halaman 6

1. Search case-insensitive di Prisma PostgreSQL? → **B** (`contains: 'keyword', mode: 'insensitive'`)
2. Keuntungan cursor pagination untuk dataset besar? → **B** (tidak perlu scan rows yang dilewati)
3. Kenapa harus pakai `tx` bukan `db` di dalam `$transaction` function-style? → **B** (query dengan `db` di luar transaction scope, tidak ikut di-rollback)

---

## 8. Tutup + homelab (2 menit) — slide halaman 7-8

Rangkuman lisan:
- Filter operators: `contains`+`mode: insensitive`, `gte`/`lte`/`gt`, `in`, `some`/`every`/`none` untuk relasi.
- Offset pagination: `skip`/`take` + `count` (dibungkus `$transaction` biar konsisten). Cursor pagination: lebih efisien untuk dataset besar, pakai trik "ambil N+1".
- Transaction: semua berhasil atau rollback semua. **Wajib** pakai `tx`, bukan `db`, di dalam function-style transaction.
- Seed: hapus child sebelum parent, konfigurasi command-nya di `prisma.config.ts`, dan jangan lupa `dotenv/config` kalau dijalankan lewat `tsx` langsung.

Homelab — **sudah dieksekusi penuh** di project ini (`getPosts`, `getPostsCursor`, `createPostWithNotification`, `prisma/seed.ts` semua sudah ada dan sudah dites), siswa tinggal baca kode atau replikasi pola yang sama di model lain:
1. Blog Search — `getPosts({ query, category, page })` ✅
2. Cursor Paginate — `getPostsCursor(cursor?)` ✅
3. Transaction — `createPostWithNotification(data)` ✅ (termasuk sudah dibuktikan rollback-nya jalan)
4. Seed File — `prisma/seed.ts`, 3 users, 10 posts, 20 comments ✅

Tutup: "Selanjutnya Bab 8 — Connection Pooling untuk Serverless & Production. Kita sudah bisa query kompleks; sekarang kita bahas gimana caranya koneksi database ini tetap aman waktu aplikasi kalian dijalankan di lingkungan serverless yang bisa nyala-mati ribuan kali."
