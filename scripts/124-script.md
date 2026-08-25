# Script Mengajar — Modul 12.4: Protected Routes & proxy.ts (Next.js 16)

> Sumber: `scripts/124.pdf` (6 slide, Canva)
> Gaya: santai, akrab, ngobrol — tapi tetap presisi soal kode.
> Target: kelas yang lagi belajar Better Auth + Next.js 16 di project ini (repo `nextjs-course-full`).

Catatan penting sebelum mulai: project ini pakai **Next.js 16**, jadi `middleware.ts` itu udah *deprecated*, diganti `proxy.ts`. Functionality-nya sama persis, cuma nama file & convention-nya beda. Jangan buka dokumentasi lama yang masih nyebut `middleware.ts` sebagai satu-satunya cara — cek dulu docs versi Next.js yang lagi kepasang di `node_modules/next/dist/docs`.

Saat ini di repo udah ada `middleware.ts` (lama, cuma buat logging API request) dan udah ada `better-auth` (`lib/auth.ts`, `lib/auth-client.ts`). Belum ada `proxy.ts`, belum ada `@better-fetch/fetch`. Jadi live coding di script ini akan bikin dari nol, di atas kondisi repo yang sekarang.

---

## Slide 1 — Cover: Protected Routes & proxy.ts (Next.js 16)

**Durasi:** ~1 menit

**Script:**

"Oke gaes, masuk ke Modul 12.4 ya — kita bahas **Protected Routes** pakai `proxy.ts` di Next.js 16. Jadi ceritanya gini: kalian udah punya sistem login pakai Better Auth. Tapi... login doang gak cukup. Halaman kayak `/dashboard`, `/admin`, `/settings` itu harus di-**lock** — orang yang belum login gak boleh nyelonong masuk cuma dengan ngetik URL-nya langsung.

Nah `proxy.ts` ini yang jadi 'satpam' pertama di gerbang. Tapi inget baik-baik, ini poin paling penting di seluruh materi hari ini —

> proxy.ts **BUKAN** satu-satunya layer security!

Kenapa? Nanti kita bedah bareng-bareng. Yuk lanjut."

---

## Slide 2 — proxy.ts — Gating Awal di Network Level

**Durasi:** ~8-10 menit (termasuk live coding)

**Script:**

"Jadi `proxy.ts` ini menggantikan `middleware.ts` yang dulu kalian kenal. Tiga hal yang wajib kalian inget:

1. **Menggantikan `middleware.ts`** — namanya doang yang ganti, konsepnya sama: kode yang jalan *sebelum* request nyampe ke halaman.
2. **Berjalan di Node.js runtime** — ini beda sama `middleware.ts` lama yang jalan di Edge Runtime yang serba terbatas (gak semua Node API bisa dipakai). Di `proxy.ts`, kalian punya akses Node.js API secara penuh.
3. **Redirect user yang belum login** — ini fungsi utamanya buat kasus kita: kalau gak ada session, tendang balik ke `/login`.

Sekarang, gimana caranya `proxy.ts` tau ada session apa nggak? Dia gak bisa akses database langsung enaknya di edge kayak gitu, jadi caranya adalah **nembak endpoint session** punya Better Auth pakai `betterFetch`, terus baca cookie dari request itu.

Yuk kita coding bareng."

### 🖥️ Live Coding — Bagian 1: Setup proxy.ts

**Step 1 — Install dependency yang dibutuhkan**

```bash
bun add @better-fetch/fetch
```

Jelasin ke kelas: "Ini library kecil buat fetch API dengan tipe yang aman, dipakai Better Auth buat baca session dari luar konteks React/Server Component — misalnya dari `proxy.ts`."

**Step 2 — Buat file `proxy.ts` di root project** (sejajar sama folder `app/`)

```ts
// proxy.ts
import { NextRequest, NextResponse } from "next/server";
import { betterFetch } from "@better-fetch/fetch";
import type { Session } from "@/lib/auth";

const protectedRoutes = ["/dashboard", "/admin", "/settings"];
const authRoutes = ["/login", "/register"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const { data: session } = await betterFetch<Session>(
    "/api/auth/get-session",
    {
      baseURL: request.nextUrl.origin,
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    }
  );

  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Belum login tapi mau akses halaman protected -> tendang ke /login
  if (isProtected && !session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Udah login tapi masih coba buka /login atau /register -> lempar ke /dashboard
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/settings/:path*", "/login", "/register"],
};
```

Poin yang WAJIB ditekenin pas ngetik ini live:

