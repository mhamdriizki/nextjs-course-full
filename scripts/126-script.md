# Script Mengajar — Modul 12.6: Role-Based Access Control (RBAC)

> Materi: `scripts/126.pdf` (7 slide)
> Konteks repo yang dipakai buat live-coding: `prisma/schema.prisma` (field `role` + enum `UserRole` **sudah ada**), `lib/auth.ts`, `lib/auth-client.ts`, `proxy.ts` (sudah protect `/admin`), `app/posts/action.ts`, `lib/data/post.ts`, `app/posts/[slug]/page.tsx`.

---

## Slide 1 — Role-Based Access Control

**Durasi:** 2 menit

**Script:**

"Oke gaes, selamat datang di modul baru — **Role-Based Access Control**, atau RBAC. Kalau di modul sebelumnya kita udah belajar *authentication* (login/logout, proxy.ts buat proteksi route) dan *authorization dasar* (cek `session.user.id` biar orang cuma bisa hapus post miliknya sendiri — inget CVE-2025-29927 kemarin?), sekarang kita naik level.

RBAC itu jawaban dari pertanyaan: **'siapa boleh ngapain'**. Bukan cuma 'apakah dia login', tapi 'apakah role dia cukup buat ngelakuin aksi ini'. Contoh gampangnya: semua orang yang login bisa baca artikel, tapi cuma penulis yang bisa edit tulisannya sendiri, dan cuma admin yang bisa hapus tulisan siapapun atau approve user baru.

Kabar baiknya, project kalian ini udah punya modal buat ini — nanti kita cek bareng."

---

## Slide 2 — Setup Role di User Model & Better Auth

**Durasi:** 8 menit

**Script:**

"Nah ini menarik nih. Biasanya di slide ini kalian disuruh nambahin field `role` ke model `User` dan bikin enum `UserRole`. Tapi kalau kalian buka `prisma/schema.prisma` di project kalian sekarang..."

*(buka file bareng-bareng)*

"...ternyata itu **udah ada duluan**! Coba cek:

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  role      UserRole @default(READER)
  // ...
}

enum UserRole {
  READER
  AUTHOR
  ADMIN
}
```

Jadi task 'tambah field role' di project kalian udah selesai dari sononya — lumayan, hemat waktu migrasi. Yang **belum ada** adalah koneksi antara field `role` ini dengan **Better Auth session**. Kalau kita gak sambungin, tiap kali butuh role kita harus query database lagi — padahal Better Auth punya fitur `additionalFields` yang bisa nyisipin field custom langsung ke object session, gratis, tanpa query tambahan.

Yuk kita sambungin sekarang."

### 🖥️ Live Coding

**Langkah 1 — Cek dulu role admin ada gak di database kalian**

Kalau belum ada user dengan role ADMIN, set salah satu lewat Prisma Studio:

```bash
bunx prisma studio
```

Buka tabel `User`, pilih salah satu akun kalian, ubah kolom `role` dari `READER` ke `ADMIN`, simpan.

**Langkah 2 — Tambahkan `additionalFields` di `lib/auth.ts`**

Edit `lib/auth.ts` — sekarang isinya begini:

```ts
export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  plugins: [nextCookies()],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: true,
  },
  socialProviders: { /* ... */ },
});
```

Tambahkan konfigurasi `user.additionalFields` biar `role` ikut ke-embed di session:

```ts
export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  plugins: [nextCookies()],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: true,
  },
  socialProviders: { /* ... */ },

  // ← tambahan baru: expose role ke session
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "READER",
        input: false, // user gak bisa set role sendiri pas signup
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
```

`input: false` itu penting banget — artinya field ini **gak bisa diisi manual** lewat form signup. Kalau kalian lupa set ini, orang bisa aja kirim `{ role: "ADMIN" }` pas register dan langsung jadi admin. Ngeri kan.

**Test manual:**
1. `bun dev`
2. Login pakai akun yang tadi kalian jadiin ADMIN di Prisma Studio
3. Buka console browser, cek network request ke `/api/auth/get-session` — pastikan response-nya sekarang punya field `role: "ADMIN"`

---

## Slide 3 — Role Check di Halaman, Action & API

**Durasi:** 12 menit

**Script:**

"Sekarang bagian intinya: **di mana aja kita harus cek role?** Jawabannya: di **setiap layer** yang bisa diakses langsung — bukan cuma di UI. Kenapa? Karena Server Action itu bisa dipanggil langsung tanpa lewat tombol di UI kalian (inget pelajaran CVE kemarin — jangan percaya satu lapis pertahanan aja).

Pola yang kita pakai selalu sama urutannya:
1. **Auth** — apakah dia login?
2. **Role** — apakah role-nya cukup?
3. **Ownership** (kalau perlu) — apakah ini miliknya sendiri, atau dia admin yang boleh bypass?
4. **Execute** — baru jalanin aksinya.

Kita praktikkan langsung di project kalian — bikin halaman admin baru, terus upgrade Server Action penghapusan post yang udah ada biar admin bisa hapus post siapapun, bukan cuma post sendiri."

### 🖥️ Live Coding

**Langkah 1 — Halaman `/unauthorized`**

Buat file baru `app/unauthorized/page.tsx`:

```tsx
export default function UnauthorizedPage() {
  return (
    <div className="max-w-2xl mx-auto p-8 text-center">
      <h1>403 — Akses Ditolak</h1>
      <p>Kamu gak punya izin buat buka halaman ini.</p>
    </div>
  );
}
```

**Langkah 2 — Halaman `/admin` yang cuma bisa diakses ADMIN**

Ingat, project kalian pakai `cacheComponents: true` di `next.config.ts` — artinya tiap komponen yang manggil `headers()`/session **wajib** dibungkus `<Suspense>`, persis pola `DashboardGuard`/`SettingsGuard` yang udah kalian pakai di modul sebelumnya. Buat `app/admin/page.tsx`:

```tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

