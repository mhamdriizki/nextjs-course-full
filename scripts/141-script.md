# Script Mengajar — Modul 14: SEO, Metadata & Performance
### Metadata API & generateMetadata

Sumber: `scripts/141.pdf` (7 slide). Semua contoh kode di bawah sudah dicek terhadap
kondisi repo saat ini (`AGENTS.md`, `node_modules/next/dist/docs/`, `next.config.ts`,
`lib/data/post.ts`, `app/blog/[slug]/page.tsx`) — bukan boilerplate generik.

**Konteks penting sebelum mulai ngajar:**
- Project ini pakai **Bun**, bukan npm (`bun.lock` ada di root). Semua command pakai `bun` / `bunx`.
- `next.config.ts` punya `cacheComponents: true` — ini strict mode yang mempengaruhi
  bagaimana `generateMetadata` boleh fetch data. Kalau `generateMetadata` fetch data uncached
  di halaman yang sepenuhnya bisa di-prerender, build akan **error** minta kamu pilih:
  `"use cache"` atau tandai dynamic secara eksplisit. Ini beda dari training data kalian.
- **Bilang di depan kelas: kita bakal ketemu bug beneran pas live coding, dan kita perbaiki
  bareng-bareng — ini bagian dari pelajarannya, bukan gangguan.** `cacheComponents: true` itu
  strict banget, jadi begitu kita nyambungin `generateMetadata`/`opengraph-image` ke Prisma,
  `bun run build` bakal nolak sampai kita kasih instruksi caching yang tepat. Selain itu project
  ini sebelumnya **belum pernah berhasil `bun build`** sama sekali — ada 2 bug lama
  (di luar topik metadata) yang bakal kita benerin juga sekalian biar project-nya bisa
  di-build utuh. Jangan panik kalau muncul error merah panjang di terminal — itu momen buat
  ngajarin cara baca error Next.js, bukan tanda kita salah nulis kode.
- `.env` sudah punya `NEXT_PUBLIC_APP_URL="http://localhost:3000"` — nggak perlu bikin baru,
  tinggal dipakai.
- `app/blog/[slug]/page.tsx` **saat ini masih hardcoded** (judul "Streaming di Next.JS" statis),
  belum fetch post asli dari DB. Ini kesempatan bagus buat sekalian hidupkan halaman itu pakai
  data asli sambil belajar `generateMetadata`.
- Fungsi query post asli ada di `lib/data/post.ts` → `getPostBySlug(slug)`, pakai Prisma,
  **belum** di-wrap `React.cache()`. Model `Post` di `prisma/schema.prisma` **tidak punya field
  gambar** (`coverImage`) — jadi OG image per-post cocok pakai `opengraph-image.tsx` dinamis
  (render judul post sebagai gambar), bukan file statis.
- `app/favicon.ico` sudah ada. Icon PWA/Apple dan OG image belum ada sama sekali.

---

## Slide 1 — Metadata API & generateMetadata (Cover)

**Durasi:** 1 menit

**Script:**
Oke gaes, masuk ke Modul 14 — SEO, Metadata & Performance. Bab pertama kita: Metadata API
sama `generateMetadata`. Jadi di Next.js App Router, urusan `<title>`, `<meta description>`,
Open Graph buat share ke sosmed, Twitter Card, sampe favicon — itu semua udah ada API native-nya.
Nggak perlu install package tambahan, nggak perlu utak-atik `<head>` manual kayak zaman Pages
Router dulu. Ada dua jenis: yang **static** (untuk halaman yang kontennya nggak gantung data),
sama yang **dynamic** (`generateMetadata`, buat halaman kayak detail post yang butuh fetch data
dulu). Plus ada juga file-based convention buat icon dan OG image. Yuk langsung masuk.

---

## Slide 2 — Static Metadata — export const metadata

**Durasi:** 6 menit

**Script:**
Nah ini yang paling gampang — static metadata. Caranya tinggal `export const metadata` dari
`layout.tsx` atau `page.tsx`, isinya satu object. Ini cuma jalan di Server Component ya, nggak
bisa dipake di client component.

