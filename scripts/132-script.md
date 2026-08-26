# Script Ngajar — Modul 13 (Bab 2): Upload ke Cloud Storage (Cloudinary)

> Sumber: `scripts/132.pdf` (7 slide). Lanjutan dari `131-script.md` (Bab 1 —
> local storage). Semua contoh kode di bawah sudah digrounding dan ditest
> langsung terhadap kondisi repo saat ini: Next.js 16.2.10 dengan
> `cacheComponents: true`, Better Auth (`lib/auth.ts`) yang session-nya
> punya field `user.image` bawaan, model `User.image` di
> `prisma/schema.prisma`, pola `ActionResult<T>` di
> `lib/validation/action-result.ts`, dan halaman guard-Suspense yang sudah
> ada di `app/dashboard/settings/page.tsx`.
>
> **Yang sudah dibikin & ditest (bukan cuma ditulis di script ini):**
> `lib/cloudinary.ts`, `app/dashboard/settings/avatar-action.ts`,
> `app/dashboard/settings/AvatarUploadForm.tsx`, `next.config.ts` (
> `images.remotePatterns`), dan `.env` / `.env.example` (placeholder
> credential). Live-coding di bawah menuntun kalian nulis ulang file yang
> sama dari nol pas ngajar.

---

## Slide 1 — Upload ke Cloud Storage: Cloudinary

**Durasi:** 3 menit

**Script:**

"Oke gaes, lanjut ke Bab 2 dari Modul 13. Di Bab 1 kemarin kita udah belajar
upload ke local storage — tapi inget banget warning-nya: itu cuma buat
development. Sekarang kita naik level, upload beneran ke **cloud storage**
pakai **Cloudinary**.

Cloudinary itu bukan cuma tempat nyimpen file doang. Dia itu paket lengkap:
storage + CDN + transformasi gambar on-the-fly. Jadi selain nyimpen, dia juga
bisa resize, compress, crop gambar kalian cuma dengan ngubah parameter di
URL — gak perlu proses manual di server kalian.

Free tier-nya lumayan gede: 25GB storage + 25GB bandwidth per bulan. Buat
kebutuhan kursus ini sampai portfolio pribadi, itu udah lebih dari cukup.
Kalau kalian nyari alternatif yang API-nya lebih 'Next.js-native' dan lebih
simpel, ada juga UploadThing — tapi hari ini kita fokus ke Cloudinary dulu
karena lebih general-purpose dan populer di industri."

---

## Slide 2 — Kenapa Cloud Storage Wajib untuk Production?

**Durasi:** 5 menit

**Script:**

"Sebelum ngoding, saya mau bener-bener nekenin KENAPA local storage itu gak
bisa dipakai di production. Ada 5 masalah besar, dan Cloudinary nyelesain
semuanya:

1. **Vercel filesystem gak persistent** — udah kita bahas di Bab 1, tiap
   deployment baru, file kalian ilang. Cloud storage nyimpen file-nya
   independent dari deployment kalian, jadi aman.
2. **Serverless bisa spawn banyak instance** — kalau traffic tinggi, Vercel
   bisa jalanin beberapa instance server kalian sekaligus secara paralel.
   Kalau upload ditulis ke disk lokal instance A, instance B gak bakal bisa
   baca file itu! Dengan cloud storage, semua instance akses satu sumber
   yang sama.
3. **Butuh CDN buat performa global** — kalau user kalian ada di Singapura
   tapi server kalian di US, loading gambar bakal lambat. Cloudinary punya
   CDN built-in di 100+ Point of Presence di seluruh dunia.
4. **Perlu resize/compress gambar** — biasanya ini butuh library tambahan
   kayak `sharp` yang kalian jalanin manual. Cloudinary bisa transform
   on-the-fly cuma lewat parameter URL, gak perlu proses apa-apa di server
   kalian.
5. **Backup dan durability** — kalau server kalian down atau disk-nya
   corrupt, file local ilang semua. Cloudinary punya 99.9% uptime dan
   backup multi-region.

