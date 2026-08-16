'use client'

import { useTransition } from 'react';
import { softDeletePostAction } from '@/app/posts/action';
import { toast } from 'sonner';

export function DeleteButton({ postId }: { postId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    // Bungkus pemanggilan Server Action ke dalam startTransition
    startTransition(async () => {
      const result = await softDeletePostAction(postId);
      
      if (result.success) {
        toast.success('Post berhasil dihapus!');
      } else {
        toast.error(result.message || 'Terjadi kesalahan');
      }
    });
  }

  return (
    <button 
      onClick={handleDelete} 
      disabled={isPending}
      className={`px-4 py-2 rounded text-sm transition-all ${
        isPending ? 'bg-gray-400 text-gray-200 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 text-white'
      }`}
    >
      {isPending ? 'Sedang menghapus...' : 'Hapus Post'}
    </button>
  );
}
