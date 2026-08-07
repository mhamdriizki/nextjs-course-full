# Naskah Live Demo — Modul 10 Bab 3: Validasi di Server Actions & API Routes

Durasi perkiraan 40-45 menit. Semua **sudah dieksekusi dan ditest nyata** di branch `coba-103` — termasuk lewat `curl` beneran, karena bab ini akhirnya menyentuh Route Handler (bukan Server Action), jadi testing-nya jauh lebih mudah dibanding bab-bab sebelumnya.

## Ringkasan urutan file yang diubah, dari awal sampai akhir

1. **`lib/data/user.ts`** (baru) — `getOrCreateDemoAuthor()` diekstrak jadi helper bersama, dipakai Server Action *dan* Route Handler (sebelumnya duplikat private function di `action.ts`).
2. **`app/posts/action.ts`** (edit) — import helper dari file baru, hapus duplikasi.
3. **`lib/validation/post.ts`** (edit) — tambah `postsQuerySchema` pakai `z.coerce`, khusus buat query params URL.
4. **`app/api/posts/route.ts`** (baru) — `GET` (validasi query params) + `POST` (validasi body), status code yang tepat (400/422/201).
5. Perbaikan kecil di `POST` handler setelah ketahuan lewat testing: sertakan `formErrors` selain `fieldErrors` (lihat temuan di bawah).

---

## ⚠️ Temuan nyata dari testing — bukan cuma teori kali ini, karena Route Handler bisa dites `curl`

### 1. Ini akhirnya bab yang testable penuh via `curl`

Dari Bab 6 (Modul 9) sampai sekarang, kita berkali-kali nemu "Server Action nggak bisa dites `curl`" — karena butuh protokol khusus (`Next-Action` header) yang cuma browser yang bisa generate. **Route Handler beda** — dia HTTP endpoint standar. `curl` kerja normal, persis kayak API biasa. Ini alasan kenapa banyak tim pilih bikin Route Handler terpisah buat endpoint yang perlu dikonsumsi dari luar (mobile app, third-party, automated testing), bukan cuma Server Action.

### 2. Gap nyata ditemukan lewat security test: `fieldErrors` bisa kosong walau ada error

Test `curl -X POST /api/posts` **tanpa body sama sekali**:
```bash
curl -s -X POST http://localhost:3000/api/posts -w "\nHTTP %{http_code}\n"
```
Sebelum diperbaiki, hasilnya:
```
HTTP 422
{"errors":{}}
```
**422 sudah benar** (request ditolak, sesuai keamanan) — tapi pesannya **kosong total**, nggak membantu sama sekali buat orang yang manggil API ini. Diselidiki, ternyata `createPostSchema.safeParse(null)` menghasilkan error di `formErrors` ("Invalid input: expected object, received null"), bukan di `fieldErrors` — karena masalahnya bukan di satu field spesifik, tapi di **bentuk keseluruhan body**-nya yang salah (bukan object sama sekali). Kode awal cuma ambil `fieldErrors`, jadi pesan penting ini hilang. Sudah diperbaiki — sekarang response API sertakan keduanya:
```ts
const { fieldErrors, formErrors } = flattenError(validated.error);
return NextResponse.json({ errors: fieldErrors, formErrors }, { status: 422 });
```

### 3. Regex slug di project ini strict — tidak boleh pakai tanda minus

`createPostSchema` di project ini pakai `slug: z.string()...regex(/^[a-z0-9]+$/, ...)` — **tanpa** tanda minus di character class-nya (beda dari yang saya buat di Bab 1/2 yang mengizinkan `-`). Test POST pertama sempat gagal 422 karena saya pakai slug `"post-via-api-route"` (ada tanda minus). Ini sengaja dijadikan bahan ajar: **selalu baca schema project yang sebenarnya**, jangan asumsi dari sesi/tutorial sebelumnya — tiap iterasi project bisa saja sedikit berbeda.

