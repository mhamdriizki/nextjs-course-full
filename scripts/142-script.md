# Script Mengajar — Modul 14: SEO, Metadata & Performance (Bab 2)
### sitemap.ts, robots.ts & JSON-LD

Sumber: `scripts/142.pdf` (7 slide). Lanjutan dari `141-script.md`. Semua kode di bawah sudah
dicek terhadap kondisi repo aktual (`next.config.ts`, `lib/data/post.ts`, `app/blog/[slug]/page.tsx`,
`app/posts/action.ts`) dan **sudah dieksekusi + di-build di branch ini**, bukan boilerplate.

**Konteks penting sebelum mulai ngajar:**
- Sama kayak materi sebelumnya: kita bakal ketemu bug/gotcha nyata pas live coding, dan itu
  bagian dari pelajaran. Kali ini ketemu satu yang penting banget: PDF ngajarin
  `export const revalidate = 3600` di `sitemap.ts` (pola lama Next.js), tapi project ini pakai
  `cacheComponents: true` di `next.config.ts` — dan pola lama itu **diam-diam nggak jalan**
  di situ. Detail lengkap di Slide 2.
- Project ini nggak punya halaman `/about` (yang disebut di slide homelab). Static page yang
  beneran ada di root: `/`, `/blog`, `/contacts`. Kita pakai itu sebagai gantinya.
- Data post asli (Prisma, model `Post`) itu yang dipakai `app/posts/[slug]`, bukan
  `app/blog/[slug]` (yang generateStaticParams-nya masih dari mock data `lib/data/blog.ts`,
  peninggalan materi sebelumnya). Jadi untuk **dynamic pages di sitemap**, kita ambil dari
  `db.post.findMany` (Prisma) dan link-nya ke `/posts/<slug>`, sesuai instruksi PDF yang literally
  bilang "dynamic pages dari `db.post.findMany`".
- `.env` udah ada `NEXT_PUBLIC_APP_URL` — dipakai buat base URL absolut di sitemap & robots
  (sama kayak materi 141).
- `publishPostAction` di `app/posts/action.ts` adalah action yang literally "mempublish" post
  (`updatePost(id, { published: true })`) — itu yang paling pas buat homelab task 04
  ("setelah publish post, tambahkan `revalidatePath`"), bukan `createPostAction` (yang bikin
  post baru dengan `published: false` default).

---

## Slide 1 — sitemap.ts & robots.ts (Cover)

**Durasi:** 1 menit

**Script:**
Lanjut ke Bab 2, gaes — masih di Modul 14 SEO & Performance. Kali ini kita bahas dua file yang
sering diremehkan tapi penting banget buat SEO: `sitemap.ts` sama `robots.ts`. Dua-duanya native
di Next.js, generate otomatis dari data database kalian, nggak perlu library tambahan sama
sekali. Kita juga bakal singgung JSON-LD — structured data yang bikin hasil pencarian Google
kalian bisa muncul lebih kaya, kayak breadcrumb atau rating bintang.

---

## Slide 2 — sitemap.ts — Sitemap Otomatis dari Database

**Durasi:** 8 menit

**Script:**
`sitemap.ts` itu file convention khusus — taruh di `app/sitemap.ts`, isinya default export
function yang return array of URL, terus Next.js otomatis generate `/sitemap.xml` buat kalian.
Nggak perlu nulis XML manual, nggak perlu library `sitemap` dari npm segala.

Tiap entry di array itu punya `url`, `lastModified`, `changeFrequency` (seberapa sering
kontennya berubah — `daily`, `weekly`, `monthly`, dst), sama `priority` (0 sampai 1, seberapa
penting halaman itu dibanding halaman lain di situs kalian). Isinya bisa gabungan dua jenis:
**static pages** yang kalian tulis manual (kayak homepage, halaman blog listing), sama
**dynamic pages** yang di-generate dari query database — misalnya satu entry per artikel yang
published.

### 🖥️ Live Coding