- "`baseURL: request.nextUrl.origin` — ini penting banget, soalnya `proxy.ts` gak jalan di browser, jadi dia gak tau otomatis base URL app kalian. Harus dikasih tau manual."
- "`headers: { cookie: ... }` — session Better Auth itu disimpen di cookie. Kalau kalian lupa forward cookie ini, `betterFetch` bakal selalu balikin `session: null`, walaupun user-nya sebenernya udah login. Ini bug paling sering kejadian di kelas-kelas sebelumnya, jadi hati-hati."
- "`matcher` itu nge-filter, proxy cuma jalan di path yang kita daftarin — biar gak overhead di setiap request (misal request ke gambar, favicon, dll gak perlu lewat proxy ini)."

**Step 3 — Migrasi `middleware.ts` lama, JANGAN dibiarkan hidup bareng `proxy.ts`**

"Nah project kita sekarang punya `middleware.ts` lama yang isinya logging API request. Awalnya kupikir ini gak bentrok karena beda `matcher` (`/api/:path`) — ternyata **salah**. Coba jalanin `bun dev` sekarang juga, bakal muncul error:

```
Unhandled Rejection: Error: Both middleware file "./middleware.ts" and proxy file "./proxy.ts" are detected. Please use "./proxy.ts" only.
```

Next.js 16 itu tegas: **cuma boleh ada satu**, `middleware.ts` ATAU `proxy.ts`, gak peduli beda `matcher` sekalipun. Jadi kita harus **pindahin logic logging dari `middleware.ts` ke dalam `proxy.ts`**, terus hapus `middleware.ts`-nya. Tambahin di paling atas function `proxy()`:

```ts
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Migrasi dari middleware.ts lama: Next.js 16 gak boleh punya
  // middleware.ts dan proxy.ts sekaligus, jadi logging API digabung di sini.
  if (pathname.startsWith("/api")) {
    console.log(`[API Request] ${request.method} ${pathname}`);
    return NextResponse.next();
  }

  // ...lanjut ke logic session check di bawah
```

Terus tambahin `/api/:path*` ke `matcher`, dan hapus file `middleware.ts` (`rm middleware.ts`).

Ini pelajaran penting buat disampaikan ke kelas: **kalau project kalian masih punya `middleware.ts`, migrasi ke `proxy.ts` itu bukan opsional — begitu ada `proxy.ts`, `middleware.ts` harus hilang, seluruh logic-nya digabung jadi satu file.**"

**Step 4 — Test manual**

```bash
bun dev
```

Terus buka browser:
1. Buka `http://localhost:3000/dashboard` dalam kondisi **belum login** → harus ke-redirect ke `/login?callbackUrl=/dashboard`.
2. Login → harus balik otomatis ke `/dashboard` (nanti kita bahas `callbackUrl` di slide Home Lab).
3. Coba buka `/login` lagi padahal udah login → harus ke-redirect balik ke `/dashboard`.

"Kalau ketiga skenario itu jalan, `proxy.ts` kalian udah bener secara network-level gating."

---

## Slide 3 — Protected Route di Server Component (Defense in Depth)

**Durasi:** ~8 menit (termasuk live coding)

**Script:**

"Nah ini bagian yang paling sering di-skip orang, padahal ini yang **paling krusial**. Judulnya *defense in depth* — artinya security itu gak boleh cuma satu lapis, harus berlapis-lapis kayak bawang.

Kenapa `proxy.ts` aja gak cukup? Karena `proxy.ts` itu sifatnya cuma **optimistic check** — dia ngecek cepat di network level, tapi dia bisa di-bypass. Beberapa alasan kenapa proxy bisa ke-skip: misalnya ada CVE (kerentanan) yang khusus nyerang layer middleware/proxy, atau ada cara request yang gak lewat matcher-nya. Makanya, halaman yang bener-bener sensitif **WAJIB** cek ulang session-nya sendiri di Server Component.

Nah cara cek session di Server Component itu beda sama di `proxy.ts`. Di Server Component, kita bisa langsung panggil `auth.api.getSession()` dari instance Better Auth kita, tapi dengan satu syarat wajib:"

### 🖥️ Live Coding — Bagian 2: Double-check session di Server Component

**Step 1 — Buka `app/dashboard/page.tsx`**

Kondisi sekarang (tunjukin ke kelas):

```tsx
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div>
      <h2>Dashboard Overview</h2>
      {/* Ini halaman dashboard */}
      <h3>Ini konten konten dashboard</h3>
    </div>
  );
}
```

"Liat, ini halaman-nya polos banget — gak ada pengecekan session sama sekali. Kalau seandainya `proxy.ts` kita entah kenapa gak jalan (di-bypass), halaman ini bakal ke-render bebas ke siapa aja. Ini yang mau kita perbaiki."