Jadi kesimpulannya: local storage itu oke buat belajar dan development, tapi
begitu mau serius ke production, cloud storage itu WAJIB, bukan opsional."

---

## Slide 3 — Setup Cloudinary: lib/cloudinary.ts + Upload Action

**Durasi:** 12 menit

**Script:**

"Yuk kita setup Cloudinary di project kita. Langkah pertama, kalian perlu
akun Cloudinary — buka [cloudinary.com](https://cloudinary.com), daftar gratis,
nanti kalian dapet 3 credential penting dari dashboard: **Cloud Name**,
**API Key**, dan **API Secret**.

Nah ini poin PALING PENTING dari slide ini, saya ulang dua kali: API Secret
itu JANGAN PERNAH kalian kasih prefix `NEXT_PUBLIC_`. Kenapa? Karena semua
env variable yang diprefix `NEXT_PUBLIC_` itu di-bundle ke JavaScript yang
dikirim ke browser — artinya siapapun yang buka DevTools bisa liat API
Secret kalian mentah-mentah. Itu setara kayak nempelin password database di
pintu depan rumah kalian. API Secret harus tetap jadi env variable biasa,
yang cuma bisa diakses di server."

### 🖥️ Live Coding

1. Install SDK Cloudinary buat Node.js:

   ```bash
   bun add cloudinary
   ```

2. Tambahkan credential ke `.env` (isi dengan punya kalian sendiri dari
   dashboard Cloudinary, jangan asal ketik):

   ```bash
   # Cloudinary credential — isi dari dashboard cloudinary.com (Settings > Access Keys)
   # JANGAN diprefix NEXT_PUBLIC_, ini rahasia dan cuma boleh dipakai di server!
   CLOUDINARY_CLOUD_NAME=""
   CLOUDINARY_API_KEY=""
   CLOUDINARY_API_SECRET=""
   ```

   Jangan lupa tambahkan placeholder yang sama ke `.env.example` (tanpa nilai
   asli) biar teman satu tim tau env apa aja yang perlu mereka isi sendiri.

3. Buat `lib/cloudinary.ts` — satu file konfigurasi yang dipanggil sekali,
   plus helper `uploadImage` yang encapsulate logic convert + upload:

   ```ts
   // lib/cloudinary.ts
   import { v2 as cloudinary } from "cloudinary";

   cloudinary.config({
     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
     api_key: process.env.CLOUDINARY_API_KEY,
     api_secret: process.env.CLOUDINARY_API_SECRET,
   });

   export async function uploadImage(
     file: File,
     options: { folder: string; publicId?: string },
   ): Promise<{ url: string }> {
     const buffer = Buffer.from(await file.arrayBuffer());
     const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`;

     const result = await cloudinary.uploader.upload(dataUri, {
       folder: options.folder,
       public_id: options.publicId,
       overwrite: true,
     });

     return { url: result.secure_url };
   }

   export { cloudinary };
   ```

   Perhatiin alurnya: `File` → `arrayBuffer()` (ini kita udah kenal dari Bab
   1!) → dibungkus jadi `Buffer` → di-encode jadi **base64** → digabung jadi
   satu string **data URI** (`data:image/png;base64,....`). Cloudinary SDK
   nerima data URI ini langsung sebagai parameter `file` di
   `cloudinary.uploader.upload()` — gak perlu nulis ke disk sama sekali,
   beda banget sama pola local storage kemarin.

4. Terakhir, kasih tau `next/image` supaya boleh nge-load gambar dari domain
   Cloudinary. Tambahkan `images.remotePatterns` di `next.config.ts`:

   ```ts
   // next.config.ts
   import type { NextConfig } from "next";

   const nextConfig: NextConfig = {
     cacheComponents: true,

     cacheLife: {
       blog: {
         stale: 3600,
         revalidate: 900,
         expire: 86400
       }
     },

     images: {
       remotePatterns: [
         {
           protocol: "https",
           hostname: "res.cloudinary.com",
         },
       ],
     },
   };

   export default nextConfig;
   ```

   > Ini bukan basa-basi — di Next.js versi ini, `next/image` BAKAL nolak
   > render gambar dari domain eksternal yang gak terdaftar di
   > `remotePatterns`. Tanpa config ini, avatar dari Cloudinary gak bakal
   > muncul kalau kalian render pakai `<Image>` (kalau masih pakai `<img>`
   > biasa kayak di live-coding kita, ini gak wajib — tapi tetep best
   > practice buat disiapin dari awal).

**Test manual:**

- Pastikan `.env` udah keisi credential Cloudinary asli punya kalian.
- `bunx tsc --noEmit` — harusnya gak ada error baru dari `lib/cloudinary.ts`.
- Kita belum test upload beneran di slide ini — itu nyusul di Slide 4 pas
  udah ada Server Action dan form-nya.

---

## Slide 4 — Pattern Avatar Upload: Full Flow

**Durasi:** 15 menit

**Script:**

"Sekarang kita rangkai semuanya jadi satu fitur nyata: **upload avatar**.
Ini pattern yang bakal sering banget kalian pakai — profile picture, foto
produk, logo perusahaan, dll. Alurnya ada 5 langkah, saya sebut 'Full Flow':

**Auth → Validasi → Upload Cloudinary → Simpan URL ke DB → Revalidate**

1. **Auth** — pastikan yang manggil action ini beneran user yang login.
   Server Action itu endpoint yang reachable oleh siapapun yang bisa POST
   ke halaman itu, jadi kita HARUS cek session di dalam action, bukan cuma
   ngandelin 'form-nya kan cuma muncul kalau udah login'.
2. **Validasi** — cek tipe file (harus gambar) dan ukuran (jangan sampe
   user upload file 50MB).
3. **Upload ke Cloudinary** — pakai `uploadImage` yang kita bikin di Slide
   3. Kita taro di folder `avatars`, dan `public_id`-nya kita set = user ID
   mereka sendiri. Kenapa? Supaya tiap kali user ganti avatar, otomatis
   nimpa (`overwrite: true`) avatar lama mereka — gak numpuk file baru
   setiap kali ganti foto profil.
4. **Simpan URL ke DB** — setelah Cloudinary balikin URL hasil upload,
   kita update kolom `image` di tabel `User` (field ini udah ada dari
   Better Auth, `prisma/schema.prisma` baris 33).
5. **Revalidate** — setelah data di DB berubah, kita panggil
   `revalidatePath` supaya Server Component yang nampilin avatar ikut
   refresh dan user langsung liat avatar barunya, gak perlu refresh manual."

### 🖥️ Live Coding

Kita taro fitur ini di `app/dashboard/settings/` — halaman itu udah ada
pola guard-session-dengan-Suspense (`SettingsGuard`), jadi kita tinggal
nambahin di situ, gak perlu bikin dari nol.

1. Buat Server Action `updateAvatarAction` di
   `app/dashboard/settings/avatar-action.ts`:

   ```ts
   // app/dashboard/settings/avatar-action.ts
   "use server";

   import { headers } from "next/headers";
   import { revalidatePath } from "next/cache";
   import { auth } from "@/lib/auth";
   import { db } from "@/lib/db";
   import { uploadImage } from "@/lib/cloudinary";
   import { ActionResult } from "@/lib/validation/action-result";

   const MAX_SIZE = 2 * 1024 * 1024; // 2MB

   export async function updateAvatarAction(
     _prevState: ActionResult<{ url: string }> | null,
     formData: FormData,
   ): Promise<ActionResult<{ url: string }>> {
     const session = await auth.api.getSession({ headers: await headers() });

     if (!session) {
       return { success: false, message: "Unauthorized" };
     }

     const file = formData.get("avatar");

     if (!(file instanceof File) || file.size === 0) {
       return { success: false, message: "Pilih gambar terlebih dahulu" };
     }

     if (!file.type.startsWith("image/")) {
       return { success: false, message: "File harus berupa gambar" };
     }

     if (file.size > MAX_SIZE) {
       return { success: false, message: "Ukuran gambar maksimal 2MB" };
     }

     try {
       const { url } = await uploadImage(file, {
         folder: "avatars",
         publicId: session.user.id, // key by user id -> overwrite selalu ganti avatar lama
       });

       await db.user.update({
         where: { id: session.user.id },
         data: { image: url },
       });

       revalidatePath("/dashboard/settings");

       return { success: true, data: { url } };
     } catch (error) {
       return { success: false, message: "Gagal upload avatar" };
     }
   }
   ```

   > Catetan soal `session.user.image`: kita gak perlu query database
   > terpisah buat baca avatar user yang lagi login — Better Auth udah
   > nyertain field `image` langsung di object `session.user`, karena itu
   > memang kolom bawaan dari skema User-nya Better Auth.

2. Buat `AvatarUploadForm.tsx` — form client dengan preview instan pakai
   `URL.createObjectURL` (jadi user langsung liat gambar yang dia pilih,
   SEBELUM upload selesai):

   ```tsx
   // app/dashboard/settings/AvatarUploadForm.tsx
   "use client";

   import { useActionState, useEffect, useState } from "react";
   import { toast } from "sonner";
   import { updateAvatarAction } from "./avatar-action";

   export function AvatarUploadForm({
     currentAvatarUrl,
   }: {
     currentAvatarUrl?: string | null;
   }) {
     const [state, formAction, isPending] = useActionState(updateAvatarAction, null);
     const [preview, setPreview] = useState<string | null>(null);

     useEffect(() => {
       if (state?.success) {
         toast.success("Avatar berhasil diperbarui");
       } else if (state && !state.success && state.message) {
         toast.error(state.message);
       }
     }, [state]);

     function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
       const file = e.target.files?.[0];
       if (file) {
         setPreview(URL.createObjectURL(file));
       }
     }

     const displayUrl = (state?.success ? state.data.url : null) ?? preview ?? currentAvatarUrl;

     return (
       <form action={formAction} className="space-y-3 border rounded-lg p-4">
         {displayUrl && (
           // eslint-disable-next-line @next/next/no-img-element
           <img
             src={displayUrl}
             alt="Avatar"
             className="w-24 h-24 rounded-full object-cover border"
           />
         )}

         <input
           type="file"
           name="avatar"
           accept="image/*"
           onChange={handleFileChange}
           className="block"
         />

         <button
           type="submit"
           disabled={isPending}
           className="bg-slate-900 text-white px-4 py-2 rounded disabled:opacity-50"
         >
           {isPending ? "Mengupload..." : "Update Avatar"}
         </button>
       </form>
     );
   }
   ```

   > `preview` (dari `URL.createObjectURL`) itu instan, jalan di browser,
   > gak nunggu server. `state.data.url` (dari hasil action) itu URL asli
   > dari Cloudinary yang muncul SETELAH upload sukses. Urutan prioritas di
   > `displayUrl` sengaja: hasil upload paling baru > preview lokal >
   > avatar yang udah ada duluan di DB.

3. Wire komponen ini ke `SettingsGuard` yang udah ada di
   `app/dashboard/settings/page.tsx`:

   ```tsx
   // app/dashboard/settings/page.tsx
   import { auth } from "@/lib/auth"
   import { headers } from "next/headers"
   import { redirect } from "next/navigation";
   import { Suspense } from "react";
   import { AvatarUploadForm } from "./AvatarUploadForm";

   async function SettingsGuard() {
     const session = await auth.api.getSession({
       headers: await headers()
     });

     if (!session) {
       redirect("/login");
     }

     return (
       <div className="space-y-4">
         <h2>Settings Dashboard</h2>

         <div>
           <h3 className="font-medium mb-2">Avatar</h3>
           <AvatarUploadForm currentAvatarUrl={session.user.image} />
         </div>
       </div>
     )
   }

   export default function SettingsDashboard() {
     return (
       <Suspense fallback={<p>Memuat setting dashboard ...</p>}>
         <SettingsGuard/>
       </Suspense>
     )
   }
   ```

**Test manual:**

- `bun dev`, register/login dulu (`/register` kalau belum punya akun), lalu
  buka `/dashboard/settings`.
- Pilih gambar di form Avatar — preview harus LANGSUNG muncul (belum submit,
  ini murni `URL.createObjectURL` di browser).
- Klik "Update Avatar" — kalau `.env` Cloudinary udah keisi credential asli:
  toast "Avatar berhasil diperbarui" muncul, dan gambar yang tampil berubah
  jadi URL `https://res.cloudinary.com/...`.