Yang paling penting dan **wajib** kalian ingat: `metadataBase`. Kenapa wajib? Karena field-field
metadata yang butuh URL absolut — kayak OG image — kalau kalian isi dengan path relatif
(`/og-image.png` misalnya), itu harus di-resolve jadi URL absolut biar crawler kayak Facebook
atau Twitter bisa baca gambarnya. Tanpa `metadataBase`, kalau kalian pakai path relatif, itu
malah bikin **build error**. Dan hati-hati, `metadataBase` itu harus di-construct pakai
`new URL(...)`, bukan string biasa. Kalau kalian nulis `metadataBase: 'https://...'` sebagai
string doang, itu salah — TypeScript-nya bakal komplain karena tipe yang diharapkan itu `URL`
object.

Terus ada juga konsep **title template**. Di root layout kalian set `title: { template: '%s |
EasyCoding', default: 'EasyCoding' }`. Nah di child page, page itu cukup set title singkat kayak
`{ title: "Blog" }`, nanti otomatis di-render jadi `"Blog | EasyCoding"`. Jadi kalian nggak perlu
ngetik nama brand berulang-ulang di tiap halaman.

### 🖥️ Live Coding

Sekarang kita implementasikan di project asli. `.env` kita udah punya `NEXT_PUBLIC_APP_URL`,
jadi tinggal pakai.

1. Buka `app/layout.tsx`. Tambahkan import `Metadata` dan export `metadata` di root layout,
   sebelum komponen `RootLayout`:

   ```tsx
   // app/layout.tsx
   import type { Metadata } from "next";
   import Navbar from "./components/Navbar"
   import './globals.css';
   // ...import lain tetap sama

   export const metadata: Metadata = {
     metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL!),
     title: {
       template: "%s | EasyCoding",
       default: "EasyCoding — Belajar Next.js",
     },
     description: "Platform belajar Next.js dari basic sampai production-ready.",
     openGraph: {
       title: "EasyCoding",
       description: "Platform belajar Next.js dari basic sampai production-ready.",
       siteName: "EasyCoding",
       locale: "id_ID",
       type: "website",
     },
     twitter: {
       card: "summary_large_image",
       title: "EasyCoding",
       description: "Platform belajar Next.js dari basic sampai production-ready.",
     },
   };
   ```

   Catatan: taruh `export const metadata` di file yang sama dengan `export default function
   RootLayout`, jangan bikin dua export default/berbeda file — Next.js baca dari export
   `metadata` di `layout.tsx`/`page.tsx` langsung.

2. Kasih contoh title singkat di child page. Buka `app/blog/page.tsx`, tambahkan di atas
   komponennya:

   ```tsx
   // app/blog/page.tsx
   import type { Metadata } from "next";

   export const metadata: Metadata = {
     title: "Blog",
     description: "Kumpulan artikel dan tutorial dari EasyCoding.",
   };
   ```

3. Test manual — jalanin dev server:

   ```bash
   bun dev
   ```

   Buka `http://localhost:3000/blog` di browser → cek tab judul browser, harus muncul
   **"Blog | EasyCoding"**. Terus buka DevTools → Elements → cari `<head>`, pastikan ada
   `<meta property="og:title">`, `<meta name="description">`, dan `<link rel="canonical">`
   (kalau ada) sudah pakai URL absolut `http://localhost:3000/...`, bukan path relatif doang.

**Verifikasi:**
- [ ] Tab browser di `/blog` menampilkan "Blog | EasyCoding"
- [ ] Tab browser di halaman lain (misal `/`) menampilkan default title "EasyCoding — Belajar Next.js"
- [ ] `<head>` punya `og:title`, `og:description`, `og:site_name`

---

## Slide 3 — generateMetadata — Metadata Dinamis

**Durasi:** 7 menit

**Script:**
Sekarang buat halaman yang butuh data dinamis — kayak detail post blog. Di situ kita nggak
bisa pakai `export const metadata` statis, karena judul dan deskripsinya beda-beda tergantung
post mana yang dibuka. Solusinya: `generateMetadata`, sebuah async function yang nerima `params`
(dan `searchParams` khusus di `page.tsx`), terus return object `Metadata` — persis kayak yang
di-return `export const metadata`, cuma ini function jadi bisa fetch dulu.