---

## 1. Framing pembuka (3 menit)

> "Slide judul bab ini eksplisit: 'Validasi server adalah WAJIB'. Kenapa diulang-ulang padahal kita udah pakai Zod dari Bab 1? Karena ada perbedaan penting antara 'client sudah validasi' dan 'server harus tetap validasi'. Saya mau tunjukkan langsung kenapa."

**Live-demo, langsung tunjukkan celahnya:**
> "Coba buka DevTools browser, tab Network. Form kita di `/posts` ada validasi client-side (HTML5 `required`, atau kalaupun kita tambah validasi JS). Tapi sekarang saya buka terminal, dan panggil endpoint API kita **langsung**, skip form sama sekali:"
```bash
curl -X POST http://localhost:3000/api/posts -H "Content-Type: application/json" -d '{}'
```
> "Nggak ada browser, nggak ada form, nggak ada validasi client. Kalau server nggak validasi ulang, data kosong/berbahaya bisa langsung masuk database. Ini jawaban kuis nomor 1 nanti."

---

## 2. Refactor kecil dulu — DRY-kan helper yang dipakai dua tempat (5 menit)

**Talking point, bangun kebutuhannya:**
> "Bab ini kita mau bikin dua entry point buat create post: Server Action (sudah ada dari Bab 1-2) dan Route Handler (baru). Dua-duanya butuh 'siapa penulisnya' — kita masih pakai demo author. Daripada duplikat logic itu di dua file, kita ekstrak jadi satu."

**Live-type — buat `lib/data/user.ts`:**
```ts
import { db } from "../db";

const DEMO_AUTHOR_EMAIL = "rizki@email.com";

export async function getOrCreateDemoAuthor() {
  const existing = await db.user.findFirst({ where: { email: DEMO_AUTHOR_EMAIL } });
  if (existing) return existing;
  return db.user.create({
    data: { email: DEMO_AUTHOR_EMAIL, name: "Rizki", role: "AUTHOR" },
  });
}
```

**Live-edit — `app/posts/action.ts`, hapus definisi lokal, import dari sini:**
```ts
import { getOrCreateDemoAuthor } from "@/lib/data/user";
// hapus function getOrCreateDemoAuthor() yang lama di file ini
```

---

## 3. Pattern standar validasi Server Action — review + kaitkan ke yang sudah ada (7 menit) — slide halaman 2

> "Ini sebenarnya udah persis yang kita bangun dari Bab 1-2. Saya tunjukkan lagi biar kelihatan pattern-nya eksplisit — Server Action punya lima langkah standar."

**Tunjukkan `app/posts/action.ts` yang sudah ada, bedah 5 langkahnya:**
```ts
export async function createPostAction(
  _prevState: ActionResult<CreatedPost> | null,
  formData: FormData
): Promise<ActionResult<CreatedPost>> {
  // 1. Ambil raw data dari FormData
  const result = createPostSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    excerpt: formData.get("excerpt"),
    content: formData.get("content") || undefined,
  });

  // 2. Cek validasi — JANGAN pakai .parse(), pakai .safeParse()
  if (!result.success) {
    return { success: false, errors: flattenError(result.error).fieldErrors };
  }

  // 3. result.data sudah typed dan aman
  const author = await getOrCreateDemoAuthor();
  const post = await createPost({ ...result.data, authorId: author.id });

  // 4. Invalidasi cache
  revalidatePath("/posts");

  // 5. Return hasil
  return { success: true, data: post };
}
```
> "Lima langkah ini: FormData → object mentah → `safeParse` → cek `success` → pakai `result.data` yang udah aman. Pattern ini akan kalian tulis berkali-kali di karier kalian — hafalkan urutannya, bukan cuma kodenya."

---

## 4. Route Handler — live-coding utama (15 menit) — slide halaman 3

