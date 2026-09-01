# Script Mengajar — Modul 14: SEO, Metadata & Performance — Core Web Vitals & React Compiler

## Slide 1 — Core Web Vitals & React Compiler (Auto-Memoization)

**Durasi:** 2 menit

**Script:**
Lanjut ke bagian kedua Modul 14, gaes. Kita bahas dua hal: **Core Web Vitals** — tiga metrik yang Google pakai buat nentuin ranking SEO project kalian — sama **React Compiler**, fitur baru di Next.js 16 yang otomatis eliminasi kebutuhan `useMemo`/`useCallback` manual.

Dua topik ini nyambung banget: salah satu metrik Core Web Vitals — **INP** — itu soal responsivitas interaksi, dan React Compiler adalah salah satu alat paling ampuh buat nge-boost INP tanpa kalian capek nulis memoization manual di mana-mana.

---

## Slide 2 — Core Web Vitals 2024+ — Tiga Metrik Utama

**Durasi:** 6 menit

**Script:**
Oke ini penting, catet baik-baik: sejak **Maret 2024**, Google resmi ganti salah satu dari tiga metrik Core Web Vitals. Yang lama itu FID (First Input Delay), sekarang diganti **INP** (Interaction to Next Paint). Jadi kalau kalian nemu artikel atau tutorial lama yang masih nyebut FID sebagai bagian dari Core Web Vitals, itu **udah outdated**.

Tiga metrik yang berlaku sekarang:

**1. LCP — Largest Contentful Paint.** Target "Good": **≤ 2.5 detik**. Ini ngukur seberapa cepat elemen terbesar di viewport (biasanya gambar hero atau blok teks besar) selesai render. Cara optimasi: pakai `next/image` dengan `priority={true}` khusus buat gambar hero/above-the-fold, pakai Server Component biar gak ada loading flash pas data di-fetch di client, dan serve konten statis lewat CDN.

**2. CLS — Cumulative Layout Shift.** Target "Good": **≤ 0.1**. Ini ngukur seberapa banyak elemen di halaman "geser" secara gak terduga pas loading — biasanya gara-gara gambar yang belum reserve ukuran, atau font yang FOUT. Cara optimasi: `next/image` dengan `width` + `height` (biar browser reserve space-nya dari awal), `next/font` (yang udah kita bahas di slide sebelumnya — zero FOUT), sama skeleton loader dengan ukuran yang sama persis dengan konten aslinya.

**3. INP — Interaction to Next Paint.** Target "Good": **≤ 200ms**. Ini yang gantiin FID — ngukur seberapa responsif halaman kalian pas user klik, ketik, atau tap. Cara optimasi: `startTransition` buat update yang non-urgent (biar gak block render), React Compiler buat auto-memoization, dan hindari expensive computation langsung di dalam event handler.

Nah, ini bukan cuma teori — ayo kita cek gimana kondisi real project kita.

---

## Slide 3 — React Compiler — Auto-Memoization

**Durasi:** 8 menit

**Script:**
Sekarang bagian paling seru: **React Compiler**. Ini compiler resmi dari tim React yang otomatis nambahin memoization ke component kalian — tanpa kalian nulis `useMemo`, `useCallback`, atau `React.memo` manual.

⚠️ **Catatan penting soal versi Next.js kita** — kalau kalian pernah liat contoh dari internet yang nulis konfigurasinya di dalam `experimental: { reactCompiler: true }`, itu **cara lama**. Di Next.js 16 yang kita pakai sekarang, `reactCompiler` udah jadi opsi **top-level**, bukan lagi di dalam `experimental`. Ini salah satu breaking change yang wajib kalian tau biar gak kejebak nyontek tutorial lama.

### 🖥️ Live Coding

**1. Install `babel-plugin-react-compiler`**

React Compiler jalan lewat Babel plugin — Next.js sendiri yang optimize prosesnya pakai SWC biar gak semua file di-compile, cuma yang relevan (yang ada JSX/React Hooks). Tapi plugin-nya tetep harus di-install manual:

```bash
bun add -D babel-plugin-react-compiler
```

**2. Aktifkan di `next.config.ts`**

Cek dulu `next.config.ts` project kita sebelum ubah:

```ts
const nextConfig: NextConfig = {
  cacheComponents: true,
  // ...
};
```

Tambahin `reactCompiler: true` **di level atas**, sejajar sama `cacheComponents`, bukan di dalam `experimental`:

```ts
const nextConfig: NextConfig = {
  cacheComponents: true,
  reactCompiler: true,
  // ...
};
```

**3. Cara kerjanya — before/after**

Sebelum ada React Compiler, kalian harus manual wrap value/fungsi yang mahal dihitung ulang:

```tsx
// Sebelum compiler — manual
function PostList({ posts, onLike }) {
  const sorted = useMemo(
    () => posts.sort(...), [posts]
  )
  const handleLike = useCallback(
    (id) => onLike(id), [onLike]
  )
  return <ul>{sorted.map(...)}</ul>
}
```

Setelah React Compiler aktif, kalian bisa tulis kode natural aja — compiler yang otomatis nambahin memoization di balik layar:

```tsx
// Setelah compiler — compiler otomatis tambah memo!
function PostList({ posts, onLike }) {
  const sorted = posts.sort(...)    // compiler memoize ini
  return <ul>{sorted.map(...)}</ul>
}
```

Compiler otomatis memoize tiga hal: **komponen** yang gak berubah (kayak `React.memo`), **nilai computed** yang gak berubah (kayak `useMemo`), dan **fungsi** yang gak berubah (kayak `useCallback`).

**4. Kapan masih butuh manual hooks?**

React Compiler **bukan silver bullet** — masih ada kondisi yang butuh manual `useMemo`/`useCallback`:
- Saat compiler gak bisa **prove** bahwa suatu value aman untuk di-memoize (misalnya karena logic-nya terlalu kompleks/dinamis).
- Kalian mau **explicit opt-out** — pakai directive `"use no memo"` di dalam komponen/hook buat bilang "jangan compiler, biar aku yang atur manual di sini".
- Cross-component state yang kompleks.
- Komponen yang ada di **critical path performance** — kadang kalian masih mau `React.memo()` eksplisit biar predictable.

Contoh opt-out:
```tsx
function ExpensiveWidget() {
  "use no memo"
  // compiler skip komponen ini, kalian atur manual
}
```

**5. Cek kondisi project kita saat ini**

Kita cek dulu apakah project kita punya `useMemo`/`useCallback` manual yang sekarang jadi redundant:

```bash
grep -rln "useMemo\|useCallback" --include="*.tsx" --include="*.ts" . --exclude-dir=node_modules --exclude-dir=.next
```

Hasilnya: **kosong** — project kita belum ada satupun pemakaian manual `useMemo`/`useCallback`. Artinya begitu React Compiler ini aktif, dia langsung kerja otomatis meng-cover semua komponen kita ke depannya tanpa perlu kalian bongkar kode lama.

**✅ Verifikasi manual:**
1. Jalankan `bunx tsc --noEmit` — pastikan gak ada error baru dari perubahan config (kalau ada error, itu pasti pre-existing, bukan dari React Compiler).
2. Jalankan `bunx next build --debug-prerender` — perhatiin baris `✓ Compiled successfully`. Kalau babel plugin-nya gak ke-install atau config salah taruh, build bakal gagal di tahap compile, bukan di tahap typecheck.
3. React DevTools (extension Chrome) → tab **Components** → pilih komponen apapun → kalau React Compiler aktif dan berhasil optimize komponen itu, ada badge kecil "Memo ✨" di React DevTools versi terbaru.

*(Perubahan ini sudah diterapkan langsung: `babel-plugin-react-compiler` sudah ter-install sebagai devDependency, dan `reactCompiler: true` sudah ditambahkan ke `next.config.ts` di branch aktif. Sudah divalidasi: `bunx next build --debug-prerender` compile sukses — error yang tersisa cuma pre-existing type error di `app/uploads/inspect-action.ts` yang gak ada hubungannya sama React Compiler.)*

