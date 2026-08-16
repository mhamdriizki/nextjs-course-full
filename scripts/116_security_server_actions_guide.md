# Script Presentasi & Panduan Mengajar - Modul 11 (Bagian 4): Keamanan Dasar Server Actions

Dokumen ini berisi panduan untuk Anda sebagai instruktur dalam membawakan materi mengenai pentingnya menjaga keamanan _Server Action_ dari penyalahgunaan (_abuse_).

---

## Bagian 1: Script Presentasi (Slide per Slide)

**Slide 1: Keamanan Dasar Server Actions: Jangan Percaya Client**
"Halo! Kita sudah melihat betapa hebatnya Server Actions. Namun, kekuatan besar datang dengan tanggung jawab besar. *Server Actions bukan keajaiban*! Mereka pada dasarnya adalah _endpoint_ HTTP rahasia. Karena itu, prinsip utamanya adalah: **Jangan pernah percaya data dari Client!** Hari ini kita akan belajar _security by design_."

**Slide 2: Server Actions Bisa Dipanggil Langsung**
"Banyak yang mengira karena Server Action dipanggil dari kode UI (seperti tombol onClick), maka tidak mungkin dipanggil orang luar. Ini SALAH BESAR! Siapapun bisa membuka DevTools, melihat *Network Tab*, dan meniru (_replay_) HTTP POST request tersebut dengan parameter buatan sendiri.
Kalau kita membuat fungsi hapus data tanpa ngecek sesi (Auth) atau kepemilikan, _hacker_ bisa mengirimkan ID postingan orang lain dan menghapus seluruh isi database kita secara remote!"

**Slide 3: Input Validation & IDOR Prevention**
"IDOR (_Insecure Direct Object Reference_) adalah kerentanan di mana *user* bisa mengakses data orang lain hanya dengan menebak ID. 
Cara mencegahnya:
1. Validasi semua *input* dengan _Zod_ agar datanya sesuai ekspektasi (mencegah *SQL Injection* / anomali).
2. Verifikasi kepemilikan (_Ownership Check_). Jangan hanya melakukan `DELETE WHERE id = input`. Selalu gunakan `DELETE WHERE id = input AND authorId = user_saat_ini`."

**Slide 4: Security Checklist untuk Server Action**
"Sebelum merilis aplikasi, pastikan setiap Server Action mutasi melewati 6 lapis keamanan ini:
1. **Authentication**: Apakah _user_ sudah _login_?
2. **Authorization**: Apakah _role_-nya diizinkan melakukan ini (Admin vs User)?
3. **Input Validation**: Apakah format inputnya aman (pakai Zod)?
4. **Ownership Verification**: Apakah data yang diubah adalah benar milik _user_ tersebut?
5. **Rate Limiting**: Cegah _spam_ (brute-force).
6. **Logging**: Catat siapa yang melakukan mutasi untuk forensik."

**Slide 5: Evaluasi Pemahaman (Kuis)**
"Waktunya kuis singkat!
Q1: Cara mencegah _attacker_ mengirim request dengan ID postingan orang lain? Jawabannya **B**, kita wajib *query* DB dengan klausa WHERE `id` DAN `authorId`.
Q2: Urutan lapisan keamanan yang ideal? Jawabannya **B**. Cek _Auth_ dulu, baru validasi *input*, verifikasi *ownership*, barulah *execute*. *Fail fast*, hentikan eksekusi di langkah pertama yang gagal.
Q3: Apakah Server Action yang disembunyikan pasti aman? Jawabannya **B (Tidak)**. Ia tetap bisa di-_hit_ via HTTP POST oleh siapapun."

**Slide 6: Tugas Mandiri / Home Lab**
"Mari kita praktik untuk memperkuat aplikasi kita:
1. **Security Audit:** Cek semua Server Action kita sebelumnya. Apakah sudah aman?
2. **Fix `deletePost`:** Perbaiki fungsi hapus kita agar mengecek _session_, memastikan _ownership_, dan menolak akses ilegal.
3. **Admin Check:** Coba buat action `updateUserRole` yang mengunci eksekusi jika *role* bukan ADMIN.
4. **Test Attack:** Jadilah _hacker_ sebentar! Login sebagai User B, buka *DevTools*, dan coba panggil Server Action untuk menghapus tulisan User A. Pastikan Anda mendapat respon 'Forbidden'!"

**Slide 7: Rangkuman**
"Sebagai ringkasan: Server Action adalah HTTP _endpoint_ biasa. Ingat 4 lapis keamanan: **Auth → Authorization → Validate Input → Verify Ownership**. Jangan percaya _client_, dan selalu gagalkan proses di langkah awal (_fail fast_) jika mendeteksi pelanggaran keamanan. Di modul selanjutnya (Modul 12), kita akan mengimplementasikan Autentikasi sungguhan dengan Better Auth!"

---

## Bagian 2: Panduan Home Lab (Opsional untuk Live Coding)

Jika Anda ingin mendemonstrasikan tugas mandiri secara langsung, berikut adalah _cheat sheet_ untuk memperketat keamanan `deletePost` (Simulasi):

### Memperbaiki Keamanan `softDeletePostAction` (Contoh Logika)
_Demonstrasi menambahkan proteksi Auth dan IDOR._

```typescript
import { ActionResult } from "@/lib/validation/action-result";
import { db } from "@/lib/db";
import { revalidateTag } from "next/cache";
// Anggap kita punya fungsi untuk mendapatkan session saat ini
import { getSession } from "@/lib/auth"; 

export async function secureSoftDeletePostAction(postId: string): Promise<ActionResult<null>> {
  try {
    // 1. Authentication Check
    const session = await getSession();
    if (!session || !session.user) {
      return { success: false, message: "Unauthorized: Silakan login terlebih dahulu." };
    }

    // 2. Input Validation (Bisa dilewati jika input hanya 1 string sederhana, atau pakai Zod)
    if (!postId || typeof postId !== 'string') {
      return { success: false, message: "ID Post tidak valid." };
    }

    // 3. Ownership Verification (Mencegah IDOR)
    const post = await db.post.findUnique({
      where: { id: postId },
      select: { authorId: true }
    });

    if (!post) {
      return { success: false, message: "Post tidak ditemukan." };
    }

    // Pastikan yang menghapus adalah pemiliknya atau seorang ADMIN
    if (post.authorId !== session.user.id && session.user.role !== 'ADMIN') {
      return { success: false, message: "Forbidden: Anda tidak memiliki akses menghapus post ini." };
    }

    // 4. Execution
    await db.post.update({
      where: { id: postId },
      data: { deletedAt: new Date() }
    });

    // 5. Revalidate
    revalidateTag("posts", "max");
    revalidateTag(`post-${postId}`, "max");
    
    return { success: true, data: null };
  } catch (error) {
    // Hindari expose detail teknis error (misal Prisma error) ke client
    return { success: false, message: "Terjadi kesalahan internal server." };
  }
}
```
