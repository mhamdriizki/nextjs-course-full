# Script Mengajar — Modul 12.5: CVE-2025-29927 — Jangan Andalkan Middleware Saja

> Sumber: `scripts/125.pdf` (7 slide, Canva)
> Gaya: santai, akrab, ngobrol — tapi tetap presisi soal kode.
> Target: kelanjutan langsung dari Modul 12.4 (Protected Routes & `proxy.ts`) di repo `nextjs-course-full`.

Catatan penting sebelum mulai: repo ini sekarang `next` versi **16.2.10** (`package.json`) dan `proxy.ts` (bukan `middleware.ts`) udah terpasang di root — artinya secara versi, project ini **sudah imun** dari CVE-2025-29927 yang dibahas modul ini. Tapi jangan salah paham: itu bukan berarti tugas kita selesai. Justru pelajaran modul ini — *jangan andalkan satu layer aja* — nemu **beberapa lubang nyata** di repo yang sama sekali gak ada hubungannya sama CVE-nya sendiri. Live coding di bawah ini bakal nambal lubang-lubang itu.

---

## Slide 1 — Cover: CVE-2025-29927: Jangan Andalkan Middleware Saja

**Durasi:** ~1 menit

**Script:**

"Oke lanjut ke Modul 12.5. Kalau minggu lalu kita belajar bikin `proxy.ts` buat protected routes, sekarang kita bahas kenapa itu **gak boleh jadi satu-satunya** pertahanan kalian.

Judulnya provokatif dikit: *Jangan Andalkan Middleware Saja*. Ini bukan clickbait — ada CVE beneran, CVSS 9.1 (critical), yang buktiin klaim ini. Yuk kita bedah."

---

## Slide 2 — CVE-2025-29927 — Middleware Authorization Bypass

**Durasi:** ~7 menit

**Script:**

"Jadi ceritanya gini. Maret 2025, ketauan ada celah di Next.js yang parah banget — CVSS 9.1, itu level **critical**, hampir skor maksimal. Affect-nya luas: versi 11.1.4 sampai 15.2.2. Coba bayangin, itu hampir SEMUA versi Next.js yang beredar waktu itu.

Cara exploit-nya? Gila sih, cuma modal **satu header HTTP**:

```
GET /admin/dashboard HTTP/1.1
Host: vulnerable-site.com
x-middleware-subrequest: middleware
```

Cukup segitu doang. Attacker kirim request ke `/admin/dashboard` sambil nyelipin header `x-middleware-subrequest: middleware`, dan... middleware kalian **DILEWATI SEPENUHNYA**. Gak ada auth check, gak ada redirect, halaman admin kebuka bebas ke siapapun.

**Kenapa bisa separah itu?** Next.js sebenernya pakai header internal ini buat kebutuhan legit — mencegah infinite loop kalau middleware manggil dirinya sendiri lewat subrequest. Masalahnya, mereka lupa validasi: kalau header ini ADA di request yang datang dari LUAR (bukan dari internal Next.js sendiri), middleware-nya tetep di-skip. Attacker cuma perlu nyamar jadi request internal itu.

**Siapa yang kena?** Semua app yang: (1) pakai middleware SEBAGAI SATU-SATUNYA auth check, (2) self-hosted (bukan di-manage Vercel), (3) belum di-patch. Dampaknya serem: admin panel kebobol tanpa login, privilege escalation, data user dicuri, bahkan CSP bisa di-bypass.

Kabar baiknya: **Next.js 16 udah fixed** — dan bukan kebetulan, ini salah satu alasan konvensi `middleware.ts` diganti total jadi `proxy.ts` yang kita pakai sekarang. Tapi — dan ini poinnya — **pelajarannya tetap berlaku selamanya**, gak peduli kalian udah di versi aman. Kenapa? Karena inti masalahnya bukan cuma soal versi Next.js, tapi soal **arsitektur security yang cuma satu lapis**. Bug serupa bisa muncul lagi di framework manapun, kapanpun. Makanya slide berikutnya jauh lebih penting dari CVE-nya sendiri."