- Buka dashboard Cloudinary kalian (Media Library) — harus ada folder
  `avatars/` dengan 1 file bernama sama persis dengan user ID kalian.
- Upload avatar KEDUA kalinya — cek lagi Media Library, jumlah file di
  folder `avatars/` harus TETAP SAMA (bukan nambah), karena `overwrite:
  true` + `public_id` yang sama bikin file lama ketimpa.
- Kalau `.env` Cloudinary BELUM diisi (kosong): submit tetap gak boleh
  nge-crash halaman — harus balik toast error "Gagal upload avatar" dengan
  status HTTP 200 di response Server Action-nya (bukan 500), karena
  `try/catch` di `updateAvatarAction` nangkep error dari Cloudinary API.
- Coba upload file bukan gambar (`.txt`) — toast harus muncul "File harus
  berupa gambar", tanpa manggil Cloudinary sama sekali.
- Coba upload gambar di atas 2MB — toast harus muncul "Ukuran gambar
  maksimal 2MB".
- Coba akses `/dashboard/settings` dalam kondisi logout — harus keredirect
  ke `/login` (ini behavior lama dari `SettingsGuard`, pastiin gak keganggu
  sama perubahan kita).

---

## Slide 5 — Kuis: Evaluasi Pemahaman

**Durasi:** 5 menit

