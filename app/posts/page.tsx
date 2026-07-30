import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { listPublishedPosts } from "@/lib/data/post";
import {
  createPostAction,
  publishPostAction,
  softDeletePostAction,
} from "./actions";

export default function PostsPage() {
  return (
    <div className="max-w-2xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Demo CRUD — Post (Bab 6)</h1>
        <p className="text-sm text-slate-500">
          Halaman ini contoh nyata createPost, updatePost, softDeletePost yang sudah dieksekusi ke database.
        </p>
      </div>

      <form action={createPostAction} className="space-y-2 border rounded-lg p-4">
        <input name="title" placeholder="Judul" className="border p-2 w-full rounded" required />
        <input name="slug" placeholder="Slug (unik)" className="border p-2 w-full rounded" required />
        <input name="excerpt" placeholder="Excerpt (wajib)" className="border p-2 w-full rounded" required />
        <textarea name="content" placeholder="Content (opsional)" className="border p-2 w-full rounded" />
        <button type="submit" className="bg-slate-900 text-white px-4 py-2 rounded">
          Buat Post
        </button>
      </form>

      {/* Data live dari database (bukan konten statis) — dibungkus Suspense
          sesuai pola "streaming uncached data" Cache Components, bukan di-cache. */}
      <Suspense fallback={<p className="text-sm text-slate-400">Memuat data post…</p>}>
        <PostList />
      </Suspense>
    </div>
  );
}

async function PostList() {
  // Data live per-request dari Postgres, bukan sesuatu yang boleh dianggap
  // statis oleh Cache Components — deklarasikan eksplisit lewat connection().
  await connection();

  const posts = await listPublishedPosts();

  const allPosts = await db.post.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, slug: true, published: true, viewCount: true },
  });

  return (
    <>
      <div>
        <h2 className="font-semibold mb-2">Semua Post (belum di-soft-delete)</h2>
        <ul className="space-y-2">
          {allPosts.map((post) => (
            <li key={post.id} className="border rounded p-3 flex items-center justify-between gap-2">
              <div>
                <Link href={`/posts/${post.slug}`} className="font-medium underline">
                  {post.title}
                </Link>
                <p className="text-xs text-slate-500">
                  {post.published ? "Published" : "Draft"} · {post.viewCount} views
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
        <h2 className="font-semibold mb-2">Published Post (listPublishedPosts)</h2>
        <p className="text-sm text-slate-500">{posts.length} post published & belum dihapus.</p>
      </div>
    </>
  );
}
