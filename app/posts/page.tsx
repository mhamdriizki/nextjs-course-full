import { Suspense } from "react";
import { createPostAction, publishPostAction, softDeletePostAction } from "./action";
import { connection } from "next/server";
import { listPublishPosts } from "@/lib/data/post";
import { db } from "@/lib/db";
import Link from "next/link";

export default function PostsPage() {
  return (
    <div className="max-w-2xl mx-auto p-8 space-y-8">
      <div>
        <h1>DEMO CRUD - POST</h1>
        <p>Halaman ini contoh nyata dari createPost, updatePost, softDelete</p>
      </div>

      <form action={createPostAction} className="space-y-2 border rounded-lg p-4">
        <input type="text" name="title" placeholder="Judul" className="border p-2 w-full rounded" required />
        <input type="text" name="slug" placeholder="Slug (harus unik)" className="border p-2 w-full rounded" required />
        <input type="text" name="excerpt" placeholder="Excerpt" className="border p-2 w-full rounded" required />
        <textarea name="content" placeholder="Konten (opsional)" className="border p-2 w-full rounded"/>

        <button type="submit" className="bg-slate-900 text-white px-4 py-2 rounded">
          Buat Post
        </button>
      </form>

      <Suspense fallback={<p>Loading . . .</p>}>
        <PostList/>
      </Suspense>
    </div>
  )
}

async function PostList() {
  await connection();

  const post = await listPublishPosts();

  const allPosts = await db.post.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, slug: true, published: true, viewCount: true }
  });

  return (
    <>
      <div>
        <h2>Semua post yang belum dibuat soft-delete</h2>
        <ul className="space-y-2">
          {allPosts.map((post) => (
            <li key={post.id} className="border rounded p-3 flex items-center justify-between gap-w">
              <div>
                <Link href={`/posts/${post.slug}`} className="font-medium underline">
                  {post.title}
                </Link>
                <p className="text-xs text-slate-500">
                  {post.published ? "Published" : "Draft"} - {post.viewCount} views
                </p>
              </div>
              <div className="flex gap-2 text-sm">
                {!post.published && (
                  <form action={publishPostAction.bind(null, post.id)}>
                    <button className="underline">Publish</button>
                  </form>
                )}
                <form action={softDeletePostAction.bind(null, post.id)}>
                  <button className="text-red-500 underline">Hapus</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2>Published post</h2>
        <p>{post.length} post published & belum dihapus</p>
      </div>
    </>
  )
}