**Live-type — tambah `postsQuerySchema` ke `lib/validation/post.ts`:**
```ts
export const postsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  q: z.string().trim().optional(),
});
```
**Talking point:**
> "`z.coerce.number()` beda dari `z.number()` biasa. Query params URL itu **selalu** string — `?page=2`, itu string `'2'`, bukan number `2`. `z.number()` biasa bakal langsung nolak karena tipe-nya salah. `z.coerce.number()` coba convert dulu (`Number('2')` → `2`), baru divalidasi sebagai number. Ini jawaban kuis nomor 2."

**Live-run — buktikan edge case-nya, jangan cuma bilang "ini aman":**
```ts
postsQuerySchema.safeParse({ page: "abc" }); // ditolak — NaN, bukan number valid
postsQuerySchema.safeParse({ page: "" });    // ditolak — Number("") = 0, gagal min(1)
postsQuerySchema.safeParse({});              // lolos — default(1) & default(10) jalan
```

**Live-type — buat `app/api/posts/route.ts`, mulai dari GET:**
```ts
export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams);
  const query = postsQuerySchema.safeParse(params);

  if (!query.success) {
    return NextResponse.json(
      { errors: flattenError(query.error).fieldErrors },
      { status: 400 }
    );
  }

  const { page, limit, q } = query.data; // typed!
  const where = {
    published: true,
    deletedAt: null,
    ...(q ? { title: { contains: q, mode: "insensitive" as const } } : {}),
  };

  const [posts, total] = await db.$transaction([
    db.post.findMany({ where, take: limit, skip: (page - 1) * limit, orderBy: { createdAt: "desc" }, select: { id: true, title: true, slug: true, excerpt: true } }),
    db.post.count({ where }),
  ]);

  return NextResponse.json({ posts, total, page, limit });
}
```

**Talking point soal status code:**
> "400 di sini artinya 'request kamu salah bentuk' — query params-nya nggak valid. Beda dari nanti di `POST`, kita pakai 422 buat body yang salah. Ini konvensi umum: 400 = malformed request secara umum, 422 = request well-formed tapi gagal validasi semantik (unprocessable entity)."

**Live-type — lanjut `POST`:**
```ts
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const validated = createPostSchema.safeParse(body);

  if (!validated.success) {
    const { fieldErrors, formErrors } = flattenError(validated.error);
    return NextResponse.json({ errors: fieldErrors, formErrors }, { status: 422 });
  }

  const author = await getOrCreateDemoAuthor();
  const post = await db.post.create({ data: { ...validated.data, authorId: author.id } });
  return NextResponse.json(post, { status: 201 });
}
```

**Talking point — `req.json().catch(() => null)`:**
> "Kenapa dibungkus `.catch()`? Kalau body yang dikirim bukan JSON valid sama sekali — misal orang iseng kirim teks biasa — `req.json()` bakal **throw**, bukan return sesuatu yang bisa di-`safeParse`. Kita tangkep itu, ubah jadi `null`, biar `createPostSchema.safeParse(null)` yang nanganin secara konsisten lewat jalur validasi yang sama, bukan lewat try/catch terpisah yang gampang kelewat."

---

## 5. Live test lewat `curl` — buktikan semuanya (10 menit)

**GET, kasus normal:**
```bash
curl "http://localhost:3000/api/posts?page=1&limit=3"
# {"posts":[...3 post...],"total":12,"page":1,"limit":3}
```

**GET, kasus invalid — sudah dites nyata:**
```bash
curl "http://localhost:3000/api/posts?page=abc"
# HTTP 400 — {"errors":{"page":["Invalid input: expected number, received NaN"]}}

curl "http://localhost:3000/api/posts?limit=999"
# HTTP 400 — {"errors":{"limit":["Too big: expected number to be <=50"]}}
```

**POST, kasus valid:**
```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{"title":"Post via API Route","slug":"postviaapiroute","excerpt":"Dibuat lewat Route Handler"}'
# HTTP 201 — post lengkap dikembalikan, termasuk id, authorId, createdAt
```