---

## Slide 4 — Performance Checklist — Ship yang Cepat

**Durasi:** 6 menit

**Script:**
Sebelum deploy ke production, ada checklist praktis yang harus kalian audit **di setiap release**. Ada 4 kategori: Images, Fonts, JavaScript, Caching. Yuk kita audit langsung project kita bareng-bareng, biar kalian liat gimana cara ngecek satu-satu poinnya, bukan cuma dihafalin.

### 🖥️ Live Coding

**1. Kategori Images**

Checklist: semua gambar pakai `<Image>` dari `next/image`, ada `sizes` prop di responsive image, `priority={true}` **hanya** untuk hero/above-fold.

```bash
grep -rln "next/image" app --include="*.tsx"
grep -rn "<img\b" app --include="*.tsx"
```

Hasil audit real project kita: cuma **2 file** yang pakai `next/image` (`app/uploads/UploadForm.tsx` dan `app/components/Avatar.tsx`). Ada **1 file** yang pakai raw `<img>` — di `app/dashboard/settings/AvatarUploadForm.tsx`. Tapi ini **bukan pelanggaran checklist** — coba kita liat kenapa:

```tsx
const isLocalPreview = displayUrl?.startsWith("blob:") ?? false;
// ...
{isLocalPreview && displayUrl ? (
  <img src={displayUrl} alt="Avatar" className="w-24 h24 rounded-full object-cover-hover" />
) : (
  <Avatar src={displayUrl} size={96}/>
)}
```

Elemen `<img>` ini cuma dipakai buat nampilin **preview lokal** dari `URL.createObjectURL(file)` — sebuah `blob:` URL yang cuma ada di browser user, belum di-upload ke server. `next/image` didesain buat optimize gambar dari server/CDN, **bukan** blob URL sementara di client — jadi raw `<img>` di sini justru pilihan yang tepat. Begitu avatar beneran ke-upload, komponen `<Avatar>` (yang di dalamnya pakai `next/image`) yang ambil alih.

Poin `priority`: **belum ada satupun** file yang pakai `priority={true}` di project kita — karena kita memang belum punya halaman dengan hero image besar di atas fold. Ini jadi catatan buat kalian: kalau nanti bikin landing page dengan hero image, jangan lupa poin ini.

**2. Kategori Fonts**

Checklist ini udah kita bahas tuntas di slide sebelumnya (Font Optimization) — semua font pakai `next/font` (Figtree + Fira Code, keduanya self-hosted), subset minimal (`latin` doang), dan maksimal 2 font family. ✅ Sudah sesuai checklist.

**3. Kategori JavaScript**

Checklist: `'use client'` hanya kalau benar-benar perlu, React Compiler aktif, dynamic import untuk komponen besar.

```bash
grep -rl "\"use client\"" --include="*.tsx" app | wc -l
```

Hasil: **29 file** pakai `'use client'`. React Compiler barusan udah kita aktifkan di slide 3. Untuk poin "hanya kalau perlu" — ini butuh audit manual per file (bukan sekadar hitung), tapi angka 29 di project sebesar ini masih wajar untuk sekarang; yang penting jangan asal taruh `'use client'` di root layout atau komponen besar yang sebenarnya bisa Server Component.

**4. Kategori Caching**

Checklist: `'use cache'` untuk data yang bisa stale, `revalidateTag` setelah setiap mutasi, static pages di-prerender saat build.

```bash
grep -rl "\"use cache\"" --include="*.ts" --include="*.tsx" . --exclude-dir=node_modules --exclude-dir=.next
```

Hasil: **6 file** udah pakai `'use cache'` — termasuk `app/sitemap.ts`, `app/blog/[slug]/page.tsx`, `lib/data/blog.ts`, `lib/data/member.ts`, `lib/data/post.ts`. ✅

Cek juga `revalidateTag` di `app/posts/action.ts`:

```ts
revalidateTag("posts", "max");
revalidateTag(`post-${id}`, "max");
```

Perhatiin — ini pakai **signature dua argumen**: `revalidateTag(tag, "max")`. Ini juga breaking change dari Next.js versi lama yang training data kalian mungkin masih inget — dulu `revalidateTag(tag)` cuma butuh satu argumen dan langsung invalidate paksa (blocking). Sekarang dengan `profile="max"`, cache tag ditandai stale dan di-refresh pakai **stale-while-revalidate** semantics — lebih smooth, gak bikin request berikutnya nunggu full re-fetch. Kode kita di project **udah benar** pakai signature baru ini. ✅

**✅ Verifikasi manual (rangkuman audit):**
1. `grep -rn "<img\b" app --include="*.tsx"` → pastikan tiap hasil punya alasan valid kayak yang kita bahas (blob preview), bukan kelalaian.
2. `grep -rl "\"use client\"" --include="*.tsx" app | wc -l` → pantau angkanya tiap release, jangan naik tanpa alasan jelas.
3. Buka `next.config.ts`, pastikan `reactCompiler: true` ada di top-level (bukan di dalam `experimental`).
4. `grep -rn "revalidateTag(" app lib` → pastikan semua pakai 2 argumen (`tag`, `profile`), bukan cuma 1.

---

## Slide 5 — Kuis: Evaluasi Pemahaman

**Durasi:** 4 menit

**Script:**
Yuk kita cek pemahaman kalian soal Core Web Vitals dan React Compiler.

**Q1 — INP (Interaction to Next Paint) menggantikan metrik Core Web Vitals apa?**
- A) CLS (Cumulative Layout Shift)
- **B) FID (First Input Delay) — sejak Maret 2024** ✅
- C) LCP (Largest Contentful Paint)

Pembahasan buat disampaikan: jawabannya B. Ini fakta penting yang kita bahas di slide 2 — Google resmi ganti FID jadi INP sejak Maret 2024 karena INP ngukur responsivitas secara lebih akurat sepanjang lifecycle halaman, gak cuma interaksi pertama kayak FID.

**Q2 — Apa yang dilakukan React Compiler di Next.js 16?**
- A) Compile TypeScript lebih cepat
- **B) Otomatis menambahkan memoization (useMemo/useCallback/memo) tanpa harus manual** ✅
- C) Compile JSX ke WebAssembly

Pembahasan buat disampaikan: jawabannya B. Ini persis yang kita praktikin di slide 3 — React Compiler otomatis nge-detect value/fungsi/komponen yang perlu di-memoize, tanpa kalian nulis `useMemo`/`useCallback`/`React.memo` manual satu-satu.

**Q3 — Mengapa 'use client' harus digunakan sesedikit mungkin untuk performance?**
- A) 'use client' menyebabkan error
- **B) Client Components bundle JavaScript ke browser — lebih banyak Client Component = bundle lebih besar** ✅
- C) Server Components tidak support hooks

Pembahasan buat disampaikan: jawabannya B. Setiap komponen yang ditandai `'use client'` bakal ikut ke-bundle dan dikirim ke browser sebagai JavaScript yang harus di-download, di-parse, dan di-execute. Makin banyak Client Component yang gak perlu, makin gede bundle-nya, makin lambat INP dan LCP-nya. Inget contoh tadi — project kita punya 29 file `'use client'`, jadi ini poin yang perlu terus dipantau tiap kalian nambah komponen baru.

---

## Slide 6 — Homelab: Tugas Mandiri

**Durasi:** 3 menit (penjelasan tugas, dikerjakan mandiri setelah sesi)

**Script:**
Oke gaes, 4 tugas performance audit buat kalian:

**Tugas 01 — React Compiler.** Ini udah kita kerjakan bareng-bareng di live coding slide 3: `reactCompiler: true` udah aktif di `next.config.ts` (top-level, bukan di dalam `experimental`), `babel-plugin-react-compiler` udah ter-install. Karena project kita belum ada `useMemo`/`useCallback` manual, gak ada yang perlu dihapus — tapi kalau kalian nemu project lain yang masih pakai manual memoization, sekarang giliran kalian yang hapus satu-satu dan cek gak ada regression (test dulu manual sebelum dan sesudah dihapus).

