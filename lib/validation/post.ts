import { z } from "zod";

// export const createPostSchema = z.object({
//   title: z.string().trim().min(3, "Judul minimal 3 karakter").max(100, "Judul maksimal 100 karakter"),
//   slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+$/, "Slug hanya boleh mengandung huruf kecil dan angka"),
//   excerpt: z.string().trim().min(3, "Ringkasan minimal 3 karakter").max(200, "Ringkasan maksimal 200 karakter"),
//   content: z.string().trim().min(10, "Konten minimal 10 karakter").optional(),
//   published: z.boolean().default(false),
// });

// export type CreatePostInput = z.infer<typeof createPostSchema>;

export const postSchema = z.object({
  id: z.cuid2(),
  title: z.string().trim().min(3, "Judul minimal 3 karakter").max(100, "Judul maksimal 100 karakter"),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+$/, "Slug hanya boleh mengandung huruf kecil dan angka"),
  excerpt: z.string().trim().min(3, "Ringkasan minimal 3 karakter").max(200, "Ringkasan maksimal 200 karakter"),
  content: z.string().trim().min(10, "Konten minimal 10 karakter").optional(),
  published: z.boolean().default(false),
  viewCount: z.number().int().nonnegative(),
  authorId: z.cuid2(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable()
});

// CREATE - hapus field yang auto generated
export const createPostSchema = postSchema.omit({
  id: true,
  viewCount: true,
  authorId: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true
})

// UPDATE - semua field optional kecuali id
export const updatePostSchema = postSchema.partial().required({
  id: true
});

// LIST / PREVIEW - hanya field yang perlu ditampilkan saja
export const postPreviewSchema = postSchema.pick({
  id: true,
  title: true,
  slug: true,
  published: true,
  createdAt: true,
});

// EXTEND
export const postWithAuthorSchema = postSchema.extend({
  author: z.object({ name: z.string() , email: z.email() })
})

export type PostInput = z.infer<typeof postSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type PostPreview = z.infer<typeof postPreviewSchema>;
export type PostWithAuthor = z.infer<typeof postWithAuthorSchema>;