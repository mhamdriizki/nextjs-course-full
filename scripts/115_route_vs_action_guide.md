# Script Presentasi & Panduan Mengajar - Modul 11 (Bagian 3): Route Handler vs Server Action

Dokumen ini berisi script panduan untuk Anda sebagai instruktur dalam membawakan materi perbandingan antara Route Handler dan Server Action, kapan harus menggunakan yang satu dan yang lainnya.

---

## Bagian 1: Script Presentasi (Slide per Slide)

**Slide 1: Route Handler vs Server Action: Kapan Pakai Yang Mana?**
"Halo semuanya! Kita sudah belajar cara membuat API Route (Route Handler) dan kita juga sudah belajar cara membuat Server Action. Keduanya sama-sama berjalan di sisi server. Pertanyaannya sekarang: Kapan kita harus pakai Route Handler, dan kapan kita harus pakai Server Action? Pemahaman akan hal ini sangat krusial untuk membangun arsitektur aplikasi yang tepat."

**Slide 2: Perbandingan Langsung**
"Bukan tentang mana yang lebih baik, tapi mana yang sesuai *use case*.
**Route Handler** pada dasarnya adalah *public HTTP endpoint*. Karena ia punya URL (misal `/api/posts`), ia bisa dipanggil oleh siapa saja: dari *mobile app*, servis eksternal, atau integrasi pihak ketiga. Ia mendukung *CORS*, bisa mengembalikan berbagai tipe data seperti *stream* atau gambar, tapi kita harus mengatur keamanannya secara manual.
Sebaliknya, **Server Action** adalah fungsi internal khusus untuk UI Next.js kita. Ia dipanggil langsung dari komponen React, cocok untuk form, sudah punya proteksi CSRF otomatis, *type-safe* secara *end-to-end*, dan mendukung *progressive enhancement*. Server Action tidak memiliki URL spesifik yang bisa diakses publik."

**Slide 3: Decision Guide — Flowchart Sederhana**
"Untuk mempermudah, mari ikuti 3 pertanyaan ini:
1. Apakah butuh diakses dari LUAR Next.js (seperti *mobile app* atau servis eksternal)? Jika Ya, gunakan **Route Handler**.
2. Apakah ini untuk *webhook*, *OAuth callback*, atau *public API*? Jika Ya, gunakan **Route Handler**.
3. Apakah ini operasi mutasi (simpan/hapus) dari *form* atau tombol *dashboard* internal? Jika Ya, wajib gunakan **Server Action**."

**Slide 4: Use Cases**
"Mari lihat beberapa skenario nyata di proyek blog kita:
- Mengisi form buat post baru 👉 **Server Action**.
- Stripe mengirim notifikasi (*webhook*) setelah pembayaran 👉 **Route Handler**.
- Menekan tombol 'Hapus Post' di dashboard 👉 **Server Action**.
- *Mobile app* butuh daftar postingan blog kita 👉 **Route Handler**.
- Pencarian *real-time* saat mengetik (*fetch* data GET ringan) 👉 Biasanya **Route Handler** (dipanggil via SWR/React Query)."

**Slide 5: Evaluasi Pemahaman (Kuis)**
"Ayo kita uji pemahaman Anda!
Q1: *Mobile app* perlu fetch daftar posts. Gunakan? Tepat, **B) Route Handler**.
Q2: User klik 'Simpan' di form edit profil. Gunakan? Ya, **B) Server Action**.
Q3: Stripe mengirim *webhook* setelah *payment* sukses. Gunakan? Betul sekali, **B) Route Handler**."

**Slide 6: Tugas Mandiri / Home Lab**
"Sekarang giliran Anda menganalisis dan ngoding:
1. **Audit Kode:** Cek semua fungsi yang menggunakan `fetch()` di komponen klien. Bisakah diganti dengan pemanggilan langsung di *Server Component* atau dijadikan *Server Action*?
2. **Convert to Server Component:** Ubah satu komponen klien yang nge-*fetch* data internal via API menjadi *Server Component* yang langsung membaca database.
3. **Webhook Handler:** Buat *Route Handler* `POST /api/webhooks/stripe` sebagai simulasi penerima *webhook*.
4. **Mobile API:** Buat *Route Handler* publik di `GET /api/v1/posts` dengan format respons terstandarisasi untuk dikonsumsi *mobile app*."

**Slide 7: Rangkuman**
"Sebagai rangkuman: Aturan emasnya, jika operasi itu berasal dari interaksi UI internal Next.js Anda (terutama form), jadikanlah **Server Action**. Jika Anda butuh jembatan komunikasi ke sistem luar (publik, *mobile*, pihak ketiga), buatlah **Route Handler**."

---

## Bagian 2: Panduan Home Lab (Opsional untuk Live Coding)

Jika Anda ingin mendemonstrasikan tugas mandiri secara langsung, berikut adalah _cheat sheet_ untuk membuatnya:

### 1. Membuat Webhook Handler (Simulasi Stripe)
_Demonstrasi membuat Route Handler untuk servis luar._
**Buat file:** `app/api/webhooks/stripe/route.ts`

```typescript
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // 1. Validasi Signature (Hanya simulasi)
    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse payload event
    const body = await request.json();
    
    console.log(`[Stripe Webhook] Menerima event: ${body.type}`);

    // 3. Wajib mengembalikan status 200 dengan cepat agar Stripe tahu webhook berhasil
    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json({ error: "Webhook Error" }, { status: 400 });
  }
}
```

### 2. Membuat API Mobile Publik (GET /api/v1/posts)
_Demonstrasi membuat Route Handler publik dengan struktur meta._
**Buat file:** `app/api/v1/posts/route.ts`

```typescript
import { NextResponse } from "next/server";
import { getPosts } from "@/lib/data/post"; // Fungsi yang sudah kita miliki

export async function GET(request: Request) {
  // Parsing query URL
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  // Panggil database
  const result = await getPosts({ page });

  // Format respons spesifik untuk konsumsi Mobile App / Pihak ketiga
  return NextResponse.json({
    data: result.posts,
    meta: {
      page: result.currentPage,
      limit: limit,
      total: result.total,
      totalPages: result.totalPages
    }
  });
}
```