1. Buat `app/sitemap.ts`. **Ikutin dulu pola yang di slide** — pakai
   `export const revalidate = 3600` (artinya: regenerate sitemap tiap 3600 detik / 1 jam):

   ```ts
   // app/sitemap.ts
   import type { MetadataRoute } from "next";
   import { db } from "@/lib/db";

   export const revalidate = 3600;

   export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
     const baseUrl = process.env.NEXT_PUBLIC_APP_URL!;

     const staticPages: MetadataRoute.Sitemap = [
       { url: baseUrl, lastModified: new Date(), changeFrequency: "yearly", priority: 1 },
       { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
       { url: `${baseUrl}/contacts`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
     ];

     const posts = await db.post.findMany({
       where: { published: true, deletedAt: null },
       select: { slug: true, updatedAt: true },
     });

     const postPages: MetadataRoute.Sitemap = posts.map((post) => ({
       url: `${baseUrl}/posts/${post.slug}`,
       lastModified: post.updatedAt,
       changeFrequency: "weekly",
       priority: 0.7,
     }));

     return [...staticPages, ...postPages];
   }
   ```

   Catatan buat kelas: kita pakai `/`, `/blog`, `/contacts` buat static pages, **bukan**
   `/about` kayak di slide — project ini nggak punya halaman `/about`. Selalu cek dulu halaman
   apa aja yang beneran ada sebelum nulis sitemap, jangan asal ikut contoh.

2. Jalankan build, terus lihat baik-baik tabel Route-nya:

   ```bash
   bun run build
   ```

   Cari baris `/sitemap.xml` di tabel "Route (app)" hasil build. Ini kejadian nyata yang kita
   temuin pas nyiapin materi ini: baris itu ditandain **`ƒ` (Dynamic)**, bukan `○` (Static) atau
   `◐` (Partial Prerender). Artinya `export const revalidate = 3600` itu **kebaca tapi nggak
   ngefek** — sitemap-nya tetep di-generate ulang (query DB) di **setiap request**, bukan sekali
   per jam kayak yang kita maksud.

   Kenapa? Karena `export const revalidate = N` itu config dari model caching **lama**
   Next.js. Project ini pakai `cacheComponents: true` di `next.config.ts`, yang makai model
   caching baru berbasis `"use cache"` + `cacheLife()` — bukan config `revalidate` di level
   segmen. Dokumentasinya sendiri ("Caching (Previous Model)") bilang eksplisit itu "assumes
   you are **not** using Cache Components". Config lama itu nggak error, cuma diam-diam
   diabaikan.

3. Perbaiki pakai pola caching yang beneran jalan di `cacheComponents: true` — ganti
   `export const revalidate` jadi `"use cache"` + `cacheLife({ revalidate: 3600 })` di dalam
   function-nya:

   ```ts
   // app/sitemap.ts
   import type { MetadataRoute } from "next";
   import { cacheLife } from "next/cache";
   import { db } from "@/lib/db";

   export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
     "use cache"
     cacheLife({ revalidate: 3600 })

     const baseUrl = process.env.NEXT_PUBLIC_APP_URL!;
     // ...sisanya sama kayak sebelumnya
   }
   ```

   `cacheLife({ revalidate: 3600 })` itu setara persis sama niat `export const revalidate =
   3600` yang lama — regenerate di background tiap 3600 detik — cuma bentuknya inline profile,
   bukan segment config. Build ulang, sekarang `/sitemap.xml` di tabel route bakal jadi
   `○` dengan kolom Revalidate `1h`.

**Verifikasi:**
- [ ] `bun run build` → baris `/sitemap.xml` bertanda `○` (bukan `ƒ`), kolom Revalidate = `1h`
- [ ] `bun dev`, buka `http://localhost:3000/sitemap.xml` → XML valid, ada entry `/`, `/blog`,
  `/contacts`, plus satu entry `/posts/<slug>` per post published di database
- [ ] Tiap entry post punya `<lastmod>` sesuai `updatedAt` post itu (bukan tanggal hari ini)

---

## Slide 3 — robots.ts — Kontrol Crawler

**Durasi:** 6 menit

**Script:**
Kalau sitemap itu ngasih tau search engine "ini semua halaman gue", `robots.txt` itu ngasih
tau "ini yang BOLEH sama yang JANGAN kamu crawl". Sama kayak sitemap, kalian bisa bikin
`app/robots.ts` yang return object `rules`, Next.js otomatis serve di `/robots.txt`.

Yang perlu di-**disallow** biasanya: `/api/*` (itu response JSON, bukan halaman buat manusia),
`/admin/*` sama `/dashboard/*` (akses terbatas/konten personal), `/_next/*` (internal Next.js,
biasanya udah otomatis di-handle). Yang perlu **allow**: homepage, halaman konten publik kayak
`/blog/*`, halaman produk/about.

