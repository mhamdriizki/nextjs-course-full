# Script Presentasi & Panduan Live Coding - Modul 10: Validasi, Error Handling & Status Codes

Dokumen ini berisi script panduan untuk Anda sebagai instruktur dalam membawakan materi Modul 10 mengenai Validasi, Error Handling, dan Status Codes di API Routes, beserta panduan instruksi _live coding_ langkah demi langkah.

---

## Bagian 1: Script Presentasi (Slide per Slide)

**Slide 1: Validasi, Error Handling & Status Codes**
"Halo semuanya! Melanjutkan materi kita tentang API Routes, sekarang kita akan masuk ke topik yang krusial untuk membuat API level _production_: Validasi, Error Handling, dan penggunaan Status Codes yang tepat. API yang baik bukan hanya yang bisa menyimpan data, tapi juga bisa memvalidasi input, memberikan pesan error yang informatif, dan menggunakan HTTP status code yang standar."

**Slide 2: Pola Validasi di Route Handler**
"Di Next.js, ada satu pola andalan untuk menangani API request yang kokoh: Kombinasi Zod, blok `try/catch`, dan pengembalian status code yang spesifik. Langkah pertama: selalu _parse_ body menggunakan `try/catch` untuk menangkap JSON yang _malformed_. Kedua: validasi menggunakan Zod dan kembalikan error 422 jika gagal. Ketiga: bungkus operasi database dengan `try/catch` untuk mencegah server mati karena error yang tidak terduga, lalu kembalikan status 500."

**Slide 3: HTTP Status Codes — Cheat Sheet**
"Sebagai developer API, kalian wajib hafal _cheat sheet_ ini!
- **200 OK**: Untuk GET atau operasi sukses umum.
- **201 Created**: Khusus saat POST berhasil membuat data baru.
- **204 No Content**: Untuk DELETE yang sukses dan tidak butuh mengembalikan data.
- **400 Bad Request**: Kalau request yang masuk cacat, misal JSON-nya rusak.
- **401 & 403**: Untuk masalah otentikasi dan otorisasi.
- **404 Not Found**: Datanya tidak ada.
- **422 Unprocessable**: Saat JSON-nya valid, tapi isinya melanggar aturan bisnis (misal email salah format).
- **500 Server Error**: Server kita yang bermasalah, database down, atau ada _bug_."

**Slide 4: Error Handler Helper — DRY Error Responses**
"Seringkali kita menulis `NextResponse.json({ error: ... }, { status: ... })` berulang-ulang di setiap _route_. Ini melanggar prinsip DRY (Don't Repeat Yourself). Solusinya: kita buat satu file _helper_ khusus, misal `lib/api-response.ts`, yang berisi fungsi-fungsi kecil untuk setiap status code. Dengan begini, kode di _Route Handler_ kita akan jauh lebih bersih dan seragam."

**Slide 5: Evaluasi Pemahaman (Kuis)**
"Mari kita tes!
Q1: JSON malformed, status code apa yang tepat? Yak, betul B, 400 Bad Request.
Q2: Apa bedanya 400 dan 422? Jawabannya B. 400 itu cacat secara struktur request, sedangkan 422 cacat secara validasi konten/bisnis.
Q3: Boleh tidak detail error database dikirim ke client? Jawabannya B, TIDAK BOLEH! Itu risiko keamanan. Log detailnya di server, kirim pesan umum ke client."

**Slide 6: Tugas Mandiri / Home Lab**
"Waktunya beraksi! Kita akan melakukan _refactoring_ pada API Posts yang sudah kita buat sebelumnya.
1. Kita akan buat file `lib/api-response.ts`.
2. Kita refactor `app/api/posts/route.ts` untuk menggunakan helper tersebut dan melengkapinya dengan blok `try/catch`.
3. Kita akan menguji berbagai macam kasus error menggunakan alat seperti CURL atau Postman.
4. Sebagai bonus, kita akan membuat _middleware_ untuk melakukan logging request."

**Slide 7: Rangkuman**
"Ringkasannya: Selalu ingat 3 lapis error: JSON Parse (400), Zod Validation (422), dan DB Error (500). Gunakan _helper_ untuk DRY, dan ingat _golden rule_ di production: jangan pernah mengekspos _stack trace_ atau error database ke client!
Mari kita buka editor dan mulai _refactoring_!"