*(Gak ada live coding di slide ini — sifatnya historis/konseptual. Fokus live coding ada di Slide 3.)*

---

## Slide 3 — Defense in Depth — Banyak Layer Security

**Durasi:** ~15-18 menit (termasuk live coding, slide paling penting di modul ini)

**Script:**

"Ini slide intinya. Defense in depth artinya: **satu layer gagal, layer lain masih nutupin**. Bukan teori kosong — kita langsung audit repo kita sendiri dan aku udah nemu beberapa lubang nyata yang persis kasus di slide ini. Yuk kita tambal bareng."

Konsep 4 layer dari slide (jelasin ke kelas dulu sebelum masuk kode):

1. **Layer 1 — `proxy.ts`** (gating/UX): redirect cepat, tapi cuma optimistic check.
2. **Layer 2 — Server Component** (actual security): `auth.api.getSession()` + `redirect()` di setiap protected page.
3. **Layer 3 — Server Action** (data mutation): setiap fungsi yang mutasi data WAJIB cek session sebagai baris pertama.
4. **Layer 4 — Data layer** (query-level): selalu filter `WHERE authorId = session.user.id`, biar user A gak bisa akses/hapus data user B (ini namanya **IDOR** — Insecure Direct Object Reference).

"Sekarang yang seru: aku udah cek, `app/dashboard/page.tsx` kalian **udah bener** — Layer 2 di situ udah ada (inget dari Modul 12.4). Tapi begitu aku audit halaman protected LAINNYA... ketemu masalah."

### 🖥️ Live Coding — Bagian 1: Layer 2 bolong di `/dashboard/settings`

**Step 1 — Tunjukin ke kelas: `proxy.ts` kalian protect `/settings` juga**

```ts
// proxy.ts
const protectedRoutes = ["/dashboard", "/admin", "/settings"];
```

"Jadi `/dashboard/settings` itu, menurut `proxy.ts`, harusnya protected. Tapi coba kita liat isi halamannya beneran:"

**Step 2 — Buka `app/dashboard/settings/page.tsx`, kondisi sekarang:**

```tsx
export default function SettingsDashboard() {
  return (
    <div>
      <h2>Settings Dashboard</h2>
    </div>
  )
}
```

"Nah lho. **Kosong sama sekali** — gak ada `auth.api.getSession()`, gak ada redirect. Persis kasus yang diomongin di slide: kalau `proxy.ts` ke-bypass (via CVE kayak tadi, atau bug lain apapun), halaman ini kebuka bebas buat siapapun. Ini contoh nyata Layer 2 yang bolong."

**Step 3 — Tambal, ikut pola yang sama persis kayak `app/dashboard/page.tsx`:**

```tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

async function SettingsGuard() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <div>
      <h2>Settings Dashboard</h2>
    </div>
  );
}

export default function SettingsDashboard() {
  return (
    <Suspense fallback={<p>Memuat pengaturan...</p>}>
      <SettingsGuard />
    </Suspense>
  );
}
```

"Kenapa dibungkus `<Suspense>` lagi? Inget dari sesi debugging kita kemarin — project ini nyalain `cacheComponents: true` di `next.config.ts`, jadi tiap akses `headers()` WAJIB di komponen terpisah yang dibungkus `<Suspense>`, kalau enggak nanti error blocking-route pas `next build`."

### 🖥️ Live Coding — Bagian 2: Layer 3 bolong di Server Action `softDeletePostAction`

**Step 1 — Buka `app/posts/action.ts`, cek fungsi `softDeletePostAction`:**

```ts
export async function softDeletePostAction(id: string) {
  try {
    await softDeletePost(id);
    revalidateTag("posts", "max");
    revalidateTag(`post-${id}`, "max");
    return { success: true, data: null };
  } catch (error) {
    return { success: false, message: "Gagal menghapus post" };
  }
}
```

