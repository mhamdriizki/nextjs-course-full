import { db } from "@/lib/db";
import { getPostBySlug, incrementPostViewCount } from "@/lib/data/post";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { DeletePostButton } from "./DeletePostButton";

export async function generateStaticParams() {
  const posts = await db.post.findMany({
    where: { published: true, deletedAt: null },
    select: { slug: true },
  });

  if (posts.length === 0) {
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
  const session = await auth.api.getSession({ headers: await headers() });
  const post = await getPostBySlug(slug);

  if (!post) notFound();

  await incrementPostViewCount(post.id);

  const isAdmin = session?.user.role === "ADMIN";
  const isAuthor = session?.user.id === post.author.id;

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1>{post.title}</h1>
      <p>Oleh {post.author.name} - {post.author.email}</p>
      <p>sudah {post.viewCount} view, bisa tambah 1 {post.viewCount+1}</p>

      <p>{post.content ?? "belum ada konten"}</p>

      {/* Tombol edit hanya untuk author + admin — ini cuma UX! */}
      {(isAuthor || isAdmin) && (
        <div className="flex gap-2 mt-4">
          <a href={`/posts/${slug}/edit`}>
            <button>Edit</button>
          </a>
          {/* Tombol delete hanya untuk admin — ini juga cuma UX! */}
          {isAdmin && <DeletePostButton postId={post.id} />}
        </div>
      )}
    </div>
  )

}