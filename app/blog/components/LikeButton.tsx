"use client"

import { useOptimistic, useTransition } from "react";
import { toggleLikeAction } from "../action";

interface LikeButtonProps {
  postId: string;
  initialLiked: boolean;
  likeCount: number;
}

export function LikeButton({ postId, initialLiked, likeCount }: LikeButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticLiked, setOptimisticLiked] = useOptimistic(initialLiked);

  const handleLike = () => {
    startTransition(async () => {
      setOptimisticLiked(!optimisticLiked); // UI untuk update langsung like nya
      await toggleLikeAction(postId);
    })
  }

  const displayCount = likeCount + (optimisticLiked !== initialLiked ? (optimisticLiked ? 1 : -1) : 0);

  return (
    <button
      onClick={handleLike}
      disabled={isPending}
      className="mt-2 text-sm flex items-center gap-1 text-slate-600 disabled:opacity-50">
        {optimisticLiked ? "❤️" : "🩶"} {displayCount}
    </button>
  )
}

