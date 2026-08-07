# Naskah Live Demo — Modul 10 Bab 4: react-hook-form + Zod Resolver

Durasi perkiraan 45-50 menit. Semua **sudah dieksekusi dan ditest** di branch `coba-104`.

## 🧪 Cara test modul ini — baca ini duluan, beda total dari bab-bab sebelumnya

Bab ini **mustahil ditest penuh lewat `curl`**, dan itu bukan kekurangan — memang begitu sifatnya:

| Yang mau dites | Caranya | Kenapa |
|---|---|---|
| **Validasi real-time saat mengetik** (poin utama bab ini) | **Wajib browser** — buka `/posts/new`, ketik di field, lihat pesan error muncul/hilang **tanpa** submit sama sekali | Ini murni JavaScript di browser, nggak ada request ke server sama sekali sampai kalian klik submit. `curl` nggak punya "mengetik" — nggak ada yang bisa disimulasikan |
| **Halaman render dengan benar** (field-field ada) | `curl http://localhost:3000/posts/new` | Ini kerja server-side rendering biasa, bisa dicek cepat |
| **Logic validasi Zod-nya sendiri** (`createPostSchema`) | Script Node/Bun langsung (`bun run`), import schema-nya, `.safeParse()` | Ini logic murni, sama sekali nggak butuh browser atau HTTP |
| **Server Action penerima data** (`createPostFromObjectAction`) | Script langsung, panggil function-nya dengan object palsu | Sama kayak sebelumnya — Server Action nggak bisa dipanggil `curl`, tapi bisa di-import dan dipanggil langsung sebagai function biasa dari script |
| **Alur sukses penuh** (toast muncul, redirect ke `/posts/[slug]`) | **Wajib browser** | Butuh DOM beneran buat lihat toast dan navigasi client-side jalan |

**Ringkasnya:** kalau presenter cuma punya waktu buat satu cara test, **buka browser ke `/posts/new`**. Itu satu-satunya cara benar-benar ngerasain poin dari bab ini — real-time feedback sebelum submit. Semua yang lain (schema, Server Action) sudah saya verifikasi lewat script, tapi itu cuma buktiin "logic-nya benar", bukan "pengalaman formnya bagus" — yang justru jadi inti bab ini.

---

## Ringkasan urutan file yang diubah, dari awal sampai akhir

1. **`package.json`** — install `react-hook-form`, `@hookform/resolvers`.
2. **`components/ui/textarea.tsx`, `switch.tsx`, `sonner.tsx`** (baru, via `bunx shadcn add`) — komponen UI yang dibutuhkan.
3. **`components/ui/form.tsx`** (baru, **ditulis manual**) — lihat temuan penting di bawah, kenapa ini nggak bisa di-install biasa.
4. **`app/layout.tsx`** — pasang `<Toaster />` (dari sonner) di root layout.
5. **`app/posts/action.ts`** — tambah `createPostFromObjectAction`, versi Server Action yang nerima object langsung (bukan `FormData`), dipakai react-hook-form.
6. **`app/posts/CreatePostFormRHF.tsx`** (baru) — form pakai `useForm` + `zodResolver` + shadcn Form components.
7. **`app/posts/new/page.tsx`** (baru) — halaman buat nampung form ini, terpisah dari `/posts` yang masih pakai versi `useActionState` (Bab 1-3) — sengaja dibiarkan dua-duanya hidup buat perbandingan.
8. **`app/posts/page.tsx`** — tambah link ke `/posts/new`.

---

## ⚠️ Temuan penting dari eksekusi

### 1. `bunx shadcn add form` gagal total — "No files."

Project ini pakai style custom `"base-maia"` di `components.json`, dan primitif `@base-ui/react` (bukan Radix UI standar yang dipakai kebanyakan tutorial shadcn). Saya coba install `form` component:
```bash
bunx shadcn@latest add form --view
# → "No files."
```
Dicek lebih lanjut, registry custom ini memang nggak punya komponen `form` — kemungkinan sudah digantikan konsep `field` di versi terbaru shadcn. Solusinya: **saya tulis `components/ui/form.tsx` manual**, mengikuti resep standar shadcn (React Context + `react-hook-form`), disesuaikan supaya nggak bergantung ke Radix Slot (pakai `React.cloneElement` biasa, yang bekerja sama baiknya buat kasus single-child kayak `FormControl`).