Nah, poin kritis yang sering jadi soal quiz: kalau `generateMetadata` dan komponen `page()`
sama-sama manggil fungsi query yang sama — misalnya `getPostBySlug(slug)` yang connect ke
Prisma — itu defaultnya jalan **dua kali**. Karena `generateMetadata` dan render komponen page
itu proses yang terpisah. Biar nggak double query ke database, kita wrap fungsi itu pakai
`React.cache()`. Itu bikin request yang sama (dengan argumen sama) di-memoize dalam satu
render pass, jadi query DB-nya cuma jalan sekali walau dipanggil dari dua tempat.

Di project kita, `lib/data/post.ts` punya `getPostBySlug(slug)` yang connect ke Prisma langsung,
belum di-wrap cache. Yuk kita benerin sekalian sambil bikin `generateMetadata` buat halaman
blog detail — yang kebetulan sekarang **masih hardcoded**, belum baca data post asli.

Fair warning sebelum live coding: begitu kita sambungin `generateMetadata` ke Prisma via
`getPostBySlug`, `bun run build` bakal **merah** duluan — karena `cacheComponents: true` nggak
otomatis tahu boleh nge-cache hasil query itu atau nggak. Itu **wajar**, bukan kesalahan kalian.
Kita akan lihat pesan errornya bareng-bareng, terus perbaiki pakai `"use cache"` +
`cacheLife("blog")` (config `cacheLife.blog` udah ada duluan di `next.config.ts`).

### 🖥️ Live Coding

1. Buka `lib/data/post.ts`. Import `cache` dari `react`, wrap `getPostBySlug`:

   ```ts
   // lib/data/post.ts
   import { cache } from "react";
   import { cacheTag } from "next/cache";
   import { db } from "../db";

   // ...

   export const getPostBySlug = cache(async (slug: string) => {
     return db.post.findFirst({
       where: { slug, deletedAt: null },
       include: { author: { select: { name: true, email: true } } }
     });
   });
   ```

   Ganti `export async function getPostBySlug(slug: string) { ... }` yang lama jadi bentuk
   `cache(async (slug) => { ... })` di atas — logic query-nya tetap sama persis, cuma dibungkus.

