"use server";

import { createPost, softDeletePost, updatePost } from "@/lib/data/post";
import { upsertUserPreferences } from "@/lib/data/user-preferences";
import { db } from "@/lib/db";
import { createPostSchema } from "@/lib/validation/post";
import { revalidatePath } from "next/cache";

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

export type CreatePostActionState = {
  errors?: Record<string, string[]> | undefined;
  success?: boolean;
}

export async function createPostAction(
  _prevState: CreatePostActionState,
  formData: FormData
): Promise<CreatePostActionState> {
  const result = createPostSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    excerpt: formData.get("excerpt"),
    content: formData.get("content") || undefined,
  })

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  const author = await getOrCreateDemoAuthor();

  await createPost({ ...result.data, authorId: author.id });
  revalidatePath("/posts");
  return { success: true };
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