> **Pelajaran buat kelas:** `bunx shadcn add <komponen>` **tidak selalu berhasil diam-diam**. Kalau CLI-nya nggak nge-print error tapi juga nggak bikin file, **cek manual** (`ls components/ui/form.tsx`) sebelum lanjut coding seolah-olah komponennya ada.

### 2. `Switch` dari Base UI beda API dari Radix — `checked`/`onCheckedChange`, bukan `value`/`onChange`

```tsx
// SALAH — {...field} nggak cocok buat Switch Base UI
<Switch {...field} />

// BENAR — wiring eksplisit
<Switch checked={field.value} onCheckedChange={field.onChange} />
```
> Sudah dibuktikan lewat test: `published: true` tersimpan dengan benar ke database pakai wiring ini.

### 3. Type mismatch `zodResolver` + `useForm<T>` eksplisit

```tsx
// Ini bikin TypeScript error panjang (generic TFieldValues nggak nyambung)
const form = useForm<CreatePostInput>({ resolver: zodResolver(createPostSchema) });

// Ini yang benar — biarkan TypeScript infer dari resolver-nya sendiri
const form = useForm({ resolver: zodResolver(createPostSchema) });
```
> Ini kombinasi versi spesifik (`react-hook-form@7.84.0` + `@hookform/resolvers@5.7.1` + `zod@4.4.3`) yang generic-nya nggak otomatis nyambung kalau `useForm` dikasih type argument eksplisit. Solusi paling stabil: jangan kasih generic eksplisit ke `useForm`, biarkan inference jalan dari `zodResolver(schema)`.

---

## 1. Framing pembuka (5 menit)

**Live-demo dulu, baru dijelasin — buka `/posts` (form lama, Bab 1-3) di satu tab, `/posts/new` (form baru) di tab lain:**

> "Coba perhatikan bedanya. Di `/posts`, kalau kalian ketik judul cuma 2 huruf terus klik di luar input, nggak ada apa-apa — errornya baru muncul **setelah** kalian klik submit, karena itu `useActionState`, validasinya jalan di server, butuh round-trip. Sekarang coba di `/posts/new` — ketik judul 2 huruf, klik ke field lain. Lihat, pesan errornya **langsung muncul**, tanpa submit sama sekali. Itu `react-hook-form` + Zod jalan di browser, real-time."

> "Dua-duanya tetap **aman** — inget pelajaran Bab 3, client validation bisa di-bypass. Makanya `createPostFromObjectAction` yang kita panggil dari form baru ini **tetap** `safeParse` ulang di server. React-hook-form itu soal UX, bukan pengganti validasi server."

---

## 2. Setup — install & komponen (10 menit) — slide halaman 2

**Live-run:**
```bash
bun add react-hook-form @hookform/resolvers
bunx shadcn@latest add textarea switch sonner
```

**Live-demo — tunjukkan `form` gagal, ini pelajaran penting:**
```bash
bunx shadcn@latest add form --view
# "No files."
```
> "Perhatikan ini. CLI-nya nggak bilang 'error', dia cuma diam. Kalau kalian nggak cek manual, kalian bisa aja lanjut nulis kode yang import dari file yang nggak pernah ke-generate, baru ketahuan pas run dev server. Cek folder-nya langsung."

**Live-type — tulis `components/ui/form.tsx` manual (jelaskan potongan intinya, nggak perlu ketik semua baris):**
```tsx
const Form = FormProvider; // dari react-hook-form

function FormField({ ...props }) {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
}

function useFormField() {
  // ambil error state dari react-hook-form buat field ini,
  // generate id yang konsisten buat aria-describedby, dst
}

function FormControl({ children, ...props }) {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField();
  return React.cloneElement(children, {
    id: formItemId,
    "aria-invalid": !!error,
    "aria-describedby": !error ? formDescriptionId : `${formDescriptionId} ${formMessageId}`,
  });
}
```
> "Ini bukan komponen visual — ini semuanya soal **menghubungkan** state react-hook-form ke elemen HTML, plus atribut accessibility (`aria-invalid`, `aria-describedby`) otomatis. `FormControl` yang paling penting: dia nge-clone elemen anak-nya (misal `<Input>`) dan nyuntikin atribut-atribut itu, jadi kalian nggak perlu nulis manual tiap field."