**POST, kasus invalid:**
```bash
curl -X POST http://localhost:3000/api/posts -d '{"title":"ab","slug":"x","excerpt":""}'
# HTTP 422 — {"errors":{"title":["Judul minimal 3 karakter"],"excerpt":["Ringkasan minimal 3 karakter"]}}
```

**Security test (homelab task 4) — buktikan di depan kelas:**
```bash
curl -X POST http://localhost:3000/api/posts -d '{}'
# HTTP 422 — {"errors":{},"formErrors":["Invalid input: expected object, received null"]}
```
> "Sengaja saya tunjukkan kasus ini paling akhir — ini yang tadinya **bocor** waktu saya siapkan demo. Awalnya response-nya `{"errors":{}}` doang, kosong, nggak membantu. Ternyata Zod naruh error 'bentuk keseluruhan body salah' itu di `formErrors`, bukan `fieldErrors`, karena masalahnya bukan di satu field, tapi di bentuk objek-nya sendiri (body-nya `null`, bukan object). Sekarang response API sertakan keduanya. Ini contoh nyata kenapa security test itu bukan cuma 'apakah ditolak', tapi juga 'apakah pesannya berguna'."

---

## 6. Error display — hubungkan balik ke UI (5 menit) — slide halaman 4

> "`CreatePostForm.tsx` yang kita bangun dari Bab 1 udah nunjukkin pattern ini persis:"
```tsx
{errors?.title && <p className="text-red-500 text-xs mt-1">{errors.title[0]}</p>}
```
> "Format `fieldErrors` — `Record<string, string[]>` — didesain justru buat gampang ditaruh di bawah input yang tepat kayak gini. Satu field, bisa lebih dari satu pesan error (makanya array), kita ambil `[0]` buat nampilin yang pertama saja."

---

## 7. Kuis cepat (3 menit) — slide halaman 5

1. Kenapa Server Action harus validasi ulang meski client sudah validasi? → **C** (client validation bisa di-bypass, Server Action bisa dipanggil langsung tanpa UI — sudah dibuktikan lewat `curl`)
2. Beda `z.coerce.number()` dari `z.number()`? → **C** (konversi string ke number dulu sebelum divalidasi)
3. `flattenError(error).fieldErrors` menghasilkan format apa? → **C** (`Record<string, string[]>` — key nama field, value array pesan error)

---

## 8. Tutup + homelab (2 menit) — slide halaman 6-7

Rangkuman lisan:
- Server Action: FormData → object → `safeParse` → cek `success` → pakai `result.data`.
- Route Handler: `z.coerce.number()` buat query params (selalu string), status 400/422/201 yang tepat.
- `flattenError(error)` → `{ fieldErrors, formErrors }` — sertakan **keduanya** di response API, jangan cuma `fieldErrors`.
- **Never trust the client** — dibuktikan langsung lewat `curl`, bukan cuma diomongin.
- Satu schema (`createPostSchema`), dipakai di Server Action **dan** Route Handler — satu sumber kebenaran.

Homelab — **sudah dieksekusi penuh**, siswa tinggal baca atau replikasi:
1. Server Action — `app/posts/action.ts` ✅ (sudah dari Bab 1-2, di-refactor dikit hari ini)
2. API Route — `app/api/posts/route.ts`, GET dengan `z.coerce`, POST dengan body validation, status code tepat ✅
3. Error Display — `CreatePostForm.tsx` ✅ (dari Bab 1)
4. Security Test — sudah dibuktikan lewat `curl`, termasuk nemuin & benerin gap `fieldErrors` kosong ✅

Tutup: "Selanjutnya Bab 4 — react-hook-form + Zod Resolver. Sekarang server-side udah solid; kita bakal lihat cara bikin experience form di client jadi lebih halus, tanpa kehilangan validasi yang udah kita bangun di server."
