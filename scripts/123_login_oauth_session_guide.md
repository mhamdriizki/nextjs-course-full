# Script Presentasi & Panduan Live Coding - Modul 12: Login, OAuth & Session

Dokumen ini berisi panduan untuk Anda sebagai instruktur saat membawakan materi implementasi *Login Email/Password*, *OAuth Google*, dan Manajemen Sesi dengan Better Auth.

---

## Bagian 1: Script Presentasi (Slide per Slide)

**Slide 1: Login Email/Password, OAuth & Session Management**
"Selamat datang kembali! Di modul sebelumnya kita sudah memasang 'mesin' autentikasi kita. Sekarang, saatnya membuat 'pintu masuk'-nya. Kita akan membangun form *Login* dan *Register* menggunakan Email/Password, menambahkan kemudahan *Login with Google* (OAuth), serta belajar bagaimana cara membaca sesi _user_ baik di server maupun di klien."

**Slide 2: Form Login & Register dengan Better Auth**
"Better Auth membuat proses *login* sangat ringkas. Melalui *client hook* `signIn.email()`, kita hanya perlu mengirimkan *email* dan *password* dari form React kita.
Kita bisa memadukannya dengan *state management* sederhana (useState) atau *library* seperti `react-hook-form`. Satu hal penting: setelah proses _login_ sukses, selalu panggil `router.refresh()` agar komponen-komponen server seperti *Navbar* bisa langsung mendeteksi bahwa pengguna sudah masuk."

**Slide 3: OAuth Google — Login dengan Akun Google**
"Pernahkah Anda melihat tombol 'Lanjut dengan Google'? Di balik layar, konfigurasinya seringkali rumit. Tapi dengan Better Auth, kita hanya butuh satu baris kode eksekusi: `signIn.social({ provider: 'google' })`.
Tentu saja, syaratnya kita harus mendaftarkan aplikasi kita dulu di _Google Cloud Console_ untuk mendapatkan `GOOGLE_CLIENT_ID` dan `SECRET`-nya, lalu menambahkannya di konfigurasi `auth.ts` kita. Sisanya (seperti _redirect_, _callback_, dan pembuatan *session* di database) akan di-_handle_ 100% oleh Better Auth!"

> ⚠️ **Peringatan buat instruktur:** skema tabel `account` dan `session` yang dibutuhkan Better Auth **mengikuti versi package yang terpasang**, bukan cuma dokumentasi. Jika versi `better-auth` di `package.json` di-_upgrade_, kolom yang di-_generate_ bisa berubah (misalnya kolom `issuer` yang wajib ada di tabel `account`, atau `accessTokenExpiresAt`/`refreshTokenExpiresAt` menggantikan `expiresAt` tunggal). Lihat catatan troubleshooting di Bagian 2 sebelum live coding supaya tidak kaget kalau *demo login* tiba-tiba error 500 di kelas.

**Slide 4: Session — Server Component & Logout**
"Setelah pengguna berhasil masuk, bagaimana cara kita tahu siapa dia?
Di **Server Component** (seperti halaman *Dashboard* atau *Navbar*), kita wajib menggunakan `auth.api.getSession({ headers: await headers() })`. Ini sangat aman karena membaca *cookie* langsung dari _request_ HTTP.
Sedangkan di **Client Component**, kita gunakan `useSession()`.
Untuk _Logout_, kita memanggil `signOut()` dari klien, lalu jangan lupa panggil `router.refresh()`."

**Slide 5: Evaluasi Pemahaman (Kuis)**
"Mari kita tes pemahaman Anda!
Q1: Kenapa setelah `signIn` kita perlu `router.refresh()`? Jawabannya **B**! Agar _Server Components_ di halaman itu ikut me-_render_ ulang dengan data sesi terbaru.
Q2: Cara baca sesi di Server Component? Betul sekali, **B**! Gunakan `auth.api.getSession()` yang di-_passing_ *headers*.
Q3: Bagaimana *flow* OAuth Google bekerja? Jawabannya **B**. Redirect ke Google 👉 User _Approve_ 👉 Kembali ke URL *callback* kita 👉 Better Auth membuatkan sesi di DB 👉 Redirect ke halaman tujuan."

**Slide 6: Tugas Mandiri / Home Lab**
"Waktunya praktik! Di sesi *Live Coding* ini kita akan:
1. Membuat halaman Login (`/login`) dengan form standar.
2. Membuat halaman Register (`/register`) agar _user_ baru bisa mendaftar.
3. Menambahkan tombol Google OAuth di halaman Login.
4. Memodifikasi Navbar kita agar bisa menampilkan sapaan "Halo, [Nama]" bagi _user_ yang login, lengkap dengan tombol _Logout_."

**Slide 7: Rangkuman**
"Sebagai ringkasan: Kita menggunakan `signIn.email` dan `signIn.social` untuk otentikasi klien. Kita membaca sesi menggunakan `auth.api.getSession` di server dan `useSession` di klien. Proses _logout_ sangat mudah dengan `signOut()`. Di materi selanjutnya, kita akan mulai membatasi akses halaman dengan fitur *Protected Routes*!"

