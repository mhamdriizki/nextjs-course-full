import { z } from "zod";

// Base schema — persis field model Post di schema.prisma.
//
// Catatan penting, dua koreksi dari slide:
// 1. id & authorId pakai z.cuid2(), BUKAN .uuid() — project ini generate ID
//    lewat @default(cuid()) di Prisma, bukan UUID. Sudah dibuktikan: ID asli
//    project ("cmsdczft40000af4d79wyv1i4") gagal validasi .uuid().
// 2. Dipilih z.cuid2(), bukan z.cuid() — z.cuid() itu CUID v1 yang sudah
//    deprecated (bocorin timestamp di dalam ID-nya), dan Prisma modern
//    (versi yang kita pakai) generate CUID v2 by default. z.cuid2() juga
//    yang tidak memicu deprecation hint di editor.
export const postSchema = z.object({
  id: z.cuid2(),
  title: z.string().trim().min(3, "Judul minimal 3 karakter").max(100, "Judul maksimal 100 karakter"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, "Slug cuma boleh huruf kecil, angka, dan tanda minus"),
  excerpt: z.string().trim().min(3, "Excerpt minimal 3 karakter").max(200, "Excerpt maksimal 200 karakter"),
  content: z.string().trim().min(10, "Konten minimal 10 karakter").optional(),
  category: z.string().trim().min(1).optional(),
  published: z.boolean().default(false),
  viewCount: z.number().int().nonnegative(),
  authorId: z.cuid2(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

// CREATE — hapus field yang auto-generated ATAU tidak datang dari form
// (authorId disuplai server dari session/demo-author, bukan dari input user).
export const createPostSchema = postSchema.omit({
  id: true,
  viewCount: true,
  authorId: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

// UPDATE — semua optional kecuali id (kita harus tahu post mana yang diupdate).
export const updatePostSchema = postSchema.partial().required({ id: true });

// LIST/PREVIEW — cuma field yang perlu ditampilkan di listing, bukan detail penuh.
export const postPreviewSchema = postSchema.pick({
  id: true,
  title: true,
  slug: true,
  published: true,
  createdAt: true,
});

// EXTEND — contoh nambah relasi ke schema yang sudah ada, tanpa nulis ulang.
export const postWithAuthorSchema = postSchema.extend({
  author: z.object({ name: z.string(), email: z.email() }),
});

export type PostInput = z.infer<typeof postSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type PostPreview = z.infer<typeof postPreviewSchema>;
export type PostWithAuthor = z.infer<typeof postWithAuthorSchema>;
