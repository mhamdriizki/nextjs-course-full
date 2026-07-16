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
      setOptimisticLiked(!optimisticLiked); // UI update LANGSUNG
      await toggleLikeAction(postId);        // Server Action (async)
      // kalau server error → React otomatis rollback ke initialLiked!
    });
  };

  const displayCount =
    likeCount + (optimisticLiked !== initialLiked ? (optimisticLiked ? 1 : -1) : 0);

  return (
    <button
      onClick={handleLike}
      disabled={isPending}
      className="mt-2 text-sm flex items-center gap-1 text-slate-600 disabled:opacity-50"
    >
      {optimisticLiked ? "❤️" : "🤍"} {displayCount}
    </button>
  );
}
