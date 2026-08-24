import { getPostBySlug, incrementPostViewCount } from "@/lib/data/post";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

export default async function PostDetailPage({
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
  const { slug } = await params;
  await connection();

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