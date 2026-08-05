import { z } from "zod";

// PENTING: .trim() ditaruh SEBELUM .min()/.max(). Zod menjalankan method
// sesuai urutan ditulis — kalau trim() ditaruh terakhir (seperti contoh umum
// di banyak tutorial), input " ab " (2 karakter + spasi) bisa lolos min(3)
// karena panjang MENTAH-nya 4, padahal isinya cuma 2 karakter setelah trim.
export const createPostSchema = z.object({
  title: z.string().trim().min(3, "Judul minimal 3 karakter").max(100, "Judul maksimal 100 karakter"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, "Slug cuma boleh huruf kecil, angka, dan tanda minus"),
  excerpt: z.string().trim().min(3, "Excerpt minimal 3 karakter").max(200, "Excerpt maksimal 200 karakter"),
  content: z.string().trim().min(10, "Konten minimal 10 karakter").optional(),
  published: z.boolean().default(false),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
