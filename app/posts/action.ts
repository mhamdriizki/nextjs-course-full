"use server";

import { createPost, softDeletePost, updatePost } from "@/lib/data/post";
import { upsertUserPreferences } from "@/lib/data/user-preferences";
import { db } from "@/lib/db";
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

export async function createPostAction(formData: FormData) {
  const title = formData.get("title") as string;
  const slug = formData.get("slug") as string;
  const excerpt = formData.get("excerpt") as string;
  const content = formData.get("content") as string;

  if (!title || !slug || !excerpt) return;

  const author = await getOrCreateDemoAuthor();
  await createPost({
    title, slug, excerpt, content: content || undefined, authorId: author.id
  })
  revalidatePath("/posts");
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