---

## 3. Setup `useForm` + `zodResolver` (10 menit) — slide halaman 2

**Live-type — buka `app/posts/CreatePostFormRHF.tsx`, bangun dari `useForm`:**
```tsx
const form = useForm({
  resolver: zodResolver(createPostSchema),
  defaultValues: { title: "", slug: "", excerpt: "", content: "", published: false },
});
```

**Talking point — bedah tiap return value `useForm`, sesuai cheat sheet slide:**
> "`form.register(name)` itu cara lama, buat native input tanpa `FormField` wrapper. Kita nggak pakai ini langsung karena udah dibungkus `FormField`+`Controller`. `form.formState.errors` isinya error per field, hasil dari `zodResolver` nerjemahin `ZodError` jadi format yang react-hook-form ngerti. `form.handleSubmit(onSubmit)` itu yang paling penting — dia **cuma** manggil `onSubmit` kalau **semua** validasi lolos. Ini jawaban kuis nomor 3 nanti."

**Talking point — kenapa nggak `useForm<CreatePostInput>`:**
> "Kalian mungkin insting mau nulis `useForm<CreatePostInput>(...)`, kasih tipe eksplisit. Saya udah coba, dan itu bikin error TypeScript yang panjang banget — generic dari `zodResolver` sama generic yang diminta `useForm<T>` nggak otomatis nyambung di kombinasi versi yang kita pakai. Solusinya, jangan kasih generic eksplisit — biarkan TypeScript infer sendiri dari `zodResolver(createPostSchema)`. Ini salah satu contoh nyata kenapa kalian harus baca error TypeScript-nya, bukan langsung nyerah atau nge-`any` semuanya."

---

## 4. shadcn Form components — live-coding utama (15 menit) — slide halaman 3

**Live-type, satu field dulu, jelasin strukturnya:**
```tsx
<FormField
  control={form.control}
  name="title"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Judul Post</FormLabel>
      <FormControl>
        <Input placeholder="Judul..." {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```
**Talking point, lapis demi lapis:**
> "`FormField` itu jembatan ke `Controller`-nya react-hook-form — dia yang tahu field mana yang lagi diisi. `render={({ field }) => ...}` itu render-prop pattern — `field` di situ isinya `value`, `onChange`, `onBlur`, `name`, `ref`, siap di-spread ke input manapun yang bentuknya native (`<input>`, `<textarea>`). `FormItem` cuma wrapper layout + generate `id` unik. `FormControl` yang nyuntik atribut accessibility. `FormMessage` otomatis nampilin `form.formState.errors.title?.message` — kalian nggak perlu nulis kondisional manual kayak di Bab 1-3."

**Live-type — field `published` pakai `Switch`, ini yang beda:**
```tsx
<FormField
  control={form.control}
  name="published"
  render={({ field }) => (
    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
      <FormLabel>Publish sekarang?</FormLabel>
      <FormControl>
        <Switch checked={field.value} onCheckedChange={field.onChange} />
      </FormControl>
    </FormItem>
  )}
/>
```
> "Perhatikan di sini saya **nggak** pakai `{...field}` kayak `Input`. `Switch` dari Base UI itu komponen custom, bukan native `<input type='checkbox'>` — dia expect prop `checked` dan `onCheckedChange`, bukan `value`/`onChange`. Kalau kalian nekat `{...field}`, nggak akan error di compile time, tapi switch-nya nggak akan pernah keceklis, karena dia nggak ngerti prop `value`/`onChange`. Ini saya buktikan lewat test — `published: true` baru bener-bener kesimpen setelah wiring-nya diperbaiki begini."

---

## 5. Integrasi ke Server Action + error dari server (10 menit) — slide halaman 3, homelab task 3

