import { z } from "zod";

export const createPostSchema = z.object({
  title: z.string().trim().min(3, "Judul minimal 3 karakter").max(100, "Judul maksimal 100 karakter"),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+$/, "Slug hanya boleh mengandung huruf kecil dan angka"),
  excerpt: z.string().trim().min(3, "Ringkasan minimal 3 karakter").max(200, "Ringkasan maksimal 200 karakter"),
  content: z.string().trim().min(10, "Konten minimal 10 karakter").optional(),
  published: z.boolean().default(false),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;