# Script Mengajar — 13.4 Next Image

**Sumber:** `scripts/134.pdf` (7 slide) — Modul 13, Upload File & Optimasi Gambar

> ⚠️ **Catatan penting sebelum mulai ngajar:** slide (kuis Q2) ngajarin
> `priority={true}` buat gambar above-the-fold. Tapi begitu dicek ke
> `node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md`,
> **sejak Next.js 16, prop `priority` sudah deprecated, diganti `preload`**
> (lihat tabel "Version History" di dokumen itu, baris `v16.0.0`). Project
> ini pakai `next@16.2.10`, jadi semua live-coding di script ini pakai
> `preload`, bukan `priority`. Ini contoh kedua (setelah `z.file()` di
> 13.3) kenapa AGENTS.md nyuruh kita selalu cek dokumentasi versi yang
> beneran ke-install sebelum nulis kode.
>
> Semua perubahan kode di bawah **sudah dieksekusi langsung** ke branch
> aktif — bukan cuma rencana. File yang diubah: `next.config.ts`,
> `app/components/Avatar.tsx` (baru), `app/components/UserBadge.tsx`,
> `app/dashboard/settings/AvatarUploadForm.tsx`,
> `app/dashboard/settings/page.tsx`, `app/uploads/UploadForm.tsx`.

---

## Slide 1 — Image Optimization Next.js 16

**Durasi:** 2 menit

**Script:**
"Lanjut ke 13.4 — Image Optimization. Modul ini ngebahas `next/image`,
komponen bawaan Next.js buat nampilin gambar. Fiturnya: lazy loading
otomatis, konversi ke WebP/AVIF otomatis, sama responsive sizing — semua
tanpa kita ngoding manual. Efeknya nyata ke Core Web Vitals, terutama LCP
(Largest Contentful Paint) sama CLS (Cumulative Layout Shift), dua metrik
yang dipake Google buat nilai performa web kita."

---

## Slide 2 — `<Image>` vs `<img>` — Perbedaan yang Signifikan

**Durasi:** 5 menit

**Script:**
"Banyak yang ngira `next/image` itu cuma wrapper tipis dari `<img>` biasa.
Padahal itu sistem optimasi gambar lengkap yang built-in. Bedanya apa aja?

Pertama, `<img>` biasa itu langsung download gambar full-size, nggak peduli
device kalian layarnya gede atau kecil. `<Image>` otomatis generate
beberapa ukuran (`srcset`) dan browser milih yang paling pas.

Kedua, `<img>` nggak nge-reserve ruang buat gambar sebelum gambar itu
kelar loading — makanya sering bikin konten 'loncat' pas gambar muncul,
itu namanya layout shift. `<Image>` wajib tau `width`/`height` (atau pakai
`fill`), jadi browser udah nyiapin ruangnya dari awal.

Ketiga, `<Image>` otomatis convert ke format modern kayak WebP atau AVIF
kalau browser-nya support, jadi ukuran file lebih kecil tapi kualitas tetep
bagus.

Keempat — dan ini yang paling gampang keliatan langsung — `<Image>`
lazy-load by default. Gambar yang belum masuk viewport nggak di-download
dulu, hemat bandwidth."

---

## Slide 3 — Pola Penggunaan next/image

**Durasi:** 20 menit

**Script:**
"Sekarang kita bedah 4 pola penggunaan `next/image`, langsung praktik di
kode yang udah ada di project kita.

Pola 1: **Fixed size** — kalau kalian tau persis ukuran gambar, tinggal
kasih `width` dan `height` dalam pixel.

Pola 2: **Fill** — kalau ukuran container-nya dinamis (misal avatar bulat
yang ukurannya beda-beda di tempat berbeda), pakai `fill`, taruh di dalam
`<div>` yang `position: relative`, terus atur `objectFit: 'cover'` biar
gambarnya crop rapi.

Pola 3: **Responsive dengan `sizes`** — ini WAJIB dipasang bareng `fill`,
soalnya `sizes` ngasih tau browser 'di breakpoint ini, gambar bakal
selebar berapa', biar Next.js generate `srcset` yang efisien.