2. Buka `app/blog/[slug]/page.tsx`. Sekarang halaman ini masih statis (judul "Streaming di
   Next.JS" hardcoded). Kita tambahkan `generateMetadata` yang fetch post asli, dan sekalian
   pakai data itu buat render judul beneran:

   ```tsx
   // app/blog/[slug]/page.tsx
   import { Suspense } from "react";
   import { ErrorBoundary } from "react-error-boundary";
   import type { Metadata } from "next";
   import { cacheLife } from "next/cache";
   import { notFound } from "next/navigation";
   import CommentSection from "./components/CommentsSection";
   import { getPublishedPosts } from "@/lib/data/blog";
   import { getPostBySlug } from "@/lib/data/post";

   export async function generateStaticParams() {
     const post = await getPublishedPosts();
     return post.map((post) => ({ slug: post.slug }));
   }

   export async function generateMetadata({
     params,
   }: {
     params: Promise<{ slug: string }>;
   }): Promise<Metadata> {
     "use cache"
     cacheLife("blog")

     const { slug } = await params;
     const post = await getPostBySlug(slug);

     if (!post) {
       return { title: "Artikel tidak ditemukan" };
     }

     return {
       title: post.title,
       description: post.excerpt,
       alternates: {
         canonical: `/blog/${slug}`,
       },
       openGraph: {
         title: post.title,
         description: post.excerpt,
         type: "article",
       },
     };
   }

   export default async function BlogPostPage({
     params
   }: {
     params: Promise<{ slug: string }>
   }) {
     return (
       <Suspense
         fallback={<div>Loading . . </div>}>
           <BlogPostContent params={params} />
       </Suspense>
     )
   }

   async function BlogPostContent({
     params
   }: {
     params: Promise<{ slug: string }>
   }) {
     "use cache"
     cacheLife("blog")

     const { slug } = await params;
     const post = await getPostBySlug(slug);

     if (!post) notFound();

     return (
       <article className="max-w-3xl mx-auto p-8">
         <div className="mb-12">
           <p className="text-blue-500 font-semibold mb-2">Artikel Blog /{slug}</p>
           <h1 className="text-4xl font-extrabold text-slate-900 mb-4">{post.title}</h1>
           <p className="text-lg text-slate-700 leading-relaxed">{post.excerpt}</p>
         </div>
         <hr />
         <ErrorBoundary
           fallback={
             <div className="mt-8 p-4 bg-red-50 text-red-600 border border-red-200 rounded-lg">
               Gagal memuat section komentar. Silahkan refresh halaman secara berkala.
             </div>
           }>
             <Suspense
               fallback={
                 <div className="mt-8 p-6 bg-slate-50 rounded-xl border border-slate-200 animate-pulse">
                   <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
                   <div className="h-20 bg-slate-200 rounded w-full"></div>
                 </div>
               }>
                 <CommentSection slug={slug} />
             </Suspense>
         </ErrorBoundary>
       </article>
     )
   }
   ```

   Catatan buat disampaikan ke kelas: aslinya `<CommentSection slug="{slug}"/>` di kode lama itu
   bug kecil — `slug` ke-passing sebagai string literal `"{slug}"`, bukan interpolasi. Sekalian
   kita benerin jadi `slug={slug}`.

3. Sekarang coba build beneran, biar kelas lihat sendiri errornya:

   ```bash
   bunx next build --debug-prerender
   ```

   Kalau kalian baru nulis `generateMetadata`/`BlogPostContent` yang manggil `getPostBySlug`
   **tanpa** `"use cache"`, build bakal gagal dengan pesan kira-kira:
   `used 'new Date()' before accessing either uncached data ... or Request data`, nunjuk ke
   baris `getPostBySlug(slug)`. Ini kejadian nyata pas kita nyiapin materi ini — bukan skenario
   karangan. Penyebabnya: route ini punya `generateStaticParams` (mau di-generate statis penuh
   di build time), tapi query Prisma-nya nggak "diakui" Next.js sebagai sumber data yang sah
   tanpa instruksi caching eksplisit — beda dengan `fetch()` yang otomatis kedetect.

   Solusinya **bukan** `connection()` (itu buat halaman yang emang mau dynamic tiap request,
   kayak `/posts/[slug]` nanti). Di sini kita mau kontennya di-cache statis, jadi solusinya
   tambahin `"use cache"` + `cacheLife("blog")` di `generateMetadata` **dan** di
   `BlogPostContent` — persis kayak kode di atas. Build ulang, harusnya sukses.

   Kalau nanti kalian nemu error serupa di halaman lain, cek dulu: halaman itu punya
   `generateStaticParams` (mau statis → pakai `"use cache"`) atau emang harus fresh tiap
   request (mau dynamic → pakai `connection()`/`cookies()`/`headers()` di dalam `<Suspense>`)?
   Jangan asal tempel salah satu tanpa mikirin konsekuensinya ke UX (statis = cepat tapi bisa
   basi; dynamic = selalu fresh tapi nunggu request).

**Verifikasi:**
- [ ] `bun dev` jalan tanpa error, buka `/blog/<slug-post-yang-ada-di-db>`
- [ ] Tab title browser menampilkan judul post asli (bukan lagi "Streaming di Next.JS")
- [ ] DevTools → Elements → `<head>` → `og:title` dan `og:description` sesuai data post
- [ ] Slug yang nggak ada di DB → halaman notFound (404), bukan crash
- [ ] `bunx next build --debug-prerender` selesai tanpa error terkait cache/dynamic

---

## Slide 4 — Icons & OG Images — File-based Convention

**Durasi:** 6 menit

**Script:**
Sekarang cara paling gampang buat kasih icon dan OG image: **file-based convention**. Jadi
kalian nggak perlu nulis config `icons: {...}` di object metadata sama sekali — cukup taruh
file dengan nama yang tepat di folder `app/`, Next.js otomatis generate meta tag-nya sendiri.

Nama filenya udah baku: `favicon.ico` buat icon tab browser, `icon.png` atau `icon.svg` buat
app icon, `apple-icon.png` buat iOS home screen, `opengraph-image.jpg` buat OG image default,
`twitter-image.jpg` buat Twitter card. Kalian taruh di `app/` root, otomatis kepasang di semua
halaman. Kalau kalian taruh versi lebih spesifik di folder lebih dalam — misal
`app/blog/[slug]/opengraph-image.tsx` — itu nge-override yang di root, khusus buat route itu.

Dan yang keren, `opengraph-image` itu bisa **dinamis** — bukan cuma file gambar statis, tapi
bisa jadi file `.tsx` yang generate gambar pakai JSX + CSS lewat `ImageResponse` dari `next/og`.
Cocok banget kalau OG image-nya perlu nampilin judul post yang beda-beda per artikel — apalagi
di project kita, model `Post` di database itu **nggak punya field gambar sama sekali**, jadi
opsi paling masuk akal buat OG image per-post ya generate dari judulnya langsung.

### 🖥️ Live Coding

`app/favicon.ico` udah ada di project. Yang belum: `icon.png`, `apple-icon.png`, OG image
default, dan OG image dinamis per post. Karena kita nggak punya file gambar branding asli buat
demo ini, kita fokus ke bagian yang **generated by code** — OG image dinamis — biar hasilnya
langsung keliatan tanpa perlu aset desain.

1. Buat `app/blog/[slug]/opengraph-image.tsx`. Slide aslinya kasih contoh pakai
   `export const runtime = "edge"` — **jangan langsung copy itu di project ini**. Prisma client
   kita pakai `node:path`/`node:url` yang nggak jalan di Edge Runtime, jadi kalau kalian pasang
   `runtime = "edge"` terus panggil `getPostBySlug` (Prisma) di dalamnya, `bun run build` bakal
   protes `"A Node.js module is loaded ... which is not supported in the Edge Runtime"`. Ini juga
   bug yang beneran ketemu pas nyiapin materi ini. Solusinya: **jangan set `runtime` sama
   sekali** (default-nya Node.js runtime, yang support Prisma), dan sama kayak Slide 3, tambahin
   `"use cache"` + `cacheLife("blog")` karena kita fetch Prisma di sini juga:

   ```tsx
   // app/blog/[slug]/opengraph-image.tsx
   import { ImageResponse } from "next/og";
   import { cacheLife } from "next/cache";
   import { getPostBySlug } from "@/lib/data/post";

   // Node.js runtime (default) — bukan edge, karena Prisma client project ini
   // pakai node:path/node:url yang tidak didukung di Edge Runtime.
   export const size = { width: 1200, height: 630 };
   export const contentType = "image/png";

   export default async function OgImage({
     params,
   }: {
     params: Promise<{ slug: string }>;
   }) {
     "use cache"
     cacheLife("blog")

     const { slug } = await params;
     const post = await getPostBySlug(slug);

     return new ImageResponse(
       (
         <div
           style={{
             background: "#0C1220",
             width: "100%",
             height: "100%",
             display: "flex",
             flexDirection: "column",
             justifyContent: "center",
             padding: 80,
           }}
         >
           <p style={{ color: "#1E86CF", fontSize: 28 }}>EasyCoding Blog</p>
           <h1 style={{ color: "white", fontSize: 60, margin: 0 }}>
             {post?.title ?? "Post"}
           </h1>
         </div>
       ),
       { ...size }
     );
   }
   ```

   Ingat, `getPostBySlug` yang tadi udah di-wrap `React.cache()` di Slide 3 — jadi walau dipanggil
   lagi di sini (terpisah dari `generateMetadata` dan `page()`), query Prisma-nya tetap cuma
   jalan sekali per slug per request.

2. (Opsional kalau ada waktu / aset) Untuk OG image default non-dinamis, cukup drop file
   `opengraph-image.jpg` ukuran 1200×630 langsung di `app/` root — nggak perlu kode sama sekali,
   Next.js otomatis pickup-nya.

3. Test manual:

   ```bash
   bun dev
   ```

   Buka langsung di browser: `http://localhost:3000/blog/<slug-post>/opengraph-image` — harus
   muncul gambar PNG 1200×630 dengan judul post di dalamnya. Kalau mau lihat preview lengkap
   kayak yang bakal muncul pas di-share ke sosmed, pakai situs **opengraph.xyz** atau
   **metatags.io**, paste URL post-nya di situ (butuh deploy publik atau tunnel kayak ngrok
   karena situs itu perlu akses dari luar, localhost nggak kebaca).

**Verifikasi:**
- [ ] `http://localhost:3000/blog/<slug>/opengraph-image` menampilkan gambar 1200×630 dengan judul post
- [ ] Devtools → Elements → `<head>` di halaman `/blog/<slug>` ada `<meta property="og:image">` mengarah ke route opengraph-image itu

---

## Bonus — Benerin `bun build` Biar Project-nya Bisa Di-build Utuh

**Durasi:** 8 menit

**Script:**
Nah gaes, sebelum lanjut kuis, saya mau kasih tau: project ini dari awal **belum pernah
berhasil `bun run build`** sama sekali — ada 2 bug lama, di luar topik metadata, yang bakal
kita benerin sekarang. Ini bonus, bukan basa-basi — kalian bakal sering banget ketemu situasi
kayak gini di kerjaan nyata: disuruh nambah fitur, eh pas mau build ternyata ada bug lain yang
udah nongkrong dari lama. Skill baca error message Next.js dan nyari akar masalahnya itu sama
pentingnya sama nulis fitur baru.

### 🖥️ Live Coding

1. Jalankan build dulu, lihat error pertama:

   ```bash
   bun run build
   ```

   Errornya nunjuk ke `app/uploads/inspect-action.ts:11` — `Property 'name' does not exist on
   type 'FormDataEntryValue'`. Buka file itu. Ada pengecekan:

   ```ts
   if (!(file instanceof File)) {
     console.log("Tidak ada file yang dikirim");
   }
   ```

   Ini cuma nge-`console.log`, **nggak ada `return`**. Jadi walau secara logic udah "ketauan"
   `file` itu bukan `File`, TypeScript tetap nganggep tipe `file` di baris-baris bawahnya itu
   `FormDataEntryValue | null` (bisa `string`), bukan `File` — makanya `.name`, `.type`, `.size`
   dianggap nggak ada. Perbaikannya, tambahin `return` biar TypeScript bisa nge-*narrow* tipe:

   ```ts
   // app/uploads/inspect-action.ts
   if (!(file instanceof File)) {
     console.log("Tidak ada file yang dikirim");
     return;
   }

   console.log({
     name: file.name,
     type: file.type,
     sizeInKb: (file.size / 1024).toFixed(2)
   });

   const buffer = Buffer.from(await file.arrayBuffer());
   console.log("Binary length: ", buffer.length, "bytes");
   ```

2. Build lagi. TypeScript sekarang lolos, tapi muncul error baru pas tahap "Generating static
   pages" — kali ini di `/posts/[slug]`:

   ```
   Error: Route "/posts/[slug]": Uncached data was accessed outside of <Suspense>.
       at <unknown> (app/components/Navbar.tsx:10:20)
   ```

   Aneh kan, errornya nunjuk ke `Navbar.tsx` yang notabene cuma manggil `usePathname()` di
   client component, bukan ke kode kita? Ini clue penting: kalau errornya nunjuk ke bagian
   layout yang dipakai SEMUA halaman, tapi cuma SATU route yang gagal, curigai route itu yang
   beda perlakuannya — bukan Navbar-nya.

   Coba `grep -rl "generateStaticParams" app`. Hasilnya: **semua** route dinamis lain
   (`app/foto/[id]`, `app/member/[id]`, `app/docs/[...slug]`, `app/blog/[slug]`) punya
   `generateStaticParams` — kecuali `app/posts/[slug]`. Tanpa itu, Next.js kepaksa build
   "shell" fallback generik buat parameter apa pun pas `next build`, dan di situlah dependensi
   ke `usePathname()` di layout global jadi soal. Solusinya: kasih `/posts/[slug]` daftar slug
   yang beneran ada, sama kayak pola di route lain:

   ```ts
   // app/posts/[slug]/page.tsx
   import { getPostBySlug, getPosts, incrementPostViewCount } from "@/lib/data/post";
   // ...import lain tetap sama

   export async function generateStaticParams() {
     const { posts } = await getPosts({});
     return posts.map((post) => ({ slug: post.slug }));
   }
   ```

3. Build sekali lagi — masih ada satu masalah tersisa di file yang sama. Perhatikan
   `PostDetailPage`-nya:

   ```tsx
   export default async function PostDetailPage({ params }: {...}) {
     const {slug} = await params;   // ← di-await SEBELUM masuk Suspense!

     return (
       <Suspense fallback={<p>Loading . . .</p>}>
         <PostDetailContent slug={slug}/>
       </Suspense>
     )
   }
   ```

   Bandingin sama pola di `app/blog/[slug]/page.tsx` yang kita bikin di Slide 3 — di situ
   `params` (masih berupa Promise, belum di-`await`) langsung dioper ke komponen di dalam
   `<Suspense>`. Di `posts/[slug]`, `params` di-`await` duluan **di luar** Suspense. `params`
   itu data per-request (tergantung URL), jadi meng-`await`-nya di luar Suspense bikin Next.js
   anggap seluruh shell — termasuk layout di atasnya — ikut blocking. Perbaikannya: pindahin
   `await params` ke dalam komponen yang udah di-Suspense:

   ```tsx
   // app/posts/[slug]/page.tsx
   export default async function PostDetailPage({
     params
   }: {
     params: Promise<{ slug: string }>
   }) {
     return (
       <Suspense fallback={<p>Loading . . .</p>}>
         <PostDetailContent params={params}/>
       </Suspense>
     )
   }

   async function PostDetailContent({ params }: { params: Promise<{ slug: string }> }) {
     await connection();

     const {slug} = await params;
     const post = await getPostBySlug(slug);
     // ...sisanya sama
   }
   ```

   Build ulang sekali lagi — sekarang harusnya **39/39 route sukses**, nggak ada error merah
   sama sekali.

**Verifikasi:**
- [ ] `bun run build` selesai sampai akhir, muncul tabel Route (app) tanpa error
- [ ] Baris terakhir bukan `error: script "build" exited with code 1`
- [ ] `/posts/[slug]` ikut kelist di tabel route sebagai Partial Prerender (`◐`)

---

## Kuis — Evaluasi Pemahaman

**Durasi:** 5 menit

**Script:**
Sebelum lanjut, yuk cek pemahaman kalian dulu lewat 3 soal ini. Jawab dulu di kepala/chat,
baru saya bahas.

**Q1 — Mengapa `metadataBase` wajib di Next.js App Router?**
- A) Tanpa ini metadata tidak digenerate
- **B) Agar URL relatif (OG images, canonical) bisa di-resolve menjadi URL absolut oleh crawler ✅**
- C) Hanya untuk deployment di Vercel