---

## Bagian 2: Instruksi Live Coding (Langkah-demi-Langkah)

*(Instruksi kode dapat dilihat di aplikasi secara langsung setelah diimplementasikan).*

### Catatan Troubleshooting: "Login Selalu Error 500, Padahal `.env` Sudah Benar"

Ini adalah *gotcha* nyata yang kita temui saat menyiapkan modul ini — sengaja dicatat karena kemungkinan besar akan dialami juga oleh peserta.

**Gejala:** Baik login email/password maupun login Google sama-sama gagal dengan `500 Internal Server Error`, meskipun `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `BETTER_AUTH_SECRET`, dan `DATABASE_URL` di `.env` semuanya sudah terisi benar.

**Akar masalah:** Better Auth men-_generate_ query Prisma berdasarkan bentuk skema yang **diharapkan oleh versi package `better-auth` yang terpasang**, bukan berdasarkan `prisma/schema.prisma` kita. Kalau skema Prisma tidak mengikuti bentuk itu persis, setiap kali Better Auth mencoba `create()` baris baru di tabel `account`/`session`, Prisma akan menolak dengan error seperti `Unknown argument issuer` atau `The column account.expiresAt does not exist`.

Di kasus kita, `better-auth@1.7.1` mewajibkan model `Account` punya kolom `issuer` (wajib diisi di setiap pembuatan akun, baik _credential_ maupun _OAuth_), serta `accessTokenExpiresAt` / `refreshTokenExpiresAt` / `scope` — bukan kolom `expiresAt` tunggal seperti di contoh-contoh lama. Model `Session` juga mengenal `ipAddress` dan `userAgent`.

**Cara memperbaiki (dan mendiagnosisnya sendiri kalau terjadi lagi):**

1. Baca error di terminal `next dev` dengan teliti — Better Auth & Prisma biasanya sudah menyebutkan nama kolom yang bermasalah (`Unknown argument <nama>` atau `column ... does not exist`).
2. Bandingkan dengan skema inti Better Auth di `node_modules/@better-auth/core/dist/db/schema/account.mjs` (dan `session.mjs`, `user.mjs`, `verification.mjs`) untuk melihat field apa saja yang benar-benar dibutuhkan oleh versi yang terpasang.
3. Sesuaikan `prisma/schema.prisma` supaya field-nya cocok, lalu jalankan:
   ```bash
   npx prisma migrate dev --name align_account_session_with_better_auth
   npx prisma generate
   ```
4. **Restart dev server** setelah migrasi. Turbopack/Next dev yang sudah berjalan sebelum skema diubah akan tetap memakai Prisma Client versi lama yang di-_cache_ di memori — ini sering disalahartikan sebagai ".env salah" padahal sebenarnya cuma perlu restart.
5. Test cepat tanpa perlu buka browser:
   ```bash
   curl -i -X POST http://localhost:3000/api/auth/sign-up/email \
     -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
     -d '{"email":"test@example.com","password":"password123","name":"Test"}'
   ```
   Kalau dapat `200` dengan `set-cookie: better-auth.session_token=...`, berarti alur credential sudah beres. Login Google memakai jalur pembuatan `Account` yang sama, jadi biasanya ikut sembuh.

**Poin mengajar:** ini contoh bagus untuk menekankan ke peserta bahwa "environment variable sudah benar" tidak selalu berarti "konfigurasinya sudah benar" — banyak *auth library* generate skema database dari kode, sehingga versi package dan skema Prisma harus selalu disinkronkan setiap kali salah satunya berubah.

### Update UI: Halaman Login & Register

Halaman `/login` dan `/register` sudah dirapikan mengikuti design system shadcn yang dipakai di seluruh aplikasi (token warna `bg-card`, `text-muted-foreground`, `border-border`, dsb — bukan warna hardcode seperti `bg-blue-600` atau `text-slate-500` lagi), supaya otomatis mengikuti *dark mode*. Perubahan yang bisa didemokan:

- `app/(auth)/layout.tsx` — layout placeholder lama ("Ini Layout Authentikasi") diganti dengan shell terpusat, ada tautan kembali ke beranda, dan latar gradien lembut memakai warna brand.
- Input Email, Password (dan Nama di halaman Register) sekarang punya ikon (`@hugeicons/react`) di sisi kiri untuk memperjelas konteks field.
- Password punya tombol *show/hide* (ikon mata) sehingga user bisa memeriksa ketikannya sendiri sebelum submit.
- Tombol submit dan tombol Google menampilkan ikon *spinner* berputar saat `loading`/`googleLoading` true, bukan cuma teks "Memproses...".
- Kartu (`Card`) memakai bayangan halus (`shadow-xl shadow-foreground/5`) agar terasa mengambang di atas latar gradien.

Tidak ada perubahan pada logika `signIn.email`, `signUp.email`, atau `signIn.social` — murni pemolesan tampilan di atas alur yang sudah dijelaskan di Bagian 1.
