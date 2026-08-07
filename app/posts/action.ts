"use server";

import { createPost, softDeletePost, updatePost } from "@/lib/data/post";
import { upsertUserPreferences } from "@/lib/data/user-preferences";
import { db } from "@/lib/db";
import { ActionResult } from "@/lib/validation/action-result";
import { createPostSchema, type CreatePostInput } from "@/lib/validation/post";
import { revalidatePath } from "next/cache";

import { flattenError } from "zod";

const DEMO_AUTHOR_EMAIL = "rizki@email.com"

async function getOrCreateDemoAuthor() {
  const existing = await db.user.findFirst({
    where: { email: DEMO_AUTHOR_EMAIL }
  });
  if (existing) return existing;
  return db.user.create({
    data: {
      email: DEMO_AUTHOR_EMAIL,
      name: "Rizki",
      role: "AUTHOR"
    }
  });
}

// export type CreatePostActionState = {
//   errors?: Record<string, string[]> | undefined;
//   success?: boolean;
// }

type CreatedPost = Awaited<ReturnType<typeof createPost>>;

export async function createPostAction(
  _prevState: ActionResult<CreatedPost> | null,
  formData: FormData
): Promise<ActionResult<CreatedPost>> {
  const result = createPostSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    excerpt: formData.get("excerpt"),
    content: formData.get("content") || undefined,
  })

  if (!result.success) {
    return { success: false, errors: flattenError(result.error).fieldErrors}
  }

  const author = await getOrCreateDemoAuthor();

  const post = await createPost({ ...result.data, authorId: author.id })
  revalidatePath("/posts");
  return { success: true, data: post };
}

// Dipakai react-hook-form (Bab 4) — beda dari createPostAction di atas:
// nerima object JS langsung (hasil form.handleSubmit), BUKAN FormData,
// karena react-hook-form manggilnya secara imperatif, bukan lewat
// <form action={...}>. Tetap safeParse ulang di sini — client sudah
// validasi lewat zodResolver, tapi server TIDAK BOLEH percaya begitu saja
// (pelajaran Bab 3: client validation bisa di-bypass).
export async function createPostFromObjectAction(
  data: CreatePostInput
): Promise<ActionResult<CreatedPost>> {
  const result = createPostSchema.safeParse(data);

  if (!result.success) {
    return { success: false, errors: flattenError(result.error).fieldErrors };
  }

  const author = await getOrCreateDemoAuthor();
  const post = await createPost({ ...result.data, authorId: author.id });
  revalidatePath("/posts");
  return { success: true, data: post };
}

export async function publishPostAction(id: string) {
  await updatePost(id, { published: true });
  revalidatePath("/posts");
}

export async function softDeletePostAction(id: string) {
  await softDeletePost(id);
  revalidatePath("/posts");
}

export async function saveThemePreferenceAction(userId: string, theme: string) {
  await upsertUserPreferences(userId, { theme });
  revalidatePath("/posts");
}