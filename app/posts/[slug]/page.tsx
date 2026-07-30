import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getPostBySlug, incrementPostViewCount } from "@/lib/data/post";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <Suspense fallback={<p className="p-8 text-slate-400">Memuat post…</p>}>
      <PostDetailContent slug={slug} />
    </Suspense>
  );
}

async function PostDetailContent({ slug }: { slug: string }) {
  // Halaman ini mutasi viewCount tiap dibuka — deklarasikan eksplisit
  // sebagai per-request dynamic, bukan sesuatu yang boleh di-cache.
  await connection();

  const post = await getPostBySlug(slug);

  if (!post) notFound();

  // Atomic increment — setiap kali detail post dibuka
  await incrementPostViewCount(post.id);

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold">{post.title}</h1>
      <p className="text-sm text-slate-500 mb-4">
        Oleh {post.author.name} · {post.viewCount + 1} views (setelah increment ini)
      </p>
      <p className="text-slate-600 italic mb-4">{post.excerpt}</p>
      <p>{post.content ?? "(belum ada konten)"}</p>
    </div>
  );
}