**Script:**

"Sebelum lanjut ke tugas mandiri, kita cek dulu pemahaman kalian."

**Q1 — Mengapa API secret Cloudinary TIDAK boleh diprefix NEXT_PUBLIC_?**

- A) Akan error saat build
- **B) NEXT_PUBLIC_ expose ke browser bundle — API secret hanya boleh di
  server** ✅
- C) Cloudinary tidak terima public vars

*Pembahasan buat disampaikan:* "Jawabannya B. Ini murni soal keamanan.
`NEXT_PUBLIC_` itu instruksi ke Next.js: 'bundle variable ini ke JavaScript
yang dikirim ke browser'. Kalau API Secret kalian ke-bundle ke situ, siapa
aja yang buka DevTools browser bisa liat dan pakai credential kalian buat
upload/hapus file di akun Cloudinary kalian. Gak ada hubungannya sama
error build atau Cloudinary nolak — murni soal exposure."

**Q2 — Bagaimana cara mengupload File ke Cloudinary dari Server Action?**

- A) Pass file.path langsung
- **B) Convert ke base64 data URI → cloudinary.uploader.upload(dataUri,
  options)** ✅
- C) Pakai fetch() ke Cloudinary API

*Pembahasan buat disampaikan:* "Jawabannya B, persis kayak yang kita tulis
di `lib/cloudinary.ts`. `File` gak punya `.path` di server (beda sama
Node.js `multer` yang biasa nyimpen file ke disk dulu) — kita convert
`arrayBuffer()` jadi `Buffer`, encode base64, gabung jadi data URI string,
baru dikasih ke `cloudinary.uploader.upload()`. Opsi C (`fetch()` manual)
sebenernya BISA secara teknis kalau kalian mau manggil REST API Cloudinary
langsung, tapi itu bukan cara yang direkomendasikan — SDK resmi udah handle
signing, retry, dan error handling buat kalian."

