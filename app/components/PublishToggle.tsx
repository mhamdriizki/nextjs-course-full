'use client'

import { useRouter } from "next/navigation"
import { useTransition } from "react";
import { publishPostAction } from "../posts/action";
import { Button } from "@/components/ui/button";

export function PublishToggle({ postId }: { postId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleToggle() {
    startTransition(async () => {
      // 1. Eksekusi mutasi
      await publishPostAction(postId);

      // 2. minta next.js untuk render ulang halaman
      router.refresh();
    })
  }

  return (
    <Button
      onClick={handleToggle}
      disabled={isPending}
      className="underline text-blue-600 disabled:text-gray-400">
        {isPending ? "Publishing . . ." : "Publish"}
    </Button>
  )
}