Pola 4: soal `priority` — nah ini yang beda dari materi ya. Slide-nya
ngajarin `priority={true}`, tapi kita udah cek: di Next.js 16 yang
kepasang di project ini, `priority` itu **deprecated**, diganti `preload`.
Fungsinya sama — buat gambar yang keliatan pertama kali pas halaman
di-load (above-the-fold, misal hero image atau avatar di navbar) — tapi
nama prop-nya `preload`."

### 🖥️ Live Coding

1. **Fixed size** — di `app/uploads/UploadForm.tsx`, preview hasil upload
   lokal (`public/uploads/...`) sekarang pakai ukuran tetap:

   ```tsx
   import Image from "next/image";
   // ...
   {state?.success && (
     <Image
       src={`/${state.data.url}`}
       alt="Preview hasil upload"
       width={300}
       height={300}
       className="mt-2 rounded border object-cover"
     />
   )}
   ```

   Jelasin: kita tambah `/` di depan `state.data.url` karena `next/image`
   butuh internal path yang mulai dari root (`/uploads/xxx.png`), beda
   sama `<img>` yang lebih toleran soal relative path.

2. **Fill + fallback inisial** (ini juga langsung ngerjain **Homelab 03**
   — Avatar component) — bikin file baru `app/components/Avatar.tsx`:

   ```tsx
   import Image from "next/image";

   function getInitials(name?: string | null) {
     if (!name) return "?";
     return name
       .trim()
       .split(/\s+/)
       .slice(0, 2)
       .map((part) => part[0]?.toUpperCase())
       .join("");
   }

   export function Avatar({
     src,
     name,
     size = 40,
     preload = false,
   }: {
     src?: string | null;
     name?: string | null;
     size?: number;
     preload?: boolean;
   }) {
     if (!src) {
       return (
         <div
           style={{ width: size, height: size }}
           className="rounded-full bg-slate-700 text-white flex items-center justify-center text-sm font-medium shrink-0"
         >
           {getInitials(name)}
         </div>
       );
     }

     return (
       <div
         style={{ width: size, height: size }}
         className="relative rounded-full overflow-hidden shrink-0"
       >
         <Image
           src={src}
           alt={name ? `Avatar ${name}` : "Avatar"}
           fill
           sizes={`${size}px`}
           style={{ objectFit: "cover" }}
           preload={preload}
         />
       </div>
     );
   }
   ```

   Jelasin ke kelas: `fill` bikin `<Image>` ngisi penuh parent `<div>`
   yang `position: relative` (dari `className="relative"`), `sizes`
   dikasih ukuran fix dalam px karena avatar kita emang selalu fixed size,
   dan `!src` handle fallback inisial nama — persis requirement Homelab
   03.

3. **Pola `preload` (above-the-fold)** — pasang `Avatar` di
   `app/components/UserBadge.tsx`, karena ini muncul di navbar, artinya
   keliatan di HAMPIR SEMUA halaman sejak page pertama kali dimuat:

   ```tsx
   import { Avatar } from "./Avatar";
   // ...
   <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white'}}>
     <Avatar src={session.user.image} name={session.user.name} size={32} preload />
     <span>
       Halo, <strong>{session.user.name || session.user.email}</strong>
     </span>
   </div>
   ```

   Bandingin: di `app/dashboard/settings/AvatarUploadForm.tsx`, avatar
   yang dipasang **tidak** dikasih `preload` (default `false`) — karena itu
   cuma muncul saat user buka halaman Settings doang, bukan elemen yang
   krusial buat first paint di seluruh aplikasi. Itu contoh nyata kapan
   `preload`/`priority` dipakai dan kapan nggak, sesuai kuis Q2.

