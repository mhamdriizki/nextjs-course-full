"use server";

import { createPost, softDeletePost, updatePost } from "@/lib/data/post";
import { getOrCreateDemoAuthor } from "@/lib/data/user";
import { upsertUserPreferences } from "@/lib/data/user-preferences";
import { ActionResult } from "@/lib/validation/action-result";
import { createPostSchema, type CreatePostInput } from "@/lib/validation/post";
import { revalidatePath, revalidateTag } from "next/cache";

import { flattenError, success } from "zod";

type CreatedPost = Awaited<ReturnType<typeof createPost>>;

export async function createPostAction(
  _prevState: ActionResult<CreatedPost> | null,
  formData: FormData,
): Promise<ActionResult<CreatedPost>> {
  const result = createPostSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    excerpt: formData.get("excerpt"),
    content: formData.get("content") || undefined,
  });

  if (!result.success) {
    return { success: false, errors: flattenError(result.error).fieldErrors };
  }

  try {
    const author = await getOrCreateDemoAuthor();
    const post = await createPost({ ...result.data, authorId: author.id });
    revalidateTag("posts", "max");
    return { success: true, data: post };
  } catch (error) {
    return { success: false, message: "Gagal menyimpan post ke database" };
  }
}

export async function publishPostAction(id: string) {
  await updatePost(id, { published: true });
}

export async function softDeletePostAction(id: string) {
  try {
    await softDeletePost(id);
    revalidateTag("posts", "max");
    revalidateTag(`post-${id}`, "max");
    return { success: true, data: null };
  } catch (error) {
    return { success: false, message: "Gagal menghapus post" };
  }
}

export async function saveThemePreferenceAction(userId: string, theme: string) {
  await upsertUserPreferences(userId, { theme });
  revalidatePath("/posts");
}

export async function createPostFromObjectAction(
  data: CreatePostInput,
): Promise<ActionResult<CreatedPost>> {
  const result = createPostSchema.safeParse(data);

  if (!result.success) {
    return { success: false, errors: flattenError(result.error).fieldErrors };
  }

  try {
    const author = await getOrCreateDemoAuthor();
    const post = await createPost({ ...result.data, authorId: author.id });
    revalidateTag("posts", "max");
    return { success: true, data: post };
  } catch (error) {
    return { success: false, message: "Gagal menyimpan post ke database" };
  }
}
