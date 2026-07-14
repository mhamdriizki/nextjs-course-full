"use server";

import { addPostToDb } from "@/lib/data/blog";
import { updateTag } from "next/cache";

export async function createPostAction(formData: FormData) {
  const title = formData.get("title") as string;
  if (!title) return;

  // 1. simpan ke db
  await addPostToDb(title);

  // 2. destroy cache berdasarkan label
  updateTag("blog-posts")
}