"Ini Server Action buat hapus post. Sesuai slide: 'Setiap Server Action yang mutasi data harus `getSession()`. Auth check adalah baris pertama fungsi.' Nah di sini... **gak ada sama sekali**. Siapapun yang manggil action ini — login atau enggak — bisa hapus post apapun, tinggal tau `id`-nya."

**Step 2 — Tambal, session check jadi baris pertama:**

```ts
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function softDeletePostAction(id: string) {
  const session = await auth.api.getSession({ headers: await headers() }); // ← WAJIB baris pertama!
  if (!session) {
    return { success: false, message: "Unauthorized" };
  }

  try {
    await softDeletePost(id, session.user.id);
    revalidateTag("posts", "max");
    revalidateTag(`post-${id}`, "max");
    return { success: true, data: null };
  } catch (error) {
    return { success: false, message: "Gagal menghapus post" };
  }
}
```

"Perhatiin, aku juga ubah pemanggilan `softDeletePost(id)` jadi `softDeletePost(id, session.user.id)` — ini nyambung ke Layer 4 yang mau kita bahas sekarang."

### 🖥️ Live Coding — Bagian 3: Layer 4 bolong — IDOR di `softDeletePost`

**Step 1 — Buka `lib/data/post.ts`, cek fungsi `softDeletePost`:**

```ts
export async function softDeletePost(id: string) {
  return db.post.update({
    where: { id },
    data: { deletedAt: new Date() }
  });
}
```

"Nah ini contoh IDOR yang paling gampang dipahami. Query-nya cuma filter `where: { id }` — SIAPAPUN yang punya session valid (abis kita tambal Layer 3 tadi) bisa hapus post **MILIK USER LAIN**, asal tau `id` post-nya. Padahal `id` itu biasanya gampang ditebak/dilihat (misalnya nongol di URL `/posts/edit/123`). Ini persis kasus di slide: 'Selalu filter `WHERE authorId = session.user.id` agar satu user tidak bisa akses data user lain.'"

**Step 2 — Tambal, wajib terima & filter by `authorId`:**

```ts
export async function softDeletePost(id: string, authorId: string) {
  return db.post.update({
    where: { id, authorId }, // ← selalu include authorId, cegah IDOR!
    data: { deletedAt: new Date() }
  });
}
```

"Sekarang kalau user B coba hapus post user A, Prisma bakal gak nemu row yang cocok (`id` COCOK tapi `authorId` GAK cocok) dan lempar error — bukan diam-diam berhasil menghapus punya orang lain."

**Step 3 — Test manual (3 layer sekaligus)**

1. Logout, coba buka `/dashboard/settings` langsung → harus redirect ke `/login` (test Layer 2).
2. Login sebagai user A, coba panggil `softDeletePostAction` dengan `id` post milik user B (cari lewat Prisma Studio / query manual) → harus gagal, bukan berhasil hapus (test Layer 4).
3. Logout total, coba panggil `softDeletePostAction` dari luar (misal lewat network tab / curl ke server action) → harus balikin `{ success: false, message: "Unauthorized" }` (test Layer 3).

"Kalau ketiga test ini lolos, defense in depth kalian di area ini udah solid — bukan cuma di atas kertas."

---

## Slide 4 — Security Checklist — CVE-2025-29927 Prevention

**Durasi:** ~5 menit

**Script:**

"Sekarang kita rekap checklist-nya, plus aku kasih tau status masing-masing di repo kita SEKARANG (per audit hari ini):"

**① Update Next.js ke v16+**
"Status: ✅ **udah aman**. `package.json` kalian udah `next: 16.2.10`. Next.js 16 udah include fix CVE-2025-29927 secara default."

**② Cek Session di Setiap Page**
"Status: ⚠️ **sebagian**. `/dashboard` udah bener (Modul 12.4). `/dashboard/settings` tadinya bolong — udah kita tambal barusan di live coding. PR buat kelas: audit halaman lain kalau nanti ada `/admin` atau `/profile` ditambahin."