4. **Gotcha yang wajib disebutin:** di `AvatarUploadForm.tsx`, preview
   avatar lokal (sebelum submit) itu pakai `URL.createObjectURL(file)`,
   hasilnya `blob:http://localhost:3000/xxx-xxx`. `next/image` **nggak
   bisa** optimasi `blob:` URL, karena optimizer-nya jalan di server dan
   nggak punya akses ke memory tab browser kalian. Makanya kita tetep
   pakai `<img>` biasa khusus buat preview lokal ini, dan baru pindah ke
   `<Avatar>` (yang pakai `next/image`) begitu URL-nya udah beneran hasil
   upload ke Cloudinary:

   ```tsx
   const isLocalPreview = displayUrl?.startsWith("blob:") ?? false;

   {isLocalPreview && displayUrl ? (
     // eslint-disable-next-line @next/next/no-img-element -- blob: URL, next/image gak bisa optimasi ini
     <img src={displayUrl} alt="Preview avatar baru" className="w-24 h-24 rounded-full object-cover" />
   ) : (
     <Avatar src={displayUrl} name={currentUserName} size={96} />
   )}
   ```

**Manual test checklist:**
- [ ] `/uploads` — upload gambar, preview tampil dengan ukuran 300x300 fix
- [ ] Navbar — avatar (atau inisial nama kalau belum ada foto) muncul di sebelah "Halo, ..."
- [ ] `/dashboard/settings` — pilih file avatar baru, preview lokal tampil (masih `<img>`, blob URL)
- [ ] Setelah submit sukses, avatar berubah jadi `<Avatar>` yang render lewat `next/image` (cek Network tab: request ke `/_next/image?url=...`)

---

## Slide 4 — Remote Images, sharp & Catatan Bun

**Durasi:** 10 menit

**Script:**
"Sekarang bagian penting yang sering bikin error pas pertama kali pakai
`next/image` sama gambar dari luar (remote): `remotePatterns`. Defaultnya,
Next.js BLOKIR semua remote image demi keamanan — bayangin kalau nggak
dibatasin, orang bisa nyuruh server kalian nge-optimize gambar dari domain
manapun, itu bisa disalahgunain buat DDoS lewat server kalian sendiri.

Makanya di `next.config.ts`, kita daftarin domain mana aja yang boleh.
Project kita udah punya satu entry buat Cloudinary. Sekarang kita tambah
dua lagi sesuai Homelab 01: `avatars.githubusercontent.com` sama
`lh3.googleusercontent.com` — yang terakhir ini penting banget soalnya
project kita pakai Google OAuth (`lib/auth.ts`), jadi foto profil dari
Google itu asalnya dari domain itu.

Soal `sharp` sama Bun — `sharp` itu library buat processing image di
Node.js, dipakai `next/image` di balik layar buat resize/convert format.
Nah kursus ini pakai Bun sebagai package manager DAN runtime. Sempet ada
kekhawatiran 'apa sharp bisa jalan di Bun runtime?' — jawabannya bisa,
karena `sharp` itu native binding yang di-load lewat Node-API, dan Bun
compatible sama Node-API. Kalian bisa liat sendiri di `package.json`,
`sharp` masuk daftar `trustedDependencies` — itu tandanya Bun ngejalanin
native build script-nya pas install, dan itu emang harus di-approve
manual di Bun demi keamanan (nggak semua native package auto-dipercaya)."

### 🖥️ Live Coding

1. Update `next.config.ts`:

   ```ts
   images: {
     remotePatterns: [
       {
         protocol: "https",
         hostname: "res.cloudinary.com"
       },
       {
         protocol: "https",
         hostname: "avatars.githubusercontent.com"
       },
       {
         protocol: "https",
         hostname: "lh3.googleusercontent.com"
       }
     ]
   }
   ```

2. Verifikasi `sharp` beneran ke-install dan trusted:

   ```bash
   ls node_modules/sharp        # harus ada isinya
   grep -A2 trustedDependencies package.json
   ```

**Manual test checklist:**
- [ ] Login pakai Google → avatar dari `lh3.googleusercontent.com` tampil normal di navbar (bukti `remotePatterns` udah bener)
- [ ] `bun run build` jalan tanpa error terkait `next/image` config

---

## Slide 5 — Kuis: Evaluasi Pemahaman

