"use client"

import { PostPreview } from "@/app/type"
import { PostList } from "@/app/blog/components/PostList"
import { useEffect, useState } from "react"

export default function BlogClientPage() {
  const [posts, setPosts] = useState<PostPreview[]>([])

  useEffect(() => {
    fetch("/api/posts")
      .then((res) => res.json())
      .then((data) => setPosts(data))
  }, [])

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-slate-900">
        Artikel Blog
      </h1>

      <p className="text-slate-500">
        Data diambil di browser lewat useEffect
      </p>

      <PostList post={posts}/>
    </div>
  )
}