async function AdminGuard() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/unauthorized");

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h2>Admin Dashboard</h2>
      <p>Halo, {session.user.name} — role kamu: {session.user.role}</p>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<p>Memuat admin dashboard...</p>}>
      <AdminGuard />
    </Suspense>
  );
}
```

Perhatikan urutannya: **Auth dulu** (`!session` → redirect ke `/login`), baru **Role** (`role !== "ADMIN"` → redirect ke `/unauthorized`). Kalau dibalik, orang yang belum login bakal kena redirect ke `/unauthorized` alih-alih `/login` — pesan errornya jadi salah.

Route `/admin` ini kebetulan udah masuk `protectedRoutes` di `proxy.ts` kalian dari modul sebelumnya, jadi lapisan pertama (redirect kalau belum login) sebenarnya udah dicover di proxy juga — tapi cek session di Server Component ini tetap wajib ada, karena proxy cuma optimistic check (inget CVE-2025-29927: jangan andalkan middleware/proxy doang).

**Langkah 3 — Upgrade `softDeletePost` di `lib/data/post.ts` biar ADMIN bisa bypass ownership**

Sekarang `lib/data/post.ts` kalian:

```ts
export async function softDeletePost(id: string, authorId: string) {
  return db.post.update({
    where: { id, authorId },
    data: { deletedAt: new Date() }
  });
}
```

`authorId` di sini wajib diisi dan selalu dipakai buat filter — artinya cuma pemilik post yang bisa hapus. Kita bikin `authorId` opsional, biar bisa dilewatin (skip filter ownership) kalau yang minta itu admin:

```ts
export async function softDeletePost(id: string, authorId?: string) {
  return db.post.update({
    where: authorId ? { id, authorId } : { id },
    data: { deletedAt: new Date() }
  });
}
```

**Langkah 4 — Update `softDeletePostAction` di `app/posts/action.ts`**

Sekarang:

```ts
export async function softDeletePostAction(id: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session) {
    return { success: false, message: 'Unauthorized' }
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

Tambahkan role check di antara Auth dan Execute — ini pola **Auth → Role → Ownership → Execute** dari slide:

```ts
export async function softDeletePostAction(id: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session) {
    return { success: false, message: "Unauthorized" };
  }

  const isAdmin = session.user.role === "ADMIN";

  try {
    // ADMIN: authorId di-skip → bisa hapus post siapapun
    // Bukan ADMIN: authorId tetap dipaksa == dirinya sendiri → cuma bisa hapus post sendiri
    await softDeletePost(id, isAdmin ? undefined : session.user.id);
    revalidateTag("posts", "max");
    revalidateTag(`post-${id}`, "max");
    return { success: true, data: null };
  } catch (error) {
    return { success: false, message: "Gagal menghapus post" };
  }
}
```

Kalau bukan admin dan `id` yang dikirim bukan post miliknya, `db.post.update({ where: { id, authorId } })` bakal gak nemu record yang cocok (kombinasi `id` + `authorId` gak match) dan Prisma lempar error — yang otomatis ketangkep `catch` dan balikin `"Gagal menghapus post"`. Ini teknik **extended where** dari Prisma 7 yang udah kalian pelajari juga — dipakai buat sekaligus enforce ownership di level query, bukan cuma di if-check.

**Test manual:**
1. `bun dev`, login sebagai user **READER/AUTHOR biasa** (bukan admin)
2. Coba hapus post **milik orang lain** → harus gagal ("Gagal menghapus post")
3. Coba hapus post **milik sendiri** → berhasil
4. Logout, login sebagai akun yang tadi kalian jadikan **ADMIN**
5. Coba hapus post **milik siapapun** → harus berhasil
6. Coba akses `/admin` pas login sebagai READER → harus keredirect ke `/unauthorized`
7. Coba akses `/admin` pas belum login sama sekali → harus keredirect ke `/login`

---

## Slide 4 — Conditional UI Berdasarkan Role

**Durasi:** 8 menit

**Script:**

"Bagian terakhir dari implementasi — **conditional UI**. Ini soal nampilin atau nyembunyiin tombol berdasarkan role. Tapi gaes, ini **PENTING BANGET** buat diinget:

> Menyembunyikan tombol di UI itu **cuma UX**, bukan security. Security yang beneran itu yang udah kita bikin di slide sebelumnya — role check di Server Action. Kalaupun tombolnya disembunyiin, orang yang niat jahat tetap bisa manggil Server Action-nya langsung dari console browser atau lewat request manual. Yang nahan dia itu check di server, bukan tombol yang ilang.

Jadi conditional UI ini kita bikin buat pengalaman user yang lebih rapi — nunjukkin tombol yang relevan aja — bukan buat 'ngamanin' apa-apa."

### 🖥️ Live Coding

Kita edit `app/posts/[slug]/page.tsx` yang udah ada. Sekarang isinya:

```tsx
async function PostDetailContent({ slug }: { slug: string }) {
  await connection();

  const post = await getPostBySlug(slug);

  if (!post) notFound();

  await incrementPostViewCount(post.id);

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1>{post.title}</h1>
      <p>Oleh {post.author.name} - {post.author.email}</p>
      <p>sudah {post.viewCount} view, bisa tambah 1 {post.viewCount+1}</p>

      <p>{post.content ?? "belum ada konten"}</p>
    </div>
  )
}
```

Tambahkan ambil session, hitung `isAdmin`/`isAuthor`, dan render tombol Edit/Delete secara kondisional:

```tsx
import { getPostBySlug, incrementPostViewCount } from "@/lib/data/post";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { DeletePostButton } from "./DeletePostButton";

// ...PostDetailPage tetap sama...

async function PostDetailContent({ slug }: { slug: string }) {
  await connection();

  const session = await auth.api.getSession({ headers: await headers() });
  const post = await getPostBySlug(slug);

  if (!post) notFound();

  await incrementPostViewCount(post.id);

  const isAdmin = session?.user.role === "ADMIN";
  const isAuthor = session?.user.id === post.author.email; // ganti sesuai field id kalau ada di select

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1>{post.title}</h1>
      <p>Oleh {post.author.name} - {post.author.email}</p>
      <p>sudah {post.viewCount} view, bisa tambah 1 {post.viewCount+1}</p>

      <p>{post.content ?? "belum ada konten"}</p>

      {/* Tombol edit hanya untuk author + admin — ini cuma UX! */}
      {(isAuthor || isAdmin) && (
        <div className="flex gap-2 mt-4">
          <a href={`/posts/${slug}/edit`}>
            <button>Edit</button>
          </a>
          {/* Tombol delete hanya untuk admin — ini juga cuma UX! */}
          {isAdmin && <DeletePostButton postId={post.id} />}
        </div>
      )}
    </div>
  );
}
```

> Catatan: `getPostBySlug` di `lib/data/post.ts` kalian saat ini cuma nge-`select` `{ name, email }` dari author, bukan `id`-nya — jadi contoh `isAuthor` di atas pakai perbandingan email sebagai gambaran konsep. Kalau mau bikin ini akurat, tambahkan `id: true` ke `select` author di `getPostBySlug` lalu bandingkan `session?.user.id === post.author.id`. Halaman `/posts/[slug]/edit` juga belum ada di project ini — link di atas cuma nunjukkin *ke mana* tombol itu harus ngarah, bukan bagian yang wajib dibangun sekarang.

Buat komponen client kecil `app/posts/[slug]/DeletePostButton.tsx` buat manggil action yang udah kita RBAC-in di Slide 3:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { softDeletePostAction } from "@/app/posts/action";

export function DeletePostButton({ postId }: { postId: string }) {
  const router = useRouter();

  async function handleDelete() {
    const result = await softDeletePostAction(postId);
    if (result.success) {
      router.push("/posts");
      router.refresh();
    }
  }

  return <button onClick={handleDelete}>Hapus (Admin)</button>;
}
```

**Test manual:**
1. Login sebagai READER biasa, buka salah satu post → tombol Edit/Delete gak muncul
2. Login sebagai penulis post itu sendiri → tombol Edit muncul, Delete gak muncul (karena bukan admin)
3. Login sebagai ADMIN → kedua tombol muncul, dan klik Delete beneran berhasil hapus post siapapun

---

## Slide 5 — Kuis: Evaluasi Pemahaman

**Durasi:** 5 menit

**Script:**

"Sebelum lanjut ke Home Lab, kita cek dulu pemahaman kalian lewat 3 pertanyaan ini. Jawab dulu di kepala masing-masing, baru kita bahas."

**Q1 — Mengapa menyembunyikan tombol 'Hapus' di UI berdasarkan role BUKAN merupakan security yang cukup?**
- A) Karena CSS tidak bisa di-trust
- **B) Karena user bisa tetap call Server Action `deletePost()` langsung tanpa melalui UI** ✅
- C) Karena tombol tetap visible di source code

*Pembahasan buat disampaikan:* "Jawabannya B. Server Action itu ujung-ujungnya jadi endpoint yang bisa dipanggil dari mana aja — devtools, curl, script luar. Tombol yang disembunyiin di UI cuma bikin orang biasa gak lihat opsinya; itu gak menghalangi orang yang niat manggil fungsinya langsung."

**Q2 — Urutan check yang benar di Server Action untuk RBAC?**
- A) Ownership → Role → Auth
- **B) Auth (session) → Role → Ownership → Execute** ✅
- C) Role → Execute (role sudah cukup)

*Pembahasan:* "B. Kita harus tau dulu 'siapa dia' (auth), baru 'dia boleh ngapain secara umum' (role), baru 'apakah ini spesifik miliknya atau dia admin yang bypass' (ownership), baru eksekusi. Kalau urutannya kebalik, bisa ada celah — misalnya cek ownership duluan padahal belum tau dia login atau enggak."

**Q3 — Kenapa role sebaiknya dimasukkan ke session (`additionalFields`) di Better Auth?**
- A) Lebih aman dari role di database
- **B) Menghindari query DB tambahan setiap request — role tersedia langsung dari session** ✅
- C) Required oleh Better Auth

*Pembahasan:* "B. Ini murni soal efisiensi — role datanya tetap sama-sama dari database kok (Better Auth ambil pas login/refresh session), tapi begitu nempel di session cookie/token, tiap kali kita butuh cek role gak perlu `db.user.findUnique()` lagi. Bukan soal 'lebih aman', dan bukan requirement wajib dari Better Auth — itu fitur opsional yang kita pilih pakai."

---

## Slide 6 — Home Lab: Tugas Mandiri

**Durasi:** 3 menit (penjelasan) + take-home

**Script:**

"Oke, ini tugas mandiri kalian. Kabar baiknya — sebagian udah kita kerjain bareng tadi. Aku petain ke live-coding yang udah kita lakuin:"

- **01 — Schema + Migrate:** ✅ Field `role` + enum `UserRole` **udah ada** di `prisma/schema.prisma` kalian dari awal (dilihat di Slide 2). Yang perlu kalian pastiin sendiri: minimal satu user di database kalian punya `role: "ADMIN"` (caranya udah dipraktikkan di Slide 2, Langkah 1 — lewat Prisma Studio).
- **02 — Admin Pages:** ✅ Sudah dibikin bareng di Slide 3 — `app/admin/page.tsx` dengan `AdminGuard` yang redirect ke `/unauthorized` kalau role bukan ADMIN.
- **03 — Author Actions:** ✅ Sudah dipraktikkan di Slide 3 — `softDeletePostAction` sekarang ADMIN bisa hapus semua post, non-admin cuma bisa hapus miliknya sendiri. **PR buat kalian:** terapkan pola yang sama (Auth → Role → Ownership → Execute) ke `publishPostAction` di `app/posts/action.ts` — saat ini fungsi itu (`await updatePost(id, { published: true })`) belum ada pengecekan sama sekali. Coba tambahin sendiri di luar sesi ini, pakai contoh `softDeletePostAction` sebagai referensi.
- **04 — Conditional UI:** ✅ Sudah dipraktikkan di Slide 4 — tombol Edit (author/admin) dan Delete (admin only) di `app/posts/[slug]/page.tsx`.

"Jadi PR nyata kalian cuma satu: **amankan `publishPostAction`**. Coba kerjain sendiri sebelum sesi berikutnya — kalau stuck, bandingin lagi sama pola `softDeletePostAction` yang barusan kita bikin.

Test RBAC keseluruhan: login sebagai READER → coba akses `/admin` → harus redirect ke `/unauthorized`. Login sebagai ADMIN → semua aksi (`/admin`, hapus post siapapun) harus jalan mulus."

---

## Slide 7 — Rangkuman

**Durasi:** 2 menit

**Script:**

"Recap modul ini ya, gaes:

- RBAC itu jawaban dari 'siapa boleh ngapain' — di project kalian, field `role` dan enum `UserRole` (READER/AUTHOR/ADMIN) ternyata udah disiapin dari awal project.
- `additionalFields` di Better Auth bikin `role` nempel di session, jadi gak perlu query database berulang tiap butuh cek role.
- Urutan wajib di setiap Server Action: **Auth → Role → Ownership → Execute**. Kita udah praktikkan langsung di `softDeletePostAction`.
- Conditional UI (nampilin/nyembunyiin tombol) itu bagus buat UX, tapi **BUKAN security** — security yang beneran tetap harus ada di server, di Server Action-nya.
- ADMIN bisa bypass ownership check (hapus post siapapun), AUTHOR cuma bisa aksi ke post miliknya sendiri, READER read-only.

Selanjutnya kita lanjut ke **Modul 13 — Upload File & Optimasi Gambar**. Sampai ketemu di sesi berikutnya!"

---

## 🔧 Cara Menjalankan & Menguji Materi Ini

```bash
bun install                        # kalau ada dependency baru (tidak ada di modul ini)
bunx prisma studio                 # set role ADMIN ke salah satu user
bun dev                            # jalankan dev server
bunx tsc --noEmit                  # pastikan tidak ada type error
bun run lint                       # pastikan tidak ada lint error baru
bunx next build --debug-prerender  # validasi semua route (termasuk /admin, /unauthorized baru) aman dari error Cache Components
```

**Checklist manual test (ringkasan dari semua slide):**
1. Login sebagai user biasa (READER) → cek network `/api/auth/get-session` ada field `role`.
2. Akses `/admin` sebagai READER → redirect ke `/unauthorized`.
3. Akses `/admin` tanpa login → redirect ke `/login`.
4. Login sebagai ADMIN → akses `/admin` → berhasil masuk, halaman tampil.
5. Sebagai user biasa, coba hapus post orang lain → gagal. Hapus post sendiri → berhasil.
6. Sebagai ADMIN, hapus post siapapun → berhasil.
7. Buka halaman detail post sebagai READER biasa (bukan penulis, bukan admin) → tombol Edit/Delete tidak muncul.
8. Buka halaman detail post sebagai penulisnya sendiri → tombol Edit muncul, Delete tidak.
9. Buka halaman detail post sebagai ADMIN → kedua tombol muncul dan berfungsi.
