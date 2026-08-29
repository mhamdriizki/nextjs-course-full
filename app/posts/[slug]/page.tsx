import { auth } from "@/lib/auth";
import { getPostBySlug, getPosts, incrementPostViewCount } from "@/lib/data/post";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { DeletePostButton } from "./DeletePostButton";

export async function generateStaticParams() {
  const { posts } = await getPosts({});
  return posts.map((post) => ({ slug: post.slug }));
}

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
  await connection();

  const {slug} = await params;
  const post = await getPostBySlug(slug);
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!post) notFound();

  await incrementPostViewCount(post.id);

  const isAdmin = session?.user.role === "ADMIN";
  const isAuthor = session?.user.id === post.author.email;

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1>{post.title}</h1>
      <p>Oleh {post.author.name} - {post.author.email}</p>
      <p>sudah {post.viewCount} view, bisa tambah 1 {post.viewCount+1}</p>

      <p>{post.content ?? "belum ada konten"}</p>

      {/* Tambah tombol edit hanya untuk author + admin */}
      {(isAuthor || isAdmin) && (
        <div className="flex gap-2 mt-4">
          <a href={`/posts/${slug}/edit`}>
            <button>Edit</button>
          </a>

          {/* Tombol hapus untuk admin */}
          {isAdmin && <DeletePostButton postId={post.id}/>}
        </div>
      )}
    </div>
  )
  
}