**③ Cek Session di Setiap Action**
"Status: ⚠️ **sebagian**. `softDeletePostAction` udah kita tambal. Tapi `app/posts/action.ts` masih punya `publishPostAction`, `createPostAction`, dll yang belum dicek — itu jadi Home Lab kalian."

**④ Filter Data dengan userId**
"Status: ⚠️ **sebagian**. `softDeletePost` udah kita tambal. Tapi banyak fungsi lain di `lib/data/post.ts` dan `lib/data/blog.ts` yang query-nya belum di-filter `authorId`/`userId` — juga jadi Home Lab."

"Liat kan, ini bukan checklist abstrak — ini checklist yang beneran applicable ke project kalian sendiri, hari ini."

---

## Slide 5 — Kuis: Evaluasi Pemahaman

**Durasi:** ~5 menit

**Script:**

"Sebelum ke Home Lab, cek dulu pemahaman kalian. Jawab dulu di kepala sebelum liat jawabannya."

**Q1 — CVE-2025-29927 dieksploitasi dengan cara apa?**

- A) SQL injection ke database
- **B) Tambahkan header `x-middleware-subrequest: middleware` → middleware di-skip sepenuhnya** ✅
- C) XSS di login form

> Pembahasan: "Jawabannya B. Ini bukan soal input berbahaya kayak SQL injection atau XSS — ini soal Next.js salah percaya ke header internal yang ternyata bisa dipalsuin dari luar."

**Q2 — Jika `proxy.ts` bisa dibypass, layer apa yang masih melindungi route yang aman?**

- A) Tidak ada — harus update Next.js dulu
- **B) Session check di Server Component dan Server Action (defense in depth)** ✅
- C) CORS headers di response

> Pembahasan: "Jawabannya B. Ini juga yang barusan kita praktekin — walaupun `proxy.ts` di-bypass, `/dashboard/settings` yang udah kita tambal tetep aman karena Layer 2-nya jalan sendiri."

**Q3 — Mengapa query filter `WHERE authorId = session.user.id` penting meski sudah ada auth check?**

- A) Untuk performa query yang lebih cepat
- **B) Mencegah IDOR — user A tidak bisa akses/hapus data milik user B meskipun sudah login** ✅
- C) Required oleh Prisma 7

> Pembahasan: "Jawabannya B. Ini poin yang paling sering ke-skip orang, soalnya kelihatannya 'kan udah ada auth check, aman dong' — padahal auth check cuma jawab 'apakah kamu login', bukan 'apakah data ini punya kamu'. Itu dua pertanyaan yang beda, dan `softDeletePost` yang tadi kita audit itu contoh persis kenapa keduanya harus dijawab."

---

## Slide 6 — Home Lab: Tugas Mandiri

**Durasi:** ~3 menit penjelasan (tugas dikerjakan mandiri setelah kelas)

**Script:**

"Sekarang giliran kalian audit sisa repo secara mandiri. Format tugasnya sama kayak yang barusan kita praktekin bareng, cuma sekarang buat file-file lain."

**01 — Version Audit**
Cek versi Next.js di `package.json`. Jika < 15.2.3 → update: `bun update next react react-dom`. Verifikasi setelah update.

"Status di repo kita: ✅ **udah selesai duluan**, `next: 16.2.10` udah aman. Gak ada kerjaan buat task ini, tapi tetep biasain cek `package.json` di project manapun kalian pegang nanti."

**02 — Page Audit**
Review semua protected pages. Pastikan setiap `page.tsx` di `/dashboard`, `/admin`, `/profile`: punya session check + redirect jika tidak ada session.

"Ini persis yang kita kerjain di Live Coding Bagian 1 buat `/dashboard/settings`. Repo ini belum punya `/admin` atau `/profile`, jadi kalau nanti kalian nambahin halaman baru di bawah `/dashboard`, `/admin`, atau `/settings` (karena itu yang di-protect `proxy.ts`), WAJIB pola yang sama: pisah ke komponen Guard + `<Suspense>`."

