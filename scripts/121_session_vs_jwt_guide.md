# Script Presentasi & Panduan Mengajar - Modul 12 (Bagian 1): Session vs JWT & Auth Landscape 2026

Dokumen ini berisi panduan untuk Anda sebagai instruktur dalam membawakan pengantar materi Autentikasi dan Otorisasi (Modul 12). 

_Catatan: Modul ini murni bersifat teoretis sebagai fondasi sebelum masuk ke tahap setup koding di bab selanjutnya._

---

## Bagian 1: Script Presentasi (Slide per Slide)

**Slide 1: Session vs JWT & Auth Landscape 2026**
"Halo semuanya! Selamat datang di Modul 12: Authentication & Authorization. Sebelum kita ngoding dan mengunci aplikasi kita, kita harus memahami dulu fondasinya. Hari ini kita akan membahas dua strategi utama dalam autentikasi: Session dan JWT. Serta, kita akan melihat _landscape_ library autentikasi apa saja yang populer di tahun 2026, dan mengapa kita memilih Better Auth."

**Slide 2: Session vs JWT — Perbandingan Mendalam**
"Mari kita bandingkan dua kubu besar ini:
**Session-Based:** Keunggulan utamanya adalah keamanan yang tinggi karena _state_ disimpan di _server_ (database). Kita bisa melakukan _revoke_ (mencabut akses) secara instan, misalnya saat _user_ logout atau ada aktivitas mencurigakan. Kekurangannya? Setiap kali ada _request_, server harus mengecek ke database.
**JWT (JSON Web Token):** Token ini bersifat _stateless_. Artinya, server tidak perlu mengecek database untuk tahu siapa _user_-nya (karena infonya ada di dalam token). Sangat cepat dan cocok untuk _microservices_. Tapi bahayanya, jika token dicuri, *attacker* bisa memakainya sampai token itu _expired_. Sulit sekali melakukan _revoke_ instan pada JWT murni.
Untuk aplikasi web standar seperti kita, **Session** sangat direkomendasikan karena jauh lebih aman dan kontrolnya penuh."

**Slide 3: Auth Landscape 2026 — Pilih yang Tepat**
"Di tahun 2026 ini, ada tiga raksasa library Auth:
1. **Clerk:** Paling cepat setup-nya, berbasis SaaS. Tapi Anda tidak punya kontrol penuh atas data _user_ (data ada di server Clerk) dan berbayar per-_user_ jika sudah skala besar.
2. **Auth.js v5:** (Dulunya NextAuth). Sangat stabil dan banyak tutorialnya. Cocok untuk proyek *legacy*. Tapi kurang *TypeScript-safe*.
3. **Better Auth:** Bintang baru yang jadi standar di 2026! *TypeScript-first*, gratis (*open source*), kontrol penuh karena data disimpan di database kita sendiri, dan punya ekosistem *plugin* yang luar biasa kuat (seperti 2FA, RBAC, dll).
Inilah alasan kuat mengapa kursus kita akan menggunakan **Better Auth**!"

**Slide 4: Evaluasi Pemahaman (Kuis)**
"Waktunya tes pemahaman!
Q1: Mengapa Session lebih aman dari JWT untuk _revoke_? Jawabannya **B**! Session bisa langsung di-*blacklist* di DB, sedangkan JWT murni tidak bisa ditarik sebelum kedaluwarsa.
Q2: Mana library rekomendasi kursus ini? Tentu saja **B**! Better Auth.
Q3: Kapan JWT lebih tepat dipilih? Jawabannya **B**. Untuk arsitektur _microservices_ atau _mobile app_ terpisah yang butuh token _stateless_ portabel."

**Slide 5: Rangkuman**
"Sebagai penutup:
- Kita pilih **Session** karena bisa ditarik secara instan dan lebih cocok untuk Web App kita.
- Kita pilih **Better Auth** karena *TypeScript-native* dan memberikan kita 100% kontrol penuh atas database kita.
- Persiapkan diri kalian, karena di sesi berikutnya (Bab 2), kita akan langsung melakukan instalasi dan setup Better Auth dengan Prisma Adapter!"

---

## Bagian 2: Panduan Live Coding
**TIDAK ADA LIVE CODING PADA MODUL INI.**
Materi ini difokuskan sepenuhnya pada arsitektur perangkat lunak dan keputusan desain (*decision making*) sebelum mulai menulis kode keamanan aplikasi. 
Persiapan *Live coding* (Setup Better Auth, modifikasi `schema.prisma`, dan koneksi database) akan dilakukan sepenuhnya di bab selanjutnya.