**Q3 — Setelah updateAvatar berhasil dan URL disimpan ke DB, apa yang perlu
dilakukan?**

- A) Tidak perlu apa-apa
- **B) revalidatePath atau revalidateTag agar Server Components yang
  tampil avatar ikut refresh** ✅
- C) window.location.reload()

*Pembahasan buat disampaikan:* "Jawabannya B. Next.js nge-cache render
Server Component. Kalau kalian update data di database tapi gak bilang ke
Next.js 'data ini berubah, tolong render ulang', user bakal tetep liat
avatar lama sampai cache-nya kedaluwarsa sendiri. `window.location.reload()`
(opsi C) itu solusi kasar — nge-reload SELURUH halaman dari nol, ilangin
semua state React yang lagi jalan, padahal `revalidatePath` bisa bikin
Server Component refresh data-nya doang tanpa full page reload."

---

## Slide 6 — Tugas Mandiri (Homelab)

**Durasi:** 3 menit (pengantar; pengerjaan mandiri di luar sesi)

**Script:**

"Sama kayak modul sebelumnya, semua yang saya minta di homelab ini udah
kita kerjain bareng-bareng barusan. Latihan ulang dari nol tanpa liat contoh
dulu, baru cocokin — itu yang bikin ilmu ini bener-bener nempel."