Satu poin menarik dari slide: **GPTBot**. Itu crawler-nya ChatGPT/OpenAI buat ngumpulin data
training AI. Kalau kalian nggak mau konten situs kalian dipakai buat training model AI, kalian
bisa tambahin rule khusus nge-disallow GPTBot secara spesifik — beda dari rule umum buat
`userAgent: '*'`.

### 🖥️ Live Coding

1. Buat `app/robots.ts`:

   ```ts
   // app/robots.ts
   import type { MetadataRoute } from "next";

   export default function robots(): MetadataRoute.Robots {
     const baseUrl = process.env.NEXT_PUBLIC_APP_URL!;

     return {
       rules: [
         {
           userAgent: "*",
           allow: "/",
           disallow: ["/api/", "/admin/", "/dashboard/"],
         },
         {
           userAgent: "GPTBot",
           disallow: "/",
         },
       ],
       sitemap: `${baseUrl}/sitemap.xml`,
     };
   }
   ```

   Perhatiin: `disallow` di rule pertama itu array (`["/api/", "/admin/", "/dashboard/"]`) biar
   satu rule nge-cover tiga path sekaligus. Rule kedua khusus `GPTBot` nge-disallow semuanya
   (`"/"`) — jadi GPTBot dapet dua rule yang berlaku (rule spesifik `GPTBot` menang dibanding
   rule `*` buat user-agent itu).

2. Test manual, nggak perlu build produksi buat ini — `robots.ts` langsung ke-serve di dev mode:

   ```bash
   bun dev
   ```

   Buka `http://localhost:3000/robots.txt` di browser. Harus muncul plain text kayak gini:

   ```
   User-Agent: *
   Allow: /
   Disallow: /api/
   Disallow: /admin/
   Disallow: /dashboard/

   User-Agent: GPTBot
   Disallow: /

   Sitemap: http://localhost:3000/sitemap.xml
   ```

**Verifikasi:**
- [ ] `http://localhost:3000/robots.txt` nampilin plain text, bukan error/404
- [ ] Ada baris `Disallow: /api/`, `/admin/`, `/dashboard/` di bawah `User-Agent: *`
- [ ] Ada blok terpisah `User-Agent: GPTBot` dengan `Disallow: /`
- [ ] Baris terakhir `Sitemap: <NEXT_PUBLIC_APP_URL>/sitemap.xml` — URL absolut, bukan relatif

---

## Slide 4 — JSON-LD — Structured Data untuk Rich Results

**Durasi:** 8 menit

**Script:**
Terakhir, JSON-LD. Ini beda sama metadata `<title>`/`<meta>` yang udah kita bahas di materi
sebelumnya — JSON-LD itu **structured data**: blok JSON yang dikasih tipe schema.org (`Article`,
`Product`, `BlogPosting`, `Person`, dll), ditaruh di dalam `<script type="application/ld+json">`.
Search engine baca ini buat nampilin **rich results** — breadcrumb di bawah URL, rating
bintang, tanggal publish artikel, foto author, dll — yang bikin hasil pencarian kalian lebih
menonjol dibanding kompetitor yang cuma nampilin title+description biasa.

Next.js nggak punya file convention khusus buat ini (beda dari sitemap/robots) — caranya cuma
render `<script>` tag manual di komponen kalian, isinya `JSON.stringify` dari object JSON-LD.
Satu hal PENTING yang sering kelewat: `JSON.stringify` doang itu **rawan XSS** kalau ada
karakter `<` di data kalian (misal title artikel ada kata `<script>`). Makanya sebelum di-inject
ke `dangerouslySetInnerHTML`, escape karakter `<` jadi `<` dulu.

### 🖥️ Live Coding

Kita pasang JSON-LD tipe `BlogPosting` di halaman detail blog yang udah kita bikin di materi
sebelumnya (`app/blog/[slug]/page.tsx`) — kebetulan halaman itu udah fetch data post asli
(`post.title`, `post.excerpt`, `post.author`, `post.createdAt`, `post.updatedAt`) lewat
`getPostBySlug`, jadi tinggal dipetakan ke schema-nya.

