import { Suspense } from "react";
import { createPostAction, publishPostAction, softDeletePostAction } from "./action";
import { connection } from "next/server";
import { getPosts, listPublishPosts } from "@/lib/data/post";
import { db } from "@/lib/db";
import Link from "next/link";

const CATEGORIES = ["Tutorial", "Tips & Trick", "Berita"];

export default function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
}) {
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

      <div className="border-t pt-6">
        <h2 className="font-semibold">🔍 Jelajahi Post (Bab 7)</h2>
        <p className="text-xs text-slate-500 mb-2">
          Cuma post yang sudah <strong>published</strong> — dipaginasi 10/halaman, bisa dicari &amp; difilter kategori.
          Post yang masih draft tidak akan muncul di sini.
        </p>
        <Suspense fallback={<p>Memuat hasil pencarian...</p>}>
          <PublishedPosts searchParams={searchParams} />
        </Suspense>
      </div>

      <div className="border-t pt-6">
        <h2 className="font-semibold">🛠️ Panel Admin — Semua Post (Bab 6)</h2>
        <p className="text-xs text-slate-500 mb-2">
          Semua post (draft &amp; published), tanpa filter/pagination. Dipakai buat publish atau hapus post baru —
          termasuk yang belum muncul di section pencarian di atas.
        </p>
        <Suspense fallback={<p>Loading . . .</p>}>
          <PostList/>
        </Suspense>
      </div>
    </div>
  )
}

async function PublishedPosts({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
}) {
  await connection();

  const { q, category, page } = await searchParams;
  const parsedPage = Number(page);
  const currentPage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const result = await getPosts({ query: q, category, page: currentPage });

  const buildPageUrl = (targetPage: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    params.set("page", String(targetPage));
    return `/posts?${params.toString()}`;
  };

  return (
    <div className="space-y-3">
      <form method="GET" className="flex flex-wrap gap-2 border rounded-lg p-3">
        <input
          type="text"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Cari judul atau excerpt..."
          className="border p-2 rounded flex-1 min-w-40"
        />
        <select name="category" defaultValue={category ?? ""} className="border p-2 rounded">
          <option value="">Semua kategori</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button type="submit" className="bg-slate-900 text-white px-4 py-2 rounded">
          Cari
        </button>
      </form>

      {result.posts.length === 0 ? (
        <p className="text-sm text-slate-500">Tidak ada post yang cocok.</p>
      ) : (
        <ul className="space-y-2">
          {result.posts.map((post) => (
            <li key={post.id} className="border rounded p-3">
              <Link href={`/posts/${post.slug}`} className="font-medium underline">
                {post.title}
              </Link>
              <p className="text-xs text-slate-500">
                {post.category ?? "Tanpa kategori"} · {post.excerpt}
              </p>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-between text-sm">
        {result.hasPrev ? (
          <Link href={buildPageUrl(currentPage - 1)} className="underline">
            ← Sebelumnya
          </Link>
        ) : (
          <span />
        )}
        <span className="text-slate-500">
          Halaman {result.currentPage} dari {result.totalPages || 1} ({result.total} total)
        </span>
        {result.hasNext ? (
          <Link href={buildPageUrl(currentPage + 1)} className="underline">
            Berikutnya →
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
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
    <div className="space-y-3">
      <p className="text-xs text-slate-500">
        {post.length} dari {allPosts.length} post di bawah ini sudah published (sisanya masih draft).
      </p>
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
  )
}