Pembahasan buat disampaikan: metadata tetap digenerate walau nggak ada `metadataBase` — tapi
kalau ada field URL-based yang isinya path relatif, itu bakal jadi **build error**. Ini bukan
soal platform deploy, ini soal gimana crawler ngebaca URL gambar/canonical secara absolut, di
platform hosting apa pun.

**Q2 — Jika `generateMetadata` dan `page()` keduanya call `getPost(slug)` dengan Prisma, berapa kali query DB dijalankan?**
- A) Dua kali — setiap call terpisah
- **B) Satu kali — jika `getPost` di-wrap dengan `React.cache()` ✅**
- C) Tergantung apakah pakai `'use cache'`

Pembahasan buat disampaikan: ini persis yang kita praktekin di Slide 3 tadi sama
`getPostBySlug` di `lib/data/post.ts`. Tanpa `React.cache()`, defaultnya dua kali query karena
`generateMetadata` dan render page itu proses terpisah. `'use cache'` itu directive beda lagi
(buat cache antar-request/build), bukan yang nyelesain masalah duplicate call dalam satu render
pass — itu tugasnya `React.cache()`.

**Q3 — Apa fungsi `alternates.canonical` di metadata?**
- A) Menentukan URL untuk sitemap
- **B) Mendefinisikan URL kanonik — mencegah duplicate content di search engine ✅**
- C) Alias untuk redirect