**Tugas 02 — Lighthouse Audit.** Ini kalian kerjakan sendiri: jalankan `bun run build && bun run start`, buka Chrome DevTools → tab **Lighthouse** → jalankan audit. Target: **Performance ≥ 90**, **SEO ≥ 95**. Catat skor sebelum dan sesudah optimasi (kalau kalian bikin perubahan lain di luar sesi ini).

**Tugas 03 — Bundle Analysis.** Ini juga udah kita siapkan di live coding — `@next/bundle-analyzer` udah ter-install sebagai devDependency, dan `next.config.ts` udah di-wrap:

```ts
import withBundleAnalyzer from "@next/bundle-analyzer";

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true"
});
// ...
export default bundleAnalyzer(nextConfig);
```

Tinggal kalian jalankan:

```bash
ANALYZE=true bun run build
```

Ini bakal buka file HTML interaktif (untuk client bundle & server bundle) yang nunjukin ukuran tiap module. Cari yang paling gede — biasanya dependency besar kayak library chart, rich text editor, dll — terus pertimbangkan `dynamic import` biar gak ke-load di initial bundle.

**Tugas 04 — CWV Test.** Setelah deploy ke Vercel, buka **PageSpeed Insights** (pagespeed.web.dev), masukin URL production kalian. Target: **LCP ≤ 2.5s**, **CLS ≤ 0.1**, **INP ≤ 200ms** — persis angka "Good" yang kita bahas di slide 2, tapi sekarang diukur dari data real user (field data), bukan cuma lab data lokal.

💡 **Tools:** Lighthouse (built-in Chrome DevTools), PageSpeed Insights, web.dev/measure. Selalu jalankan **sebelum dan sesudah** optimasi biar kalian punya bukti perbandingan konkret.

**✅ Verifikasi manual (tugas 01 & 03 yang sudah diterapkan):**
1. `cat next.config.ts` → pastikan ada `reactCompiler: true` di top-level dan `export default bundleAnalyzer(nextConfig);` di baris terakhir.
2. `bunx next build --debug-prerender` → harus lolos di tahap `✓ Compiled successfully` (typecheck-nya sendiri gagal karena pre-existing error yang gak berhubungan, itu wajar).
3. `ANALYZE=true bun run build` → tunggu build selesai, browser bakal otomatis buka 1-2 tab HTML report bundle analyzer.

---

## Slide 7 — Rangkuman

**Durasi:** 2 menit

**Script:**
Oke gaes, rangkuman Modul 14 bagian kedua:

Pertama, **Core Web Vitals** yang berlaku sekarang: **LCP** (≤ 2.5 detik), **CLS** (≤ 0.1), **INP** (≤ 200ms) — dan inget, **INP menggantikan FID** sejak Maret 2024.

Kedua, cara optimasi tiap metrik: **LCP** → `next/image` dengan `priority`. **CLS** → `next/image` dengan size + `next/font`. **INP** → `startTransition` + React Compiler.

Ketiga, **React Compiler**: aktifkan lewat `reactCompiler: true` di **top-level** `next.config.ts` Next.js 16 kita (bukan di dalam `experimental` kayak versi lama), plus install `babel-plugin-react-compiler`. Auto-memoize komponen, computed value, dan fungsi — tanpa manual hooks.

Keempat, **performance checklist**: Images, Fonts, JavaScript, Caching — audit ini di **setiap release**, jangan cuma sekali di awal project.

Kelima, tools yang kalian pakai buat ngukur: **Lighthouse**, **PageSpeed Insights**, **bundle-analyzer**. Target Performance Lighthouse **≥ 90**.

Selanjutnya kita masuk ke **Modul 15 — Deployment & Production**. Sampai ketemu di sesi berikutnya, gaes!
