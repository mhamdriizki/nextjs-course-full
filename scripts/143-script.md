# Script Mengajar — Modul 14: SEO, Metadata & Performance — Font Optimization dengan next/font

## Slide 1 — Font Optimization dengan next/font

**Durasi:** 2 menit

**Script:**
Oke gaes, kita masuk ke Modul 14 — SEO, Metadata & Performance. Fokus kita hari ini satu topik spesifik dulu: **Font Optimization pakai `next/font`**.

Kenapa font itu penting banget buat performance? Karena font itu salah satu sumber utama **layout shift** dan **request tambahan ke server luar**. `next/font` ini fiturnya Next.js buat bikin font kalian **zero layout shift**, **self-hosted otomatis**, dan **privacy-first** — jadi kalau kalian pakai Google Fonts, browser user gak perlu request apa-apa ke Google lagi. Semua di-host sendiri dari domain kalian.

Yuk langsung kita bedah masalahnya dulu di slide berikutnya, baru kita praktik.

---

## Slide 2 — Masalah Font Traditional vs next/font

**Durasi:** 4 menit

**Script:**
Jadi dulu, cara pasang Google Fonts itu biasanya tempel `<link>` ke `fonts.googleapis.com` di head HTML. Nah cara ini punya tiga masalah besar:

Pertama, **FOUT/FOIT** — Flash of Unstyled Text atau Flash of Invisible Text. Jadi pas font belum kelar di-download, teks kalian bakal keliatan pakai font fallback dulu (atau malah invisible), terus tiba-tiba "loncat" pas font asli udah load. Ini bikin **layout shift**, dan itu jelek banget buat metric **CLS** — Cumulative Layout Shift — salah satu Core Web Vitals.

Kedua, **privacy**. Setiap kali user buka web kalian, browser mereka ngirim request ke `fonts.googleapis.com`. Artinya Google tau IP address user kalian, kapan mereka akses web kalian. Di banyak negara Eropa ini masalah GDPR beneran, gaes.

Ketiga, **performance**. Request ke domain eksternal itu butuh **DNS lookup** tambahan, plus request HTTP terpisah. Makin banyak domain yang di-hit, makin lambat.

Nah, `next/font` nyelesain semua ini. Font-nya di-**download saat build time**, terus di-**self-host** dari server Next.js kalian sendiri — jadi gak ada request ke Google sama sekali. Karena udah dihitung dari awal (di-load sebelum render), gak ada FOUT/FOIT, jadi **zero layout shift**. Dan karena satu domain, Next.js otomatis kasih **preload hint** biar makin optimal.

---

## Slide 3 — Implementasi Google Fonts dengan next/font

**Durasi:** 6 menit

**Script:**
Sekarang kita liat implementasinya. Caranya gampang banget — kalian import font yang mau dipakai dari `next/font/google`, panggil sebagai function, terus pasang `className` atau `variable`-nya ke elemen yang mau kalian kasih font itu.

Nah ini menarik gaes — project kita **udah pakai** `next/font` dari awal. Coba kita cek `app/layout.tsx`.

### 🖥️ Live Coding

**1. Cek implementasi Google Font yang sudah ada**

Buka `app/layout.tsx`, sebelum kita ubah apa-apa:

```tsx
import { Figtree } from "next/font/google";
// ...
const figtree = Figtree({subsets:['latin'],variable:'--font-sans'});
// ...
<html lang="id" className={cn("font-sans", figtree.variable)} suppressHydrationWarning>
```

Perhatiin: kita pakai **`variable`**, bukan `className`. Bedanya — `className` langsung nempelin class CSS yang isinya `font-family`. Sedangkan `variable` bikin **CSS custom property** (`--font-sans`), yang nanti bisa kita pakai fleksibel di Tailwind lewat `@theme`. Ini pattern yang lebih maintainable buat project yang pakai Tailwind v4 kayak kita.

**2. Tambahkan font kedua — Fira Code buat kebutuhan monospace**

Sekarang kita praktik nambah font baru. Kita mau nambahin `Fira_Code` sebagai font monospace (buat nampilin code block atau angka-angka teknis). Edit `app/layout.tsx`:

```tsx
import { Figtree, Fira_Code } from "next/font/google";
```

```tsx
const figtree = Figtree({subsets:['latin'],variable:'--font-sans'});
const firaCode = Fira_Code({subsets:['latin'], weight:['400','500'], variable:'--font-mono'});
```

```tsx
<html lang="id" className={cn("font-sans", figtree.variable, firaCode.variable)} suppressHydrationWarning>
```

Perhatiin, `Fira_Code` di next/font/google itu **bukan variable font penuh** buat semua weight — jadi kita eksplisit pilih `weight: ['400', '500']` aja, gak usah load semua weight yang gak dipakai.

**3. Daftarkan CSS variable-nya di `app/globals.css`**

Supaya Tailwind kenal `--font-mono` sebagai utility (misal `font-mono`), kita daftarkan di `@theme inline`:

```css
@theme inline {
  --font-heading: var(--font-sans);
  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
  /* ... */
}
```

Pattern-nya sama kayak `--font-sans` yang udah ada: variable dari `next/font` (`--font-sans` / `--font-mono`) itu di-set di elemen `<html>` lewat `className`, terus Tailwind `@theme inline` nge-reference variable itu biar bisa dipanggil pakai utility class `font-sans` / `font-mono` di komponen manapun.

**✅ Verifikasi manual:**
1. Jalankan `bun dev`, buka `http://localhost:3000`.
2. DevTools → Elements → cek elemen `<html>`, harus ada dua class variable: satu buat Figtree (`figtree_...variable`), satu buat Fira Code (`fira_code_...variable`).
3. DevTools → Network → filter **Fonts** → refresh. Font di-serve dari `_next/static/media/*.woff2`, **bukan** dari `fonts.googleapis.com`.
4. Coba pasang `className="font-mono"` di elemen manapun (misal `<code>`) → font harus berubah jadi Fira Code.

*(Perubahan ini sudah diterapkan langsung ke `app/layout.tsx` dan `app/globals.css` di branch aktif sebagai bagian dari live-coding sesi ini — sudah divalidasi lewat `bunx next build --debug-prerender` yang compile sukses, dan lewat dev server yang serve dua file `.woff2` self-hosted tanpa request ke Google.)*

---

## Slide 4 — Local Font & Font Best Practices

**Durasi:** 6 menit

**Script:**
Nah kalau font-nya bukan dari Google — misalnya font brand kustom yang kalian punya file-nya sendiri — kalian pakai `next/font/local`, bukan `next/font/google`.

### 🖥️ Live Coding

**Pola local font (untuk referensi, tidak diterapkan di project ini karena kita belum punya file font custom):**

```tsx
import localFont from "next/font/local"

// Font dari file lokal di project — path relatif ke file layout.tsx
const brandFont = localFont({
  src: [
    {
      path: "../fonts/Brand-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/Brand-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-brand",
  display: "swap",
})
```

Format terbaik buat local font itu **WOFF2** — compression-nya ~30% lebih kecil dari WOFF, dan didukung semua browser modern. Kalau kalian cuma punya file OTF/TTF, konversi dulu ke WOFF2 pakai tool kayak transfonter.org atau fontsquirrel.com.

Sekarang, lima **best practice** yang sering diabaikan orang — ini penting banget buat kalian ingat:

**1. Pilih `subsets` yang tepat.** Kayak yang kita pakai di Figtree: `subsets: ['latin']`. Jangan load `subsets` yang gak kepake — misalnya kalau web kalian gak butuh karakter Cyrillic, jangan include subset itu. Tiap subset tambahan = ukuran file font makin gede.

**2. Pilih `weight` yang beneran dipakai.** Contoh kalau kalian cuma butuh regular, medium, sama bold: `weight: ['400', '600', '700']`. Jangan `weight: 'variable'` kalau kalian sebenarnya cuma butuh 2-3 weight — tiap weight itu file terpisah yang harus di-download.

**3. Satu font, satu import — maksimal.** Jangan import 3 Google Fonts berbeda buat satu halaman. Tiap font = request/file terpisah = ukuran bundle lebih besar. Coba liat project kita — kita cuma pakai 2 font (Figtree buat sans, Fira Code buat mono), itu udah pas.

**4. Manfaatkan variable fonts kalau bisa.** Variable font itu satu file yang menampung semua weight/style sekaligus (lewat `axes`, misalnya `Inter({ axes: ["ital", "wdth"] })`), jadi lebih efisien dibanding load banyak file weight terpisah.

**5. Perhatikan `display: swap` vs `optional`.** `swap` artinya teks langsung tampil pakai font fallback, terus di-ganti begitu font custom selesai di-load — ini default yang aman. `optional` artinya kalau font gak selesai load dalam ~100ms, browser bakal skip aja pakai fallback — cocok kalau kalian ngejar **FCP** (First Contentful Paint) tercepat dan gak masalah kalau kadang font custom-nya gak kepake.

---

## Slide 5 — Kuis: Evaluasi Pemahaman

**Durasi:** 4 menit

**Script:**
Sebelum lanjut, kita cek dulu pemahaman kalian. Coba jawab tiga soal ini sebelum saya kasih pembahasannya.

**Q1 — Apa masalah utama font traditional (CDN link) yang diselesaikan next/font?**
- A) Font tidak support emoji
- **B) Layout shift (FOUT/FOIT) + privacy (request ke Google) + extra network request** ✅
- C) Tidak bisa pakai Google Fonts

Pembahasan buat disampaikan: jawabannya B. Inget lagi dari slide 2 — tiga masalah utama font CDN itu layout shift dari FOUT/FOIT, privacy karena request ke Google, dan extra network request (DNS lookup + HTTP request tambahan). `next/font` nyelesain semuanya sekaligus karena self-hosted otomatis.

