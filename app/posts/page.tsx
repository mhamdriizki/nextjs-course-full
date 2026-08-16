import { Suspense } from "react";
import { createPostAction, publishPostAction, softDeletePostAction } from "./action";
import { connection } from "next/server";
import { getPosts, listPublishPosts } from "@/lib/data/post";
import { db } from "@/lib/db";
import Link from "next/link";
import { CreatePostForm } from "./CreatePostForm";
import { DeleteButton } from "@/components/DeleteButton";
import { PublishToggle } from "@/components/PublishToggle";

const CATEGORIES = ["Technology", "Lifestyle", "Travel", "Food", "Education"];

export default function PostsPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string, category?: string, page?: string }>; 
}) {
  return (
    <div className="max-w-2xl mx-auto p-8 space-y-8">
      <div>
        <h2>Coba versi <Link href={"/posts/new"} className="underline">react-hook-form</Link></h2>
        <h1>DEMO CRUD - POST</h1>
        <p>Halaman ini contoh nyata dari createPost, updatePost, softDelete</p>
      </div>

      <CreatePostForm/>

      <div className="border-t pt-6">
        <h2 className="font-semibold">Jelajah post</h2>
        <p>Hanya post yang sudah published dan dibagi menjadi 10 data per halaman, bisa dicari di sini</p>

        <Suspense fallback={<p>Loading . . .</p>}>
          <PublilshedPosts searchParams={searchParams}/>
        </Suspense>
      </div>

      <div className="border-t pt-6">
        <h2 className="font-semibold">Panel admin</h2>
        <p>Semua post tanpa pagination</p>
        
        <Suspense fallback={<p>Loading . . .</p>}>
          <PostList/>
        </Suspense>
      </div>
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
                {!post.published && <PublishToggle postId={post.id} />}
                <DeleteButton postId={post.id} />
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

async function PublilshedPosts({
  searchParams
}: {
  searchParams: Promise<{ q?: string, category?: string, page?: string }>;  
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
      <form method="get" className="flex flex-wrap gap-2 border rounded-lg p-3">
        <input
          type="text"
          name="q"
          placeholder="Cari judul atau excerpt..."
          defaultValue={q ?? ""}
          className="border p-2 rounded flex-1 min-w-40"
        />

        <select name="category" defaultValue={category ?? ""} className="border p-2 rounded">
          <option value="">Semua kategori</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <button type="submit" className="bg-slate-900 text-white px-4 py-2 rounded">
          Cari
        </button>
      </form>

      {result.posts.length === 0 ? (
        <p>Tidak ada post yang ditemukan</p>
      ) : (
        <ul className="space-y-2">
          {result.posts.map((post) => (
            <li key={post.id} className="border rounded p-3">
              <Link href={`/posts/${post.slug}`} className="font-medium underline">
                {post.title}
              </Link>
              <p className="text-xs text-slate-500">{post.category ?? "Tanpa kategori"} - {post.excerpt}</p>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-between gap-2 text-sm">
        {result.hasPrev ? (
          <Link href={buildPageUrl(result.currentPage - 1)} className="underline">
            Sebelumnya
          </Link>
        ) : (
          <span/>
        )}
        <span>Halaman {result.currentPage} dari {result.totalPages}</span>
        {result.hasNext ? (
          <Link href={buildPageUrl(result.currentPage + 1)} className="underline">
            Selanjutnya
          </Link>
        ) : (
          <span/>
        )}
      </div>
    </div>
  )
}