1. Buka `app/blog/[slug]/page.tsx`. Di dalam `BlogPostContent`, tepat setelah pengecekan
   `if (!post) notFound();`, tambahin object `jsonLd` dan render `<script>`-nya sebagai child
   pertama `<article>`:

   ```tsx
   // app/blog/[slug]/page.tsx — di dalam BlogPostContent, setelah if (!post) notFound();
   const jsonLd = {
     "@context": "https://schema.org",
     "@type": "BlogPosting",
     headline: post.title,
     description: post.excerpt,
     author: { "@type": "Person", name: post.author.name },
     datePublished: post.createdAt.toISOString(),
     dateModified: post.updatedAt.toISOString(),
   };

   return (
     <article className="max-w-3xl mx-auto p-8">
       {/* JSON-LD structured data buat rich results Google */}
       <script
         type="application/ld+json"
         dangerouslySetInnerHTML={{
           __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
         }}
       />
       {/* ...sisa JSX yang udah ada (div judul, ErrorBoundary komentar, dll) tetep sama */}
   ```

   Perhatiin `.replace(/</g, "\\u003c")` di baris terakhir — itu mitigasi XSS yang tadi
   disebutin di narasi. Jangan skip langkah itu walau keliatan sepele.

2. Test manual — nggak perlu tool eksternal dulu buat ngecek strukturnya bener, cukup lihat
   HTML mentahnya:

   ```bash
   bun dev
   ```

   Buka `http://localhost:3000/blog/<slug-post-yang-ada>`, View Source (atau
   `curl -s http://localhost:3000/blog/<slug> | grep 'application/ld+json'`). Harus keliatan
   satu `<script type="application/ld+json">` isinya JSON valid dengan `@type: "BlogPosting"`.

3. Buat validasi resmi ke Google, pakai **search.google.com/test/rich-results** — paste URL
   halaman blog kalian (butuh publicly accessible URL, jadi ini biasanya ditest setelah
   deploy, bukan dari localhost).

**Verifikasi:**
- [ ] `curl -s http://localhost:3000/blog/<slug> | grep 'application/ld+json'` nunjukin satu
  `<script>` tag dengan JSON valid
- [ ] Isi JSON punya `@type: "BlogPosting"`, `headline` sesuai judul post, `author.name` terisi
- [ ] `datePublished`/`dateModified` dalam format ISO 8601 (`2026-08-26T01:51:06.862Z`), bukan
  `[object Object]` atau error

---

## Kuis — Evaluasi Pemahaman

**Durasi:** 5 menit

**Script:**
Sebelum ke homelab, cek dulu pemahaman kalian lewat 3 soal ini.

**Q1 — Di mana file `sitemap.ts` diletakkan dan URL apa yang dihasilkan?**
- A) Di `/public/sitemap.ts` → `/sitemap.txt`
- **B) Di `/app/sitemap.ts` → `/sitemap.xml` otomatis ✅**
- C) Di `/pages/sitemap.ts` → `/sitemap.json`

Pembahasan buat disampaikan: ini file convention App Router, harus di `app/`, bukan `public/`
atau `pages/` (itu pattern Pages Router lama). Next.js otomatis nge-generate output di
`/sitemap.xml`, sesuai standar Sitemaps XML Protocol — itu yang tadi kita liat langsung di
Slide 2.

**Q2 — Apa fungsi `export const revalidate = 3600` di `sitemap.ts`?**
- **A) Regenerate sitemap setiap 3600 detik (1 jam) ✅**
- B) Cache sitemap selama 3600 menit
- C) Limit 3600 URL per sitemap

Pembahasan buat disampaikan: secara **konsep**, jawabannya A — itu memang niat dari config
`revalidate` (dalam detik, bukan menit — jadi B salah satuan). TAPI, seperti yang kita
buktiin langsung di Slide 2 poin 2-3: di project **ini** yang pakai `cacheComponents: true`,
config `export const revalidate` versi lama itu **nggak benar-benar jalan** — route-nya malah
jadi full dynamic (query tiap request), bukan di-cache 1 jam. Buat dapetin efek yang sama di
sini, kita harus pakai `"use cache"` + `cacheLife({ revalidate: 3600 })`. Ini contoh bagus kenapa
penting ngecek `next.config.ts` project kalian sebelum percaya 100% sama satu pola dari
tutorial/slide.

**Q3 — Mengapa `/api/*` sebaiknya di-disallow di `robots.ts`?**
- A) API endpoints tidak aman untuk crawler
- **B) JSON response tidak berguna untuk SEO dan hanya menambah beban server ✅**
- C) Next.js tidak support crawl API routes

Pembahasan buat disampaikan: bukan soal keamanan (A) atau limitasi teknis Next.js (C) —
`/api/*` itu response-nya JSON mentah, nggak ada value buat muncul di hasil pencarian, dan
kalau dibiarkan di-crawl cuma buang-buang crawl budget + beban server buat request yang nggak
menghasilkan apa-apa buat SEO.