**Live-type — `app/posts/action.ts`, function baru:**
```ts
export async function createPostFromObjectAction(
  data: CreatePostInput
): Promise<ActionResult<CreatedPost>> {
  const result = createPostSchema.safeParse(data); // validasi ULANG di server!

  if (!result.success) {
    return { success: false, errors: flattenError(result.error).fieldErrors };
  }

  const author = await getOrCreateDemoAuthor();
  const post = await createPost({ ...result.data, authorId: author.id });
  revalidatePath("/posts");
  return { success: true, data: post };
}
```
**Talking point:**
> "Perhatikan ini nerima `data: CreatePostInput` langsung — object biasa, **bukan** `FormData`. Beda dari `createPostAction` yang lama, yang nerima `FormData` karena dipasang di `<form action={...}>`. React-hook-form manggil Server Action-nya **secara imperatif**, di dalam `onSubmit`, bukan lewat atribut `action` di tag `<form>`. Makanya bentuknya beda."

**Live-type — `onSubmit` di komponen, map error server balik ke field:**
```tsx
async function onSubmit(data: CreatePostInput) {
  const result = await createPostFromObjectAction(data);

  if (!result.success) {
    Object.entries(result.errors ?? {}).forEach(([field, messages]) => {
      if (messages?.[0]) {
        form.setError(field as keyof CreatePostInput, { message: messages[0] });
      }
    });
    return;
  }

  toast.success(`Post "${result.data.title}" berhasil dibuat`);
  form.reset();
  router.push(`/posts/${result.data.slug}`);
}
```
**Talking point — kenapa masih perlu `form.setError` padahal udah ada `zodResolver`:**
> "Ini poin penting: client validation (`zodResolver`) cuma bisa cek hal-hal yang **bisa diketahui tanpa nanya ke database** — panjang string, format regex, dst. Tapi ada error yang **cuma ketahuan di server** — misal slug ternyata udah dipakai post lain (unique constraint), atau aturan bisnis lain yang butuh cek data. `form.setError(field, { message })` itu cara nyuntik error dari server **ke dalam** state react-hook-form, biar tampil di `FormMessage` yang sama, seolah-olah itu error validasi biasa. Ini jawaban kuis nomor 2."

**Live-demo di browser:** submit form dengan data valid, lihat toast hijau muncul di pojok, form ke-reset, redirect ke halaman detail post.

---

## 6. Kuis cepat (3 menit) — slide halaman 4

1. Fungsi `zodResolver` dalam setup `react-hook-form`? → **B** (menghubungkan Zod schema ke react-hook-form sebagai validation engine)
2. Cara nampilin server error di field `slug`? → **B** (`form.setError('slug', { message: 'Slug sudah dipakai' })`)
3. Kapan `onSubmit` dijalankan? → **B** (hanya kalau SEMUA validasi Zod lolos — data sudah tervalidasi saat masuk `onSubmit`)

---

## 7. Tutup + homelab (2 menit) — slide halaman 5-6

Rangkuman lisan:
- `zodResolver`: bridge Zod ke react-hook-form, satu schema buat validasi client.
- shadcn `Form`+`FormField`+`FormMessage`: accessible form, error display otomatis — tapi cek dulu komponennya beneran ke-install, jangan asumsi.
- `form.setError(field, { message })`: nyuntik error dari server ke form field yang sama.
- **Two-layer validation**: client (`zodResolver`, buat UX) + server (`safeParse` lagi, buat keamanan) — dua-duanya tetap wajib.
- `form.formState.isSubmitting`: disable tombol submit, cegah double-submit.

Homelab — **sudah dieksekusi penuh**, siswa tinggal buka browser buat ngerasain:
1. Install & Setup — `react-hook-form` + `@hookform/resolvers` ✅, `CreatePostFormRHF` pakai `zodResolver(createPostSchema)` ✅
2. Form Fields — `title` (Input), `content` (Textarea), `published` (Switch), semua pakai `FormLabel`+`FormControl`+`FormMessage` ✅
3. Server Integration — `createPostFromObjectAction`, `form.setError()`, tombol disabled saat `isSubmitting` ✅
4. Success Flow — `form.reset()`, toast (sonner), redirect ke `/posts/[slug]` ✅

Tutup: "Selanjutnya Bab 5 — React 19 Form Hooks: `useActionState` & `useFormStatus`. Kita bakal bandingin langsung dua pendekatan yang sekarang hidup berdampingan di project ini — `/posts` (native React 19) vs `/posts/new` (react-hook-form) — dan kapan masing-masing lebih masuk akal dipakai."
