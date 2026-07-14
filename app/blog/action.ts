"use server"; // Wajib karena ini aksi Backend (Mutasi)

import { updateTag } from "next/cache";
import { addPostToDB } from "@/lib/data/blog";

export async function createPostAction(formData: FormData) {
  const title = formData.get("title") as string;
  if (!title) return;

  // 1. Simpan data ke Database
  await addPostToDB(title);

  // 2. JURUS PAMUNGKAS: Hancurkan Cache berdasarkan Label!
  // Karena ini adalah aksi Create/Delete (data baru), kita pakai updateTag (Read-Your-Writes)
  // Kalau aksi Edit biasa (data lama berubah), kita pakai revalidateTag("blog-posts", "max")
  updateTag("blog-posts"); 
}