Pembahasan buat disampaikan: canonical URL itu sinyal ke search engine "ini versi resmi/utama
dari halaman ini", berguna kalau ada beberapa URL yang nampilin konten sama (misal karena query
param tracking, atau trailing slash). Ini yang kita pasang di Slide 3 lewat
`alternates: { canonical: '/blog/${slug}' }`.

---

## Homelab — Tugas Mandiri

**Durasi:** 2 menit (penjelasan tugas, dikerjakan mandiri)

**Script:**
Oke gaes, buat latihan mandiri kalian, ini tugasnya — implementasikan metadata lengkap buat
project blog kalian sendiri.

**01 — Root Metadata.** Di `app/layout.tsx`: set `metadataBase` (pakai `new URL`!), title
template, description, `openGraph`, `twitter`. → Ini udah kita kerjain bareng-bareng di
**Slide 2**, poin 1. `NEXT_PUBLIC_APP_URL` juga udah ada duluan di `.env` project ini, jadi
langkah "tambahkan ke .env" udah otomatis selesai — tinggal cek aja kalau kalian pindah project.

**02 — Post Metadata.** Buat `generateMetadata` di `app/blog/[slug]/page.tsx` dengan
`React.cache()`. Fetch post → title, description, OG image, canonical URL. → Ini persis
**Slide 3**, sudah lengkap kita kerjain (`getPostBySlug` di-wrap cache, `generateMetadata`
return title/description/canonical/openGraph).

