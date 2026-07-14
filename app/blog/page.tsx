import { getPublishedPosts, getTrendingTags } from "@/lib/data/blog";
import { PostPreview } from "../type"
import { PostList } from "./components/PostList"
import { Suspense } from "react";
import { CategorySidebar } from "./components/CategorySidebar";
import { LiveViewers } from "./components/LiveViewer";
import { PopularPosts } from "./components/PopularPosts";

export default async function BlogPage() {
  console.time("Mengukur waktu fetch");
  const post = await getPublishedPosts();
  console.timeEnd("Mengukur waktu fetch")

  return (
    <div className="max-w-5xl mx-auto p-8">
      <h1 className="text-4xl font-extrabold text-slate-900 mb-2">
        Artikel Blog
      </h1>
      <LiveViewers/>
      <Suspense fallback={<p className="text-slate-500 mb-8">Memuat trending...</p>}>
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
    </div>
  )
}

async function TrendingTags() {
  const trendingTags = await getTrendingTags().catch(() => ["#Next.js", "#React"]);

  return (
    <p className="text-slate-500 mb-8">
      Trending saat ini: {trendingTags.join(", ")}
    </p>
  )
}