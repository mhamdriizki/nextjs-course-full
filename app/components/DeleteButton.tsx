"use client";

import { useTransition } from "react";
import { softDeletePostAction } from "../posts/action";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function DeleteButton({ postId }: { postId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    // Bungkus pemanggilan server action ke dalam startTransition
    startTransition(async () => {
      const result = await softDeletePostAction(postId);

      if (result.success) {
        toast.success("Post berhasil dihapus");
      } else {
        toast.error(result.message || "Terjadi kesalahan");
      }
    });
  }

  return (
    <Button onClick={handleDelete} disabled={isPending}>
      {isPending ? "Sedang menghapus..." : "Hapus post"}
    </Button>
  );
}