**03 — Icons.** Taruh `favicon.ico` di `app/`. Buat `opengraph-image.jpg` (1200×630) di `app/`.
Test: buka DevTools → Elements → cek meta tags yang digenerate. → `favicon.ico` udah ada dari
awal di project ini. `opengraph-image.jpg` statis di root **belum kita buat** — ini PR buat
kalian: cari/desain 1 gambar 1200×630 dengan branding EasyCoding, drop di `app/opengraph-image.jpg`,
nggak perlu kode sama sekali (lihat Slide 4 poin 2).

**04 — Dynamic OG.** Buat `app/blog/[slug]/opengraph-image.tsx` dengan `ImageResponse`. Test di
opengraph.xyz dengan URL blog post kamu. → Sudah kita kerjain bareng-bareng di **Slide 4**,
poin 1. Yang perlu kalian lakuin sendiri: deploy (atau tunnel lokal) terus test beneran di
opengraph.xyz / metatags.io, karena situs itu butuh akses publik ke URL-nya.

💡 Tips test OG: **opengraph.xyz** atau **metatags.io** — masukin URL, langsung keliatan preview
gambar OG dan meta tag-nya kayak apa pas di-share ke Twitter/Facebook/dll.

---

## Rangkuman — Yang Sudah Kita Pelajari