---

## Homelab — Tugas Mandiri

**Durasi:** 2 menit (penjelasan tugas, dikerjakan mandiri)

**Script:**
Oke gaes, buat latihan mandiri kalian — implementasikan `sitemap.ts` dan `robots.ts` lengkap
buat project kalian.

**01 — `app/sitemap.ts`.** Buat sitemap dengan static pages (`/`, `/blog`, `/about`) + dynamic
pages dari `db.post.findMany`. Set `revalidate = 3600`. Test di `/sitemap.xml`. → Udah kita
kerjain bareng-bareng di **Slide 2** — dengan catatan: project ini pakai `/contacts` bukan
`/about` (nggak ada halaman itu), dan `revalidate`-nya pakai bentuk modern `cacheLife({
revalidate: 3600 })`, bukan `export const revalidate` (yang udah kebukti nggak jalan di project
ber-`cacheComponents: true`).

**02 — `app/robots.ts`.** Buat `robots.ts` dengan rules: allow `'/'`, disallow `'/api/'`,
`'/admin/'`, `'/dashboard/'`. Tambahkan sitemap URL. Test di `/robots.txt`. → Udah lengkap kita
kerjain di **Slide 3**, plus bonus rule khusus `GPTBot`.

**03 — JSON-LD Post.** Tambahkan JSON-LD `BlogPosting` schema ke `app/blog/[slug]/page.tsx`.
Test di `search.google.com/test/rich-results`. → Udah kita kerjain di **Slide 4**. Yang perlu
kalian lakuin sendiri: deploy dulu (rich results test butuh URL publik), baru validasi di situ.

**04 — Sitemap Update.** Di `createPost` Server Action: setelah publish post, tambahkan
`revalidatePath('/sitemap.xml')`. Test: publish post baru → cek sitemap diupdate. → Kita
terapkan ini di `publishPostAction` (bukan `createPostAction`) di `app/posts/action.ts`, karena
itu action yang literally nge-set `published: true` — momen yang tepat buat bilang ke Next.js
"sitemap-nya udah basi, tolong regenerate". Kalian bisa test manual: panggil
`publishPostAction(<id-post-draft>)`, lalu buka `/sitemap.xml` lagi — entry post itu harus
muncul (assuming sebelumnya belum published jadi belum ada di sitemap).

💡 Tips test sitemap & robots: langsung akses `/sitemap.xml` dan `/robots.txt` di browser — dua
duanya di-serve otomatis oleh Next.js, nggak perlu setup tambahan. Buat JSON-LD, pakai
**search.google.com/test/rich-results** setelah deploy.

---

## Rangkuman — Yang Sudah Kita Pelajari

**Durasi:** 2 menit

**Script:**
Oke, recap Bab 2 sebelum lanjut ke bab berikutnya:

- ✅ `app/sitemap.ts` → `/sitemap.xml` otomatis. Gabungin static pages (ditulis manual) +
  dynamic pages (dari query database, misal `db.post.findMany`).
- ✅ Regenerate sitemap secara berkala: **di project dengan `cacheComponents: true`**, pakai
  `"use cache"` + `cacheLife({ revalidate: 3600 })` — bukan `export const revalidate` (pola
  lama yang diam-diam diabaikan). Kita buktiin bedanya langsung lewat tabel route hasil
  `bun run build` (`ƒ` Dynamic vs `○` Static+Revalidate).
- ✅ `revalidatePath('/sitemap.xml')` buat regenerate on-demand — dipanggil di server action
  yang mengubah status published sebuah post (`publishPostAction`), bukan cuma di action create.
- ✅ `app/robots.ts` → `/robots.txt`. Disallow `/api/`, `/admin/`, `/dashboard/` — karena JSON
  response dan konten personal nggak ada gunanya buat SEO. Bisa kasih rule khusus per user-agent
  (misal blokir `GPTBot` biar konten nggak dipakai training AI).
- ✅ JSON-LD structured data: inject `<script type="application/ld+json">` manual (nggak ada
  file convention-nya), selalu escape karakter `<` (`.replace(/</g, "\\u003c")`) buat cegah XSS.
  Validasi pakai Google Rich Results Test.

Selanjutnya kita lanjut ke **Bab 3 — Font Optimization dengan `next/font`**. Sampai ketemu di
sesi berikutnya, gaes!
