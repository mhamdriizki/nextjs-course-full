"use client"

import { PostPreview } from "@/app/type"
import { PostList } from "@/app/blog/components/PostList"
import { useEffect, useState } from "react"

export default function BlogClientPage() {
  const [posts, setPosts] = useState<PostPreview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function ambilPosts() {
      try {
        const res = await fetch("/api/posts")
        if (!res.ok) throw new Error("Gagal mengambil data artikel")
        setPosts(await res.json())
      } catch (e) {
        setError(e instanceof Error ? e.message : "Terjadi kesalahan")
      } finally {
        setLoading(false)
      }
    }
    ambilPosts()
  }, [])

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-slate-900">
        Artikel Blog
      </h1>

      <p className="text-slate-500">
        Data diambil di browser lewat useEffect
      </p>

      {loading && <p className="mt-4 text-slate-500">Memuat artikel...</p>}
      {error && <p className="mt-4 text-red-600">Error: {error}</p>}
      {!loading && !error && <PostList post={posts}/>}
    </div>
  )
}
