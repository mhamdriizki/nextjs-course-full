"use server";

import { auth } from "@/lib/auth";
import { createPost, softDeletePost, updatePost } from "@/lib/data/post";
import { upsertUserPreferences } from "@/lib/data/user-preferences";
import { ActionResult } from "@/lib/validation/action-result";
import { createPostSchema, type CreatePostInput } from "@/lib/validation/post";
import { revalidatePath, revalidateTag } from "next/cache";
import { headers } from "next/headers";

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

  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return { success: false, message: "Unauthorized" };
  }

  try {
    const post = await createPost({ ...result.data, authorId: session.user.id });
    revalidateTag("posts", "max");
    return { success: true, data: post };
  } catch (error) {
    return { success: false, message: "Gagal menyimpan post ke database" };
  }
}

export async function publishPostAction(id: string) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return { success: false, message: "Unauthorized" };
  }

  const isAdmin = session.user.role === "ADMIN";

  try {
    // ADMIN: authorId di-skip → bisa publish post siapapun
    // Bukan ADMIN: authorId tetap dipaksa == dirinya sendiri → cuma bisa publish post sendiri
    await updatePost(id, { published: true }, isAdmin ? undefined : session.user.id);
    revalidateTag("posts", "max");
    return { success: true, data: null };
  } catch (error) {
    return { success: false, message: "Gagal publish post" };
  }
}

export async function softDeletePostAction(id: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session) {
    return { success: false, message: 'Unauthorized' }
  }

  const isAdmin = session.user.role === "ADMIN";

  try {
    // ADMIN: authorId di-skip → bisa hapus post siapapun
    // Bukan ADMIN: authorId tetap dipaksa == dirinya sendiri → cuma bisa hapus post sendiri
    await softDeletePost(id, isAdmin ? undefined : session.user.id);
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

  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return { success: false, message: "Unauthorized" };
  }

  try {
    const post = await createPost({ ...result.data, authorId: session.user.id });
    revalidateTag("posts", "max");
    return { success: true, data: post };
  } catch (error) {
    return { success: false, message: "Gagal menyimpan post ke database" };
  }
}
