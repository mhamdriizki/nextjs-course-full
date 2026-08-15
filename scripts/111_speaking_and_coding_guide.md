# Script Presentasi & Panduan Live Coding - Modul 10: API Routes & Route Handlers

Dokumen ini berisi script panduan untuk Anda sebagai instruktur dalam membawakan materi Modul 10 mengenai Route Handlers, beserta panduan instruksi _live coding_ langkah demi langkah.

---

## Bagian 1: Script Presentasi (Slide per Slide)

**Slide 1: Route Handlers**
"Halo semuanya, di materi kali ini kita akan membahas fitur yang sangat kuat di Next.js App Router, yaitu Route Handlers. Ini adalah cara kita membuat REST API endpoint yang berjalan langsung di sisi server Next.js. Kita akan membahas bagaimana menangani berbagai HTTP method seperti GET, POST, PUT, PATCH, dan DELETE."

**Slide 2: Anatomi Route Handler**
"Bagaimana cara membuat API di Next.js? Sangat mudah. Kita cukup membuat file bernama `route.ts` di dalam folder `app/api/`. Nama folder ini akan menjadi URL path API kita. Misalnya, file `app/api/posts/route.ts` otomatis menjadi endpoint `/api/posts`. Di dalam file ini, kita mengekspor fungsi asinkron dengan nama HTTP method (huruf besar), misalnya `export async function GET` atau `POST`. Cukup satu file untuk menangani berbagai method!"

**Slide 3: Dynamic Route Handler — [id]**
"Bagaimana jika kita butuh endpoint dinamis, misal untuk spesifik ke satu post dengan ID tertentu? Kita gunakan _Dynamic Route_ dengan kurung siku `[id]` pada folder. Parameter ini bisa diakses lewat argumen `params`. Catatan sangat penting: mulai Next.js 16, `params` di Route Handlers adalah sebuah Promise! Jadi kita WAJIB menggunakan `await params` sebelum bisa mengakses nilainya."

**Slide 4: Query Params, Headers & Response Options**
"Untuk menangkap _query string_ seperti `?page=1`, kita gunakan `req.nextUrl.searchParams`. Kalau untuk membaca _request headers_ (misal token), gunakan `req.headers.get()`. Kemudian, saat merespons, kita menggunakan `NextResponse.json()` yang juga memungkinkan kita menyisipkan _custom HTTP status_ atau _headers_ ke dalam respons API kita."

**Slide 5: Evaluasi Pemahaman (Kuis)**
"Mari kita tes pemahaman sejenak.
Q1: Endpoint GET `/api/users` harus dibuat di mana? Betul, di B, `app/api/users/route.ts`.
Q2: Bagaimana mengakses param `[id]` di Next.js 16? Ya, jawabannya B, kita wajib melakukan `await params`.
Q3: HTTP status code untuk DELETE yang berhasil tanpa _body_? Benar, jawabannya B, yaitu 204 No Content."

**Slide 6: Tugas Mandiri / Home Lab**
"Sekarang waktunya kita _live coding_. Kita akan membuat Route Handler lengkap untuk _resource_ `posts`.
Pertama, kita akan buat GET `/api/posts` lengkap dengan _query params_. Lalu POST `/api/posts` dengan validasi Zod. Terakhir kita akan buat rute dinamis untuk melihat detail, update, dan delete sebuah post, lalu mengetesnya!"

**Slide 7: Rangkuman**
"Ringkasannya: Route Handler ada di `route.ts`. Ingat bahwa `params` adalah Promise dan wajib di-_await_. Gunakan `req.nextUrl.searchParams` untuk menangkap query param, dan satu file `route.ts` bisa melayani berbagai HTTP method sekaligus.
Mari kita buka code editor dan mulai mengoding!"

---

## Bagian 2: Instruksi Live Coding (Langkah-demi-Langkah)

Saat presentasi selesai, Anda dapat mulai memandu live coding. Berikut adalah alur dan _snippet_ kodenya:

### Langkah 1: Membuat Route /api/posts (GET & POST)

_Jelaskan kita akan membaca query parameter dan melakukan validasi POST request._
**Buat file:** `app/api/posts/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { postsQuerySchema, createPostSchema } from "@/lib/validation/post";

// GET /api/posts
export async function GET(req: NextRequest) {
  // 1. Parsing query params (page, limit, q)
  const searchParams = Object.fromEntries(req.nextUrl.searchParams);
  const query = postsQuerySchema.safeParse(searchParams);

  if (!query.success) {
    return NextResponse.json(
      { error: "Invalid query params" },
      { status: 400 },
    );
  }

  const { page, limit, q } = query.data;
  const where = q
    ? { title: { contains: q, mode: "insensitive" as const } }
    : {};

  // 2. Query ke Database dengan Prisma
  const posts = await db.post.findMany({
    skip: (page - 1) * limit,
    take: limit,
    where,
    orderBy: { createdAt: "desc" },
  });
  const total = await db.post.count({ where });

  return NextResponse.json({ posts, total, page });
}

// POST /api/posts
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Validasi Body Request menggunakan Zod Schema yang sudah disiapkan
    const validated = createPostSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.flatten().fieldErrors },
        { status: 422 },
      );
    }

    // 2. Insert ke Database
    const post = await db.post.create({
      data: {
        ...validated.data,
        // Karena ini contoh, kita hardcode authorId yang valid di sistem Anda,
        // praktiknya kita ambil dari session/token.
        authorId: "ganti-dengan-cuid-user-di-db-anda",
      },
    });

    // 3. Return 201 Created
    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}
```

### Langkah 2: Membuat Dynamic Route /api/posts/[id]

_Jelaskan bahwa di Next.js 16, params adalah Promise._
**Buat file:** `app/api/posts/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { updatePostSchema } from "@/lib/validation/post";

// GET /api/posts/:id (Single Post)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params; // Wajib await params di Next.js 16!

  const post = await db.post.findUnique({ where: { id } });

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  return NextResponse.json(post);
}

// PATCH /api/posts/:id (Partial Update)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const body = await req.json();
    const validated = updatePostSchema.safeParse({ ...body, id });

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.flatten().fieldErrors },
        { status: 422 },
      );
    }

    const { id: _, ...updateData } = validated.data;
    const updated = await db.post.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: "Update failed or Post not found" },
      { status: 404 },
    );
  }
}

// DELETE /api/posts/:id
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    await db.post.delete({ where: { id } });
    // DELETE yang sukses tanpa response body harus me-return 204
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }
}
```

### Langkah 3: Testing & Pembuktian

1. Jalankan `npm run dev`.
2. Buka browser dan arahkan ke `http://localhost:3000/api/posts` (Next.js sekarang punya tampilan JSON yang rapi bawaan). Coba tambahkan query param: `?limit=2`.
3. Buka Terminal / Postman untuk mengetes method POST dan DELETE.
   ```bash
   curl -X POST http://localhost:3000/api/posts
        -d '{"title": "Test Post"}'
        -H "Content-Type: application/json"
   ```
   (Jelaskan hasil validasinya karena data yang dikirim tidak lengkap).
4. Tekankan kembali `await params` dan HTTP Status Codes `204` saat delete.