**Durasi:** 2 menit

**Script:**
Oke, recap materi hari ini sebelum lanjut ke bab berikutnya:

- ✅ `metadataBase: new URL(APP_URL)` **wajib** — buat resolve OG image URL relatif jadi
  absolut, biar crawler bisa baca.
- ✅ Title template di root layout: `'%s | Brand'`. Child pages cukup set title singkat, nanti
  otomatis digabung.
- ✅ `generateMetadata`: buat fetch data untuk metadata dinamis. **Wajib** wrap Prisma call
  (atau data source lain) pakai `React.cache()` biar nggak double-query kalau dipanggil dari
  `generateMetadata` dan `page()` sekaligus.
- ✅ File-based icons: `favicon.ico`, `apple-icon.png`, `opengraph-image.jpg` — taruh di folder
  `app/`, nggak perlu konfigurasi apa-apa, Next.js handle otomatis.
- ✅ `opengraph-image.tsx`: dynamic OG image pakai JSX + `ImageResponse`. Cek dulu apakah
  Prisma client kalian kompatibel edge runtime atau nggak — kalau nggak (kayak project kita),
  pakai Node.js runtime default, jangan asal ikut `runtime = "edge"` dari contoh.
- ✅ Di bawah `cacheComponents: true`, tiap kali nyambungin data ke Prisma/DB, kalian harus
  putuskan sadar: halaman ini mau **statis** (`"use cache"` + `cacheLife`, cocok buat konten
  yang jarang berubah kayak artikel blog) atau **dynamic** (`connection()`/`cookies()`/
  `headers()` di dalam `<Suspense>`, cocok buat data per-user/per-request kayak session atau
  view counter). Nggak ada default yang otomatis "benar" — dan `bun run build` bakal maksa
  kalian mikirin ini dengan nolak build sampai pilihannya eksplisit (lihat bagian **Bonus**).

Selanjutnya kita lanjut ke **Bab 2 — `sitemap.ts` & `robots.ts`**. Sampai ketemu di sesi
berikutnya, gaes!
