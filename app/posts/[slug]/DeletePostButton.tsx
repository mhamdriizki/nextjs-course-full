"use client"

import { useRouter } from "next/navigation";
import { softDeletePostAction } from "../action";

export function DeletePostButton({ postId }: { postId: string }) {
  const router = useRouter();

  async function handleDelete() {
    const result = await softDeletePostAction(postId);
    if (result.success) {
      router.push("/posts");
      router.refresh();
    }
  }

  return <button onClick={handleDelete}>Hapus (Admin)</button>
}