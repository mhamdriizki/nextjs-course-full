'use client'

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { publishPostAction } from '@/app/posts/action';

export function PublishToggle({ postId }: { postId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleToggle() {
    startTransition(async () => {
      // 1. Eksekusi mutasi (tanpa revalidate di server karena di action sudah dihapus)
      await publishPostAction(postId);
      // 2. Minta Next.js merender ulang halaman ini dengan data terbaru secara in-place
      router.refresh();
    });
  }

  return (
    <button 
      onClick={handleToggle} 
      disabled={isPending}
      className="underline text-blue-600 disabled:text-gray-400"
    >
      {isPending ? 'Publishing...' : 'Publish'}
    </button>
  );
}
