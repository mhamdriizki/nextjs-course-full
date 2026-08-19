# Script Presentasi & Panduan Live Coding - Modul 12: Setup Better Auth

Dokumen ini berisi panduan untuk Anda sebagai instruktur saat membawakan materi Setup Better Auth + Prisma Adapter.

---

## Bagian 1: Script Presentasi (Slide per Slide)

**Slide 1: Setup Better Auth + Prisma Adapter**
"Halo semuanya! Kita sudah sepakat memilih Better Auth sebagai solusi autentikasi kita. Hari ini kita akan langsung mengotori tangan kita. Kita akan melalui 4 langkah mudah agar Auth kita bekerja dengan baik: Install, Konfigurasi, Sinkronisasi Schema, dan pembuatan Route Handler."

**Slide 2: Install & Konfigurasi lib/auth.ts**
"Langkah pertama adalah meng-_install_ library-nya dan membuat file konfigurasi inti di `lib/auth.ts`.
Satu hal yang WAJIB saat menggunakan Better Auth di Next.js adalah *plugin* `nextCookies()`. Kenapa? Karena tanpa ini, Server Actions bawaan Next.js tidak akan bisa mengelola *cookie* sesi secara otomatis, yang akan membuat *user* selalu _logout_ saat berpindah halaman!
Kita juga membutuhkan `BETTER_AUTH_SECRET`, pastikan kita meng-generate kunci rahasia ini via terminal dan memasukkannya ke `.env`."

**Slide 3: Schema Prisma + Migration**
"Langkah kedua, database kita harus tahu tentang entitas *User* dan *Session*. Untungnya, Better Auth menyediakan *Command Line Interface* (CLI) ajaib! Cukup jalankan perintah `bunx better-auth generate`, dan *boom*, ia akan otomatis menyisipkan tabel `User`, `Session`, `Account`, dan `Verification` ke dalam `schema.prisma` kita. Setelah itu kita tinggal jalankan *migrate* seperti biasa."

**Slide 4: Route Handler & Auth Client**
"Langkah ketiga adalah membuat Route Handler. Cukup buat satu file di `app/api/auth/[...all]/route.ts`. Ini adalah *catch-all route*. Better Auth akan otomatis mencegat *request* masuk dan memetakannya ke *endpoint* internal seperti `/api/auth/sign-in` atau `/api/auth/session`.
Langkah keempat, di sisi klien, kita inisiasi file `lib/auth-client.ts`. Di sini kita men-_generate hooks_ super sakti seperti `useSession`, `signIn`, dan `signOut` yang sangat *type-safe* untuk digunakan pada komponen React kita."

**Slide 5: Evaluasi Pemahaman (Kuis)**
"Waktunya kuis singkat!
Q1: Kenapa `nextCookies()` wajib di Better Auth Next.js? Jawabannya **B**! Agar Server Actions bisa *set/read* _cookies_ dengan benar.
Q2: Di mana Route Handler Better Auth diletakkan? Betul, **B**! Di `app/api/auth/[...all]/route.ts` yang me-handle semua auth endpoint.
Q3: Apa beda `lib/auth.ts` dan `lib/auth-client.ts`? Jawabannya **B**! `auth.ts` untuk backend (Server Components/Actions), sedangkan `auth-client.ts` khusus untuk React Hooks di klien (`'use client'`)."

**Slide 6: Tugas Mandiri / Home Lab**
"Mari kita eksekusi keempat tahapan tadi di dalam proyek kita!
1. Instalasi Better Auth dan setting `lib/auth.ts`.
2. Generate schema.prisma dan lakukan migrasi DB.
3. Buat Catch-all Route Handler.
4. Buat *Auth Client* dan pasang `useSession` di halaman depan kita. Let's code!"

**Slide 7: Rangkuman**
"Sebagai ringkasan: Kita telah sukses menginstal `better-auth`, mengkonfigurasi `prismaAdapter`, mengamankan *cookie* dengan `nextCookies()`, melakukan sinkronisasi dengan Prisma, membuat *Route Handler*, dan membuat *hooks client*. Di materi selanjutnya, kita akan memanfaatkan *setup* ini untuk membuat fitur Login dengan Email & Password serta OAuth!"

---

## Bagian 2: Instruksi Live Coding (Langkah-demi-Langkah)

### Langkah 1: Instalasi & Konfigurasi Inti
_Ajak audiens menginstall dan mengonfigurasi Better Auth._

1. Buka terminal dan jalankan:
   ```bash
   bun add better-auth
   ```
2. Generate _secret key_ dan tambahkan ke `.env`:
   ```bash
   openssl rand -base64 32
   ```
   **Tambahkan di `.env`:**
   ```env
   BETTER_AUTH_SECRET="hasil_generate_di_atas"
   BETTER_AUTH_URL="http://localhost:3000"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```
3. Buat file `lib/auth.ts`:
   ```typescript
   import { betterAuth } from "better-auth"
   import { prismaAdapter } from "better-auth/adapters/prisma"
   import { nextCookies } from "better-auth/next-js"
   import { db } from "@/lib/db"

   export const auth = betterAuth({
       database: prismaAdapter(db, {
           provider: "postgresql",
       }),
       plugins: [nextCookies()],
       emailAndPassword: {
           enabled: true,
           minPasswordLength: 8,
           autoSignIn: true,
       },
   });

   export type Session = typeof auth.$Infer.Session
   ```

### Langkah 2: Sinkronisasi Schema Prisma
_Demonstrasikan betapa pintarnya CLI Better Auth merombak schema._

1. Jalankan di terminal:
   ```bash
   bunx better-auth generate
   ```
2. _(Pilih Yes / Overwrite `schema.prisma`)_
3. Tunjukkan ke audiens bahwa tabel `User`, `Session`, `Account`, dan `Verification` otomatis ditambahkan ke `prisma/schema.prisma`.
4. Eksekusi migrasi:
   ```bash
   bunx prisma migrate dev --name add_auth_tables
   ```

### Langkah 3: Route Handler Endpoint
_Jelaskan konsep catch-all route di Next.js._

1. Buat direktori & file: `app/api/auth/[...all]/route.ts`
   ```typescript
   import { auth } from "@/lib/auth";
   import { toNextJsHandler } from "better-auth/next-js";

   export const { GET, POST } = toNextJsHandler(auth);
   ```
2. Coba tes di _browser_ dengan mengunjungi `http://localhost:3000/api/auth/session` (harus mengembalikan respons JSON valid).

### Langkah 4: Menyiapkan Hooks Klien & Testing UI
_Hubungkan React dengan status autentikasi server._

1. Buat file `lib/auth-client.ts`:
   ```typescript
   import { createAuthClient } from "better-auth/react"

   export const authClient = createAuthClient({
       baseURL: process.env.NEXT_PUBLIC_APP_URL,
   })

   export const { signIn, signUp, signOut, useSession } = authClient
   ```
2. Buka `app/page.tsx` (atau layout) dan pasang `useSession` untuk mengecek apakah integrasi berhasil:
   ```tsx
   "use client"
   
   import { useSession } from "@/lib/auth-client";
   
   export default function Home() {
     const { data: session, isPending } = useSession();
     
     if (isPending) return <div>Memuat sesi...</div>;
     
     return (
       <main className="p-8">
         <h1 className="text-2xl font-bold">Homepage</h1>
         {session ? (
            <p>Selamat datang, User {session.user.id}!</p>
         ) : (
            <p>Silakan login terlebih dahulu.</p>
         )}
       </main>
     );
   }
   ```