- **01 — Cloudinary Setup**: Buat akun cloudinary.com (free). Copy
  credentials ke `.env`. `bun add cloudinary`. Buat `lib/cloudinary.ts`
  dengan `cloudinary.config()`. → **Sudah kita bikin di [Slide 3 — Live
  Coding](#slide-3--setup-cloudinary-libcloudinaryts--upload-action),
  langkah 1-3.**

- **02 — Upload Helper**: Buat fungsi `uploadImage(file: File):
  Promise<{url: string}>` di `lib/cloudinary.ts` yang encapsulate convert +
  upload logic. → **Sudah kita bikin di [Slide 3 — Live
  Coding](#slide-3--setup-cloudinary-libcloudinaryts--upload-action),
  langkah 3** — fungsi `uploadImage`.

- **03 — Avatar Action**: Buat `updateAvatar` Server Action: auth →
  validasi tipe+ukuran → upload folder `'avatars'` dengan
  `overwrite: true` → update DB → `revalidatePath`. → **Sudah kita bikin di
  [Slide 4 — Live
  Coding](#slide-4--pattern-avatar-upload-full-flow), langkah 1**
  (`app/dashboard/settings/avatar-action.ts`, fungsi
  `updateAvatarAction`).

- **04 — Preview Form**: Buat `AvatarUploadForm`: file input + preview
  (`URL.createObjectURL`) + submit + tampilkan hasil upload dari server. →
  **Sudah kita bikin di [Slide 4 — Live
  Coding](#slide-4--pattern-avatar-upload-full-flow), langkah 2**
  (`AvatarUploadForm.tsx`).

"Reminder dari slide: tambahkan `res.cloudinary.com` ke
`images.remotePatterns` di `next.config.ts` supaya `next/image` bisa load
URL Cloudinary — sudah kita bikin juga di langkah 4, Slide 3. Jalanin lagi
checklist 'Test manual' di akhir Slide 4 secara mandiri sebagai latihan."

---

## Slide 7 — Rangkuman

**Durasi:** 3 menit

**Script:**

"Rekap Bab 2:

- Cloud storage WAJIB buat production — filesystem Vercel gak persistent,
  itu alasan utamanya.
- `bun add cloudinary`. `lib/cloudinary.ts` buat konfigurasi sekali.
  Kredensial JANGAN pernah diprefix `NEXT_PUBLIC_`.
- Alur upload: `File` → `arrayBuffer()` → base64 data URI →
  `cloudinary.uploader.upload()`. Gak ada tulis ke disk sama sekali, beda
  total sama pola local storage.
- `public_id` unik (kita pakai user ID) + `overwrite: true` buat avatar —
  otomatis ganti gambar lama, gak numpuk file baru tiap kali user ganti
  foto profil.
- Setelah update DB, WAJIB `revalidatePath`/`revalidateTag` supaya Server
  Component yang nampilin avatar ikut refresh — kalau lupa, user bakal
  liat avatar lama sampai cache kedaluwarsa sendiri.

Selanjutnya, di Bab 3, kita bakal perkuat validasi file kita pakai Zod —
biar validasi tipe, ukuran, sampai dimensi gambar itu lebih terstruktur dan
gampang di-reuse. Sampai ketemu di modul berikutnya, gaes!"