**Durasi:** 5 menit

**Script:**
"Tiga pertanyaan sebelum lanjut. Coba jawab dulu sendiri."

**Q1 — Apa yang terjadi jika menggunakan `next/image` dengan URL Cloudinary tanpa konfigurasi `remotePatterns`?**
- A) Gambar tampil tapi tidak dioptimasi
- **B) Error: Invalid src prop — semua remote URL di-blokir by default** ✅
- C) Gambar tampil normal, hanya lebih lambat

Pembahasan buat disampaikan: "Ini bukan soal 'lebih lambat' atau 'nggak
dioptimasi' — Next.js bener-bener nge-block requestnya dan lempar error
`Invalid src prop ... hostname ... is not configured`. Kita udah liat
sendiri barusan kenapa: demi keamanan, biar nggak disalahgunain buat
proxy image dari domain sembarangan."

**Q2 — Kapan sebaiknya menggunakan `priority={true}` di komponen Image?**
- A) Untuk semua gambar agar loading cepat
- **B) Hanya untuk gambar above-the-fold (hero, header) — visible saat pertama load** ✅
- C) Untuk gambar ukuran besar saja

Pembahasan buat disampaikan: "Konsepnya B bener — cuma buat gambar yang
keliatan duluan pas halaman baru dimuat. Tapi nama prop-nya udah beda ya
di project kita: `priority` deprecated sejak Next 16, sekarang namanya
`preload`. Kalian udah liat contohnya di Avatar navbar barusan — itu satu
elemen yang paling masuk akal dikasih `preload={true}`. Kalau SEMUA gambar
dikasih `priority`/`preload={true}` (opsi A), itu malah kontraproduktif —
browser jadi rebutan bandwidth buat load banyak gambar sekaligus di awal,
padahal harusnya cuma 1 elemen LCP yang diprioritasin."

**Q3 — Kursus ini menggunakan Bun sebagai apa? Apakah sharp bekerja?**
- A) Bun sebagai runtime — sharp mungkin conflict
- **B) Bun sebagai package manager + Node.js runtime → sharp bekerja normal** ✅
- C) Bun tidak kompatibel dengan sharp sama sekali

Pembahasan buat disampaikan: "B yang bener, dan ini bukan cuma teori —
kita udah cek langsung `node_modules/sharp` ada isinya dan `sharp` masuk
`trustedDependencies` di `package.json` project kita. Jadi bukan
'mungkin jalan', tapi emang jalan, dan kalian bisa buktiin sendiri."

---

## Slide 6 — Homelab: Tugas Mandiri

**Durasi:** 3 menit (penjelasan tugas, dikerjakan di luar kelas)

**Script:**
"Ada 4 tugas. Dua di antaranya udah kita kerjain bareng di kelas."