---

## Bagian 2: Instruksi Live Coding (Langkah-demi-Langkah)

### Langkah 1: Membuat API Response Helper
_Jelaskan bahwa helper ini akan membuat kode kita rapi._
**Buat file:** `lib/api-response.ts`

```typescript
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

// Success responses
export const ok = (data: unknown) => NextResponse.json(data, { status: 200 });
export const created = (data: unknown) => NextResponse.json(data, { status: 201 });
export const noContent = () => new NextResponse(null, { status: 204 });

// Error responses
export const badRequest = (msg = 'Bad request') => NextResponse.json({ error: msg }, { status: 400 });
export const unauthorized = (msg = 'Unauthorized') => NextResponse.json({ error: msg }, { status: 401 });
export const forbidden = (msg = 'Forbidden') => NextResponse.json({ error: msg }, { status: 403 });
export const notFound = (resource = 'Resource') => NextResponse.json({ error: `${resource} not found` }, { status: 404 });
export const unprocessable = (errors: unknown) => NextResponse.json({ errors }, { status: 422 });
export const serverError = (msg = 'Internal server error') => NextResponse.json({ error: msg }, { status: 500 });

// Zod error handler
export const zodError = (err: ZodError) => unprocessable(err.flatten().fieldErrors);
```

### Langkah 2: Refactor Route Handler
_Jelaskan penerapan try/catch 3 lapis (JSON Parse, Validation, Database)._
**Update file:** `app/api/posts/route.ts`

```typescript
import { getOrCreateDemoAuthor } from "@/lib/data/user";
import { db } from "@/lib/db";
import { createPostSchema, postsQuerySchema } from "@/lib/validation/post";
import { NextRequest } from "next/server";
import { ok, created, badRequest, serverError, zodError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const query = postsQuerySchema.safeParse(params);

    if (!query.success) {
      return zodError(query.error);
    }

    const { page, limit, q } = query.data;

    const where = {
      published: true,
      deletedAt: null,
      ...(q ? { title: { contains: q, mode: "insensitive" as const }}: {})
    };

    const [posts, total] = await db.$transaction([
      db.post.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true, slug: true, excerpt: true}
      }),
      db.post.count({where})
    ]);

    return ok({ posts, total, page, limit });
  } catch (error) {
    console.error("GET /api/posts error:", error); // Log di server
    return serverError(); // Kirim pesan generik ke client
  }
}

export async function POST(req: NextRequest) {
  let body: unknown;
  
  // Lapis 1: JSON Parsing Error (400)
  try {
    body = await req.json();
  } catch (error) {
    return badRequest("Invalid JSON body");
  }

  // Lapis 2: Validation Error (422)
  const validated = createPostSchema.safeParse(body);
  if (!validated.success) {
    return zodError(validated.error);
  }

  // Lapis 3: Database / Server Error (500)
  try {
    const author = await getOrCreateDemoAuthor();
    const post = await db.post.create({
      data: { ...validated.data, authorId: author.id}
    });

    return created(post);
  } catch (error) {
    console.error("POST /api/posts error:", error);
    return serverError();
  }
}
```

### Langkah 3: Middleware Logging
_Menambahkan request logging secara terpusat._
**Buat/Update file:** `middleware.ts` (di root project)

```typescript
import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const url = req.nextUrl.pathname;
  const method = req.method;
  
  console.log(`[API Request] ${method} ${url}`);
  
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

### Langkah 4: Testing Error Cases
_Minta peserta membuka Postman/CURL dan menguji URL berikut:_
1. Kirim string bukan JSON ke POST `/api/posts`. Harapan: `400 Bad Request`.
2. Kirim JSON kosong `{}` ke POST `/api/posts`. Harapan: `422 Unprocessable` dengan Zod errors.
3. Kirim GET `/api/posts?limit=abc`. Harapan: `422 Unprocessable` (jika menggunakan Zod strict pada param).
4. Matikan database / ganti URL koneksi sementara. Harapan: log merah di terminal server, tapi client menerima JSON bersih `{ "error": "Internal server error" }` dengan status `500`.