**Q2 — Apa fungsi prop 'variable' di konfigurasi next/font?**
- A) Mengaktifkan variable font axis
- **B) Mendefinisikan CSS custom property untuk referensi font di Tailwind/CSS** ✅
- C) Set font sebagai variable width

Pembahasan buat disampaikan: jawabannya B. Ini yang barusan kita praktikin — `variable: '--font-sans'` bikin CSS custom property yang kita pasang ke `<html>`, terus di-reference lagi di `@theme inline` supaya Tailwind punya utility `font-sans`. Jangan ketuker sama variable *font* (axis) di poin best practice nomor 4 — itu konsep beda, soal font yang punya banyak weight dalam satu file.

**Q3 — Mengapa penting memilih 'subsets' yang tepat di next/font?**
- A) Hanya subset latin yang support next/font
- **B) Setiap subset = karakter tambahan = file lebih besar. Download hanya yang dipakai.** ✅
- C) Untuk PWA support

Pembahasan buat disampaikan: jawabannya B. Subset itu bukan soal support atau enggak, tapi soal ukuran file. Semakin banyak subset yang di-include (latin, latin-ext, cyrillic, dst), semakin besar font file yang harus di-download user — padahal mungkin karakter itu gak pernah kepake di web kalian.

---

## Slide 6 — Homelab: Tugas Mandiri

**Durasi:** 3 menit (penjelasan tugas, dikerjakan mandiri setelah sesi)

**Script:**
Oke gaes, sekarang giliran kalian praktik sendiri. Ada 4 tugas:

**Tugas 01 — Inter + Fira Code.** Ini persis pola yang barusan kita praktikin bareng-bareng di slide 3 — bedanya di slide referensi pakai `Inter`, tapi project kita udah punya `Figtree` sebagai font-sans utama, jadi kalian **gak perlu ganti** font-sans yang sudah ada. Yang perlu kalian pastikan: `Fira_Code` sudah di-import, punya `variable: '--font-mono'`, dan sudah diterapkan ke elemen `<html>` di `app/layout.tsx` — itu semua **sudah selesai kita kerjakan** barusan di live coding slide 3. Kalian tinggal review ulang kodenya dan pastikan paham tiap barisnya.

**Tugas 02 — Tailwind Integration.** Juga sudah kita kerjakan di live coding slide 3: `--font-mono: var(--font-mono)` sudah didaftarkan di `@theme inline` pada `app/globals.css`. Cara ngetesnya: bikin komponen kecil, kasih class `font-mono`, terus cek di DevTools → Elements → Computed → `font-family` harus nunjuk ke `Fira Code` (atau fallback monospace-nya), bukan `Figtree`.

**Tugas 03 — Font Audit.** Ini kalian kerjakan sendiri: buka DevTools → Network → filter **Fonts**. Refresh halaman project kalian. Bandingin: sebelum next/font dipakai (kalau kalian pernah nyoba pasang `<link>` manual ke Google Fonts), harusnya ada request ke `fonts.googleapis.com`. Setelah pakai next/font — kayak yang kita punya sekarang — **gak ada** request ke domain Google sama sekali, semua font di-serve dari `_next/static/media/`.

**Tugas 04 — Lighthouse Score.** Jalankan Lighthouse (Chrome DevTools → Lighthouse tab, atau `bunx lighthouse http://localhost:3000` kalau mau dari CLI) sebelum dan sesudah optimasi font. Bandingin khususnya metric **CLS** dan jumlah network request. Dokumentasikan hasilnya — screenshot atau catat angkanya buat portofolio kalian.

💡 **Tips tambahan:** DevTools → Network → tab Fonts itu cara paling cepat buat verifikasi font kalian di-serve dari domain sendiri, bukan `fonts.googleapis.com`.

---

## Slide 7 — Rangkuman

**Durasi:** 2 menit

**Script:**
Oke gaes, kita rangkum apa yang udah kita pelajari hari ini:

Pertama, `next/font` itu ngasih kalian **zero layout shift**, **self-hosted otomatis**, **no request ke Google**, dan **privacy-first** — semua masalah font traditional keselesain sekaligus.

Kedua, pattern **CSS variable**: kalian bikin font dengan `variable: '--font-nama'`, terapkan ke elemen `<html>`, terus pakai lagi di `@theme` Tailwind. Ini persis yang kita praktikin barusan — Figtree buat `--font-sans`, Fira Code buat `--font-mono`.

Ketiga, `subsets` itu nentuin karakter apa aja yang di-download — pilih yang beneran dipakai. `weight` juga sama — jangan load weight yang gak kepake.

Keempat, buat font custom yang kalian punya file-nya sendiri, pakai `localFont` dari `next/font/local`. Format terbaiknya **WOFF2**.

Kelima, batasan praktis: **maksimal 2 font per situs**. Kalau bisa, pakai **variable font** — satu file yang nampung semua weight, jauh lebih efisien daripada load banyak file weight terpisah.

Nah, selanjutnya kita bakal masuk ke Bab 4 — **Core Web Vitals & React Compiler**. Sampai ketemu di sesi berikutnya, gaes!
