import { getPostBySlug, incrementPostViewCount } from "@/lib/data/post";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { db } from "@/lib/db";

// Tanpa ini, Next gak tau daftar slug yang valid di build time, jadi
// seluruh route dianggap fully dynamic (gak ada static shell sama sekali).
// Slug baru yang belum ke-generate di sini tetap jalan (on-demand di request).
export async function generateStaticParams() {
  const posts = await db.post.findMany({
    where: { published: true, deletedAt: null },
    select: { slug: true },
  });

  if (posts.length === 0) {
    // Cache Components mewajibkan minimal 1 param buat validasi build-time.
    // Slug ini gak akan ketemu post-nya -> ditangani notFound() di bawah.
    return [{ slug: "__placeholder__" }];
  }

  return posts.map((post) => ({ slug: post.slug }));
}

export default function PostDetailPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  return (
    <Suspense fallback={<p>Loading . . .</p>}>
      <PostDetailContent params={params}/>
    </Suspense>
  )
}

async function PostDetailContent({ params }: { params: Promise<{ slug: string }> }) {
  await connection();

  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) notFound();

  await incrementPostViewCount(post.id);

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1>{post.title}</h1>
      <p>Oleh {post.author.name} - {post.author.email}</p>
      <p>sudah {post.viewCount} view, bisa tambah 1 {post.viewCount+1}</p>

      <p>{post.content ?? "belum ada konten"}</p>
    </div>
  )
  
}