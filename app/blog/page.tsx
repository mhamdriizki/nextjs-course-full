import { getPosts, getPublishedPosts, getTrendingTags } from "@/lib/data/blog";
import { PostList } from "./components/PostList"
import { Suspense } from "react";
import { CategorySidebar } from "./components/CategorySidebar";
import { LiveViewers } from "./components/LiveViewer";
import { PopularPosts } from "./components/PopularPosts";
import { AddPostForm } from "./components/AddPostForm";

export default async function BlogPage() {
  // Panggil data (Ini akan memanggil cache dari memori, sangat cepat setelah render pertama!)
  const posts = await getPosts();

  console.time("Mengukur waktu fetch");
  const post = await getPublishedPosts();
  console.timeEnd("Mengukur waktu fetch")

  return (
    <div className="max-w-5xl mx-auto p-8">
      <h1 className="text-4xl font-extrabold text-slate-900 mb-2">
        Artikel Blog
      </h1>
      <LiveViewers/>

      {/* Trending tags tapi menggunakan Suspense */}
      <Suspense fallback={<p className="text-slate-500 mb-8">Loading data . . .</p>}>
        <TrendingTags/>
      </Suspense>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Post (kolom di kiri) */}
        <div className="md:col-span-2">
          <PostList post={post}/>

          <PopularPosts/>
        </div>

        {/* Sidebar (kolom di kanan) */}
        <div>
          <Suspense 
            fallback={
              <div className="p-6 bg-slate-100 rounded-xl animate-pulse h-40">
                Loading Kategori . . .
              </div>
              }>
                <CategorySidebar/>
          </Suspense>
        </div>
      </div>

      <div className="max-w-5xl mx-auto mt-8">
        <h1 className="text-4xl font-extrabold mb-8 text-slate-900">Manajemen Blog 📝</h1>
      
        {/* Form untuk nambah data & memicu Invalidasi Cache */}
        <AddPostForm />

        <h2 className="text-xl font-bold mb-4 text-slate-800">Daftar Artikel (Di-Cache)</h2>
        <ul className="space-y-3">
          {posts.map((post) => (
            <li key={post.id} className="p-4 bg-white border border-slate-200 rounded shadow-sm text-slate-700 font-medium">
              ✅ {post.title}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

async function TrendingTags() {
  const trendingTags = await getTrendingTags().catch(() => ["#Next.js", "#React"]);

  return (
    <p className="text-slate-500 mb-8">
      Trending saat ini adalah {trendingTags.join(", ")}
    </p>
  )
}