**03 — Action Audit**
Review semua Server Actions. Pastikan setiap fungsi yang mutasi data: session check adalah baris pertama.

"Ini persis Live Coding Bagian 2, tapi baru kita kerjain buat SATU fungsi (`softDeletePostAction`). Server Actions di repo ini ada di 3 file: `app/posts/action.ts` (`publishPostAction`, `createPostAction`, `createPostFromObjectAction`, `saveThemePreferenceAction` — belum ada session check), `app/blog/action.ts` (`createPostAction`, `toggleLikeAction` — belum ada), dan `app/contacts/actions/contact.ts` (`submitContact` — form kontak publik, boleh gak pakai auth check, tapi diskusiin ke kelas: apa bedanya action yang MEMANG buat publik vs yang harusnya di-protect)."

**04 — Data Filter Audit**
Review semua db queries. Pastikan setiap query yang return user-specific data: ada `WHERE userId = session.user.id` atau filter equivalent.

"Ini persis Live Coding Bagian 3, tapi baru kita kerjain buat `softDeletePost`. Cek juga `updatePost` dan `incrementPostViewCount` di `lib/data/post.ts` — apa function itu emang butuh proteksi authorId juga? (Hint: `incrementPostViewCount` sengaja publik, tapi `updatePost` harusnya kena aturan yang sama kayak `softDeletePost`.)"

> 🔐 **Prinsip yang wajib nempel di kepala kelas:** "Never trust the edge. Proxy/middleware = UX only. Actual security ada di data layer."

---

## Slide 7 — Rangkuman

**Durasi:** ~3 menit

**Script:**

"Oke, rekap Modul 12.5:

✓ **CVE-2025-29927**: attacker tambah header `x-middleware-subrequest` → middleware di-skip. CVSS 9.1.

✓ **Fix**: Next.js v16+ sudah patch (project kita udah aman di versi ini). Kalau masih di v15: update ke 15.2.3+.

✓ **Pelajaran utama**: JANGAN andalkan middleware/proxy saja sebagai satu-satunya security — dan kita udah buktiin ini bukan cuma teori, ada 3 lubang nyata yang ke-temu & ke-tambal hari ini di repo kalian sendiri (`/dashboard/settings`, `softDeletePostAction`, `softDeletePost`).

✓ **Defense in depth**: `proxy.ts` + Server Component check + Server Action check + data filter — 4 layer, bukan 1.

✓ **Selalu `WHERE authorId = session.user.id`** di query (mencegah IDOR).

Terakhir:

'→ Selanjutnya: **Bab 6 — RBAC: Role-Based Access Control**. Sekarang kalian udah bisa mastiin 'apakah user ini login', bab depan kita bahas 'apakah user ini BOLEH ngelakuin X' — beda level lagi.'

Ada pertanyaan sebelum lanjut ke bab berikutnya?"

---

## Cara Menjalankan & Menguji Materi Ini

```bash
bun install
bun dev                              # test manual di browser
bunx tsc --noEmit                    # type-check
bun run lint                         # lint
bunx next build --debug-prerender    # validasi Cache Components (wajib buat halaman baru yang pakai headers())
```

**Test manual live coding modul ini** (setelah implementasi ketiga tambalan di Slide 3):
1. Logout → buka `/dashboard/settings` langsung → harus redirect ke `/login?callbackUrl=%2Fdashboard%2Fsettings`.
2. Login → panggil `softDeletePostAction` tanpa session (misal dari incognito/curl tanpa cookie) → harus balikin `Unauthorized`, bukan berhasil hapus.
3. Login sebagai user A → coba `softDeletePostAction` dengan `id` post milik user B → harus gagal (Prisma gak nemu row yang cocok `id` + `authorId`), post user B tetap utuh.