- **01 — `remotePatterns`** ✅ sudah dikerjakan bareng di
  [Slide 4](#slide-4--remote-images-sharp--catatan-bun) — `next.config.ts`
  udah punya 3 hostname: `res.cloudinary.com`,
  `avatars.githubusercontent.com`, `lh3.googleusercontent.com`. Tinggal
  kalian test sendiri: buka halaman manapun yang nampilin `<Image>` dan
  pastiin nggak ada error `Invalid src prop` di console.

- **02 — Post Cover Image** *(belum bisa full — ada dependency)*: slide
  ini minta kita ganti `<img>` di "PostCard" dengan `<Image>` + `sizes`
  prop. Tapi component `PostCard` **belum ada** di project ini, dan field
  `Post.coverImage` juga belum ada di `prisma/schema.prisma` — ini sama
  persis sama gap yang kita catet di Homelab 04 modul 13.3
  (`133-script.md`). Jadi urutan kerjanya:
  1. Selesaikan dulu Homelab 04 di `133-script.md` (tambah field
     `coverImage`, migrasi Prisma, bikin `uploadCoverImageAction`).
  2. Baru bikin component list/card buat nampilin post (belum ada
     sekarang — semua post masih di-render langsung sebagai `<li>` di
     `app/posts/page.tsx`), dan pasang:
     ```tsx
     <Image
       src={post.coverImage}
       alt={post.title}
       width={400}
       height={225}
       sizes="(max-width: 768px) 100vw, 400px"
       className="rounded object-cover"
     />
     ```
  3. `bun run build` → jalankan Lighthouse di Chrome DevTools → cek skor
     Performance, khususnya LCP dan skor "Properly size images".

- **03 — Avatar Fill** ✅ sudah dikerjakan bareng di
  [Slide 3](#slide-3--pola-penggunaan-nextimage) — `app/components/Avatar.tsx`
  persis nge-handle requirement ini: `<Image fill>` dalam `div relative`,
  plus fallback inisial nama kalau `src` kosong/`null`.

- **04 — blur placeholder** *(belum dikerjakan — PR baru)*: tambahin
  `placeholder="blur"` + `blurDataURL` ke cover image (yang baru bisa
  dikerjain setelah task 02 selesai). Cloudinary bisa generate thumbnail
  super kecil lewat URL transformation — tambah `/w_10,h_6/` ke URL
  Cloudinary yang ada, itu jadi gambar 10x6px blur-able:
  ```ts
  function toBlurUrl(cloudinaryUrl: string) {
    return cloudinaryUrl.replace("/upload/", "/upload/w_10,h_6/");
  }
  ```
  Lalu convert hasil fetch gambar kecil itu ke base64 data URL buat dipas
  jadi `blurDataURL` (bisa dibuat sebagai helper server-side di
  `lib/cloudinary.ts`, dipanggil pas `getPostBySlug`/`listPublishPosts`).

  > 💡 Tips dari slide, tetep berlaku: `bun run build && bun run start` →
  > buka Lighthouse → tab Performance. Target: LCP < 2.5s, CLS = 0.

---

## Slide 7 — Rangkuman

**Durasi:** 3 menit

**Script:**
"Rekap modul 13.4:

Pertama, `<Image>` dari `next/image` itu paket lengkap — lazy load,
auto-convert ke WebP/AVIF, dan nyegah layout shift, semua otomatis begitu
kalian kasih `width`/`height` atau `fill`.

Kedua, `sizes` prop itu yang bikin browser download ukuran gambar yang
PAS buat breakpoint dia, bukan asal gambar gede — ini yang hemat
bandwidth.

Ketiga — dan ini beda dari yang tertulis di slide — bukan `priority`, tapi
`preload={true}`, cuma buat gambar above-the-fold (kayak Avatar di
navbar). Jangan taruh di semua gambar, nanti malah rebutan bandwidth pas
awal load.

Keempat, `remotePatterns` di `next.config.ts` itu wajib buat gambar dari
luar — Cloudinary, Google, GitHub, apapun. Tanpa itu, `next/image` bakal
nolak sama sekali, bukan sekadar 'lebih lambat'.

Kelima, Bun sebagai package manager sekaligus runtime kita, dan `sharp`
tetep jalan normal buat optimasi gambar di kursus ini — sudah kebukti
sendiri dari `node_modules/sharp` dan `trustedDependencies`.

Abis ini kita lanjut ke Modul 14 — SEO, Metadata & Performance."

---

## Cara Menjalankan & Test

```bash
bun install   # kalau belum
bun dev        # dev server (kalau belum jalan)
```

Buka:
- `http://localhost:3000` (halaman manapun) — cek avatar/inisial di
  navbar kanan atas.
- `http://localhost:3000/uploads` — test upload gambar, preview fixed
  300x300.
- `http://localhost:3000/dashboard/settings` (login dulu) — test ganti
  avatar, perhatiin preview lokal (`<img>`, blob URL) vs avatar
  ter-upload (`<Avatar>`, lewat `next/image`).

Untuk cek dampak ke performa (bagian dari Homelab):

```bash
bun run build
bun run start
```

Lalu buka Chrome DevTools → tab Lighthouse → jalankan audit Performance di
salah satu halaman yang render banyak `<Image>`, cek skor LCP dan CLS.
