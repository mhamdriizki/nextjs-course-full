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
