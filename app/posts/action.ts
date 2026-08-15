"use server";

import { createPost, softDeletePost, updatePost } from "@/lib/data/post";
import { getOrCreateDemoAuthor } from "@/lib/data/user";
import { upsertUserPreferences } from "@/lib/data/user-preferences";
import { ActionResult } from "@/lib/validation/action-result";
import { createPostSchema, type CreatePostInput } from "@/lib/validation/post";
import { revalidatePath } from "next/cache";

import { flattenError } from "zod";

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