**Step 2 — Tambahin session check**

```tsx
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Suspense } from "react";
import { auth } from "@/lib/auth";

// Session check pakai headers() -> data runtime, harus di dalam <Suspense>
// biar gak nge-block seluruh route dari di-prerender (Cache Components).
async function DashboardGuard() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <div>
      <h2>Dashboard Overview</h2>
      {/* Ini halaman dashboard */}
      <h3>Ini konten konten dashboard</h3>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<p>Memuat dashboard...</p>}>
      <DashboardGuard />
    </Suspense>
  );
}
```

Tekenin poin ini pelan-pelan pas live coding, soalnya ini yang paling sering salah:

- "`headers: await headers()` — ini **WAJIB**, bukan opsional. Kenapa? Karena `auth.api.getSession()` butuh baca cookie dari request yang lagi jalan, dan satu-satunya cara dia bisa 'lihat' request itu di Server Component adalah lewat `headers()` dari `next/headers`. Kalau ini dilewatin, dia gak akan nemu cookie-nya, dan session bakal selalu `null` walaupun user udah login."
- "`redirect()` dari `next/navigation`, bukan `NextResponse.redirect` — beda konteks, di Server Component kita pakai `redirect()`."
- **"Kenapa dipecah jadi `DashboardGuard` + dibungkus `<Suspense>`, bukan langsung di `DashboardPage`?"** — ini penting banget di project kita, karena `next.config.ts` di sini nyalain `cacheComponents: true` (fitur Cache Components / PPR di Next.js 16). Kalau `headers()` diakses langsung di top-level page tanpa `<Suspense>`, kalian bakal kena error **"Uncached data was accessed outside of `<Suspense>`"** pas `next dev` atau `next build`. Aturannya: setiap akses data runtime (`headers()`, `cookies()`, fetch tanpa cache) wajib dipisah ke komponen async sendiri dan dibungkus `<Suspense>`, biar sisa halaman tetap bisa di-prerender statis dan cuma bagian dinamisnya yang di-stream belakangan.

**Step 3 — Test double defense**

"Sekarang coba simulasiin `proxy.ts` gak jalan — caranya gampang, comment-in dulu isi `proxy.ts` kalian sementara (atau hapus dari `matcher`), terus buka `/dashboard` langsung tanpa login. Harusnya tetep ke-redirect ke `/login`, karena sekarang Server Component-nya juga jaga sendiri. Abis itu balikin lagi `proxy.ts`-nya ya, jangan lupa uncomment."

"Ini namanya defense in depth: `proxy.ts` buat UX cepat (kasih redirect sebelum halaman sempet nge-render), Server Component buat security yang sesungguhnya (gak bisa di-bypass)."

---

## Slide 4 — Kuis: Evaluasi Pemahaman

**Durasi:** ~5 menit

**Script:**

"Oke sebelum lanjut ke Home Lab, kita cek dulu pemahaman kalian. Jawab dulu di kepala masing-masing sebelum aku kasih tau jawabannya ya, jangan langsung scroll ke bawah!"

**Q1 — Apa perbedaan `proxy.ts` dan `middleware.ts` di Next.js 16?**

- A) Tidak ada bedanya — hanya rename
- **B) `proxy.ts` berjalan di Node.js runtime. `middleware.ts` di Edge Runtime (terbatas), `proxy.ts` lebih powerful** ✅
- C) `middleware.ts` lebih baru

> Pembahasan buat disampaikan: "Jawabannya B. Ini bukan cuma soal nama doang — ada perubahan runtime di baliknya. Edge Runtime itu sengaja dibikin ringan & terbatas (gak semua Node API ada), sementara Node.js runtime di `proxy.ts` jauh lebih lengkap kemampuannya."

**Q2 — Mengapa perlu cek session di Server Component meskipun `proxy.ts` sudah redirect?**

- A) Tidak perlu — proxy.ts sudah cukup
- **B) Defense in depth — proxy bisa dibypass. Server Component adalah actual security layer** ✅
- C) Hanya untuk logging

> Pembahasan: "Jawabannya B. Ini poin paling penting hari ini. `proxy.ts` itu convenience layer, bukan security boundary yang absolut."

**Q3 — Parameter apa yang WAJIB dipass ke `auth.api.getSession()` di Server Component?**

- A) Tidak perlu parameter
- **B) `{ headers: await headers() }` — agar bisa baca cookies dari request** ✅
- C) `{ userId: session.user.id }`

> Pembahasan: "Jawabannya B. Ini juga yang tadi kita praktekin bareng-bareng di live coding. Kalau ini lupa, dijamin session-nya bakal selalu `null`."

"Gimana, ada yang salah gak tadi? Kalau ada yang masih bingung soal `headers()`, sekarang tanya aja, jangan dipendem — ini konsep yang bakal kepake terus ke depannya."

---

## Slide 5 — Home Lab: Tugas Mandiri

**Durasi:** ~2 menit penjelasan (tugas dikerjakan mandiri setelah kelas)

**Script:**

"Oke sekarang giliran kalian praktek sendiri di luar jam kelas. Implementasikan protected routes dengan `proxy.ts` + Server Component, ini empat tugasnya:"

**01 — `proxy.ts`**
Buat `proxy.ts` di root. Proteksi `/dashboard`, `/admin`, `/settings`. Redirect ke `/login` jika tidak ada session. Redirect ke `/dashboard` jika sudah login dan akses `/login`.

*(Ini persis yang kita coding bareng tadi di Slide 2 — kalau masih nyangkut, buka lagi bagian live coding di atas.)*

**02 — Install**
`bun add @better-fetch/fetch`. Ini dibutuhkan untuk `betterFetch` di `proxy.ts`. Test: buka `/dashboard` tanpa login → redirect ke `/login`.

**03 — Double Check**
Di `app/dashboard/page.tsx`: tambahkan `auth.api.getSession` check + redirect. Test: apakah session check di Server Component benar-benar jalan?

*(Ini persis Slide 3 tadi.)*

**04 — callbackUrl**
Setelah login berhasil, redirect ke `callbackUrl` (parameter yang di-set oleh `proxy.ts` saat redirect). User kembali ke halaman yang mereka mau akses.

"Nah yang keempat ini belum kita coding bareng — sengaja aku kasih PR buat kalian. Hint-nya: di `proxy.ts` kita udah nyimpen `callbackUrl` di query param pas redirect ke `/login` (`loginUrl.searchParams.set('callbackUrl', pathname)`). Tugas kalian: di halaman login/handler login, baca query param itu (`searchParams.get('callbackUrl')`), terus setelah login sukses, redirect ke situ — bukan hardcode ke `/dashboard` melulu."

> ⚠️ **Ingetin sekali lagi ke kelas:** "`proxy.ts` adalah first line of defense — bukan satu-satunya! Selalu verify di Server Component juga. Kalau ngerjain Home Lab dan kalian cuma bikin nomor 1 & 2 doang terus ninggalin nomor 3, itu artinya app kalian masih bolong keamanannya."

---

## Slide 6 — Rangkuman

**Durasi:** ~3 menit

**Script:**

"Oke, kita rekap semua yang udah dibahas hari ini, biar nempel di kepala:

✓ **`proxy.ts`**: jalan di Node.js runtime, menggantikan `middleware.ts` yang deprecated di Next.js 16.

✓ **Fungsi `proxy.ts`**: redirect user belum login ke `/login`. Redirect logged-in user dari auth routes (`/login`, `/register`) balik ke `/dashboard`.

✓ **`betterFetch('/api/auth/get-session')`**: cara baca session di context `proxy.ts` — karena di situ kita gak bisa akses Better Auth instance secara langsung kayak di Server Component, jadi kita nembak endpoint-nya lewat HTTP, sambil forward cookie dari request asli.

✓ **Defense in depth**: `proxy.ts` itu first line of defense buat UX (biar user langsung ke-redirect tanpa nunggu halaman render) + Server Component check itu **actual security layer** yang gak bisa di-bypass.

✓ **`auth.api.getSession({ headers: await headers() })`** WAJIB di setiap protected page — ini bukan best practice doang, ini keharusan kalau kalian mau halamannya beneran aman.

Terakhir, kasih tau kelas kemana selanjutnya:

'→ Selanjutnya: **Bab 5 — CVE-2025-29927: Jangan Andalkan Middleware Saja**. Ini bakal nunjukin contoh nyata kenapa defense in depth yang kita bahas hari ini itu bukan basa-basi — ada kerentanan beneran yang bisa nge-bypass middleware/proxy kalau kalian cuma ngandelin satu layer doang.'

Ada pertanyaan sebelum kita tutup sesi ini?"

---

## 🔧 Catatan Tambahan: Perbaikan Bug di Luar Modul Ini

Bukan bagian dari 6 slide `124.pdf`, tapi ke-temu & ke-fix di sesi implementasi yang sama, jadi dicatat di sini biar gak hilang jejaknya. **Kalau kalian sempat ngobrolin materi ini ke kelas, sebutin ini sebagai "bonus" — bukan bagian resmi kuis/homelab.**

### 1. Tombol Logout di Navbar gak beneran logout

**Lokasi:** `app/components/UserBadge.tsx`

**Bug-nya:** Tombol Logout di navbar sebelumnya nyambung ke `UserContext` (`app/context/UserContext.tsx`) — context user **palsu** sisa modul Context API sebelumnya (dummy data statis "Rizki/Silver"). Klik Logout cuma reset state lokal React, **session Better Auth yang asli tetap aktif** (cookie gak kehapus). Kalau kalian ngecek pakai `useSession()` di homepage, tetep muncul "Login sebagai: ...".

**Fix:** `UserBadge` diganti pakai `useSession()` + `signOut()` dari `lib/auth-client.ts` (sumber sama yang dipakai `app/page.tsx`), lalu setelah logout: `router.push("/login")` + `router.refresh()`.

**Poin buat disampaikan ke kelas:** "Ini contoh nyata kenapa penting cross-check — ada dua sumber 'status login' di app kalian (`UserContext` yang palsu vs `useSession()` yang asli) dan UI-nya kelihatan jalan normal, padahal di belakang layar dia nge-track state yang salah. Selalu pastikan satu app cuma punya **satu sumber kebenaran** (single source of truth) buat data penting kayak auth."

### 2. Cache Components (`cacheComponents: true`) — beberapa halaman blocking

**Konteks:** `next.config.ts` project ini nyalain `cacheComponents: true`. Ini fitur Next.js 16 (dulu dikenal sebagai PPR/`dynamicIO`) yang match dengan peringatan breaking-changes di `AGENTS.md` — **beda banget** dari App Router yang biasa kalian pelajari. Aturannya: kalau ada komponen yang akses data runtime (`headers()`, `cookies()`, DB call tanpa `"use cache"`, dynamic route param) **tanpa** dibungkus `<Suspense>` atau ditandai `connection()`, seluruh route jadi blocking dan Next.js nolak build/dev dengan error "Uncached data was accessed outside of `<Suspense>`".

Tiga halaman kena, ke-detect pakai `bunx next build --debug-prerender`:

| File | Penyebab | Fix |
|---|---|---|
| `app/dashboard/page.tsx` | `headers()` diakses langsung di top-level page (bagian dari live coding Slide 3 di atas) | Dipisah ke komponen `DashboardGuard` async, dibungkus `<Suspense>` — lihat kode final di Slide 3 Step 2 |
| `app/blog/page.tsx` | `db.user.count()` — Prisma manggil `new Date()` internal (buat query log) sebelum ada sumber data dinamis resmi yang kedetect | Dipisah ke komponen `UserCount`, tambah `await connection()` dari `next/server` sebelum query, dibungkus `<Suspense>` |
| `app/posts/[slug]/page.tsx` | Gak ada `generateStaticParams` sama sekali, jadi seluruh route dianggap *fully dynamic* — gak ada static shell buat mulai dari mana | Tambah `generateStaticParams` yang query semua slug post published; karena DB lagi kosong, pakai fallback `[{ slug: "__placeholder__" }]` (ditangani `notFound()` di halaman) — Cache Components wajib minimal 1 param buat validasi build-time |

**Poin buat disampaikan ke kelas (relevan banget sama tema Modul 12):** "Ini juga soal *defense in depth* versi lain — kalian gak bisa cuma ngetes pakai `bun dev` doang dan mikir semuanya udah bener. `next dev` kadang gak ke-trigger errornya tergantung route mana yang kalian buka duluan. Cara paling reliable buat nge-cek semua route sekaligus adalah `bunx next build --debug-prerender` — itu bakal jalanin static generation buat SEMUA route dan nunjukin persis file & baris mana yang bermasalah."

**Cara ngetes fix ini:**
```bash
bunx next build --debug-prerender
```
Harus keluar `35/35` (atau sejumlah total route project kalian) tanpa error, dan ada baris `ƒ Proxy (Middleware)` di ringkasan output — itu konfirmasi `proxy.ts` beneran kepasang.

---

## Cara Menjalankan & Menguji Materi Ini

Lihat instruksi lengkap di bagian akhir percakapan / jawaban assistant (juga berlaku di branch `coba-124` yang aktif sekarang).

Ringkas:
```bash
bun install
bun dev                              # test manual di browser
bunx tsc --noEmit                    # type-check
bun run lint                         # lint
bunx next build --debug-prerender    # validasi Cache Components di semua route
```
