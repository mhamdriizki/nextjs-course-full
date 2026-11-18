"use client"

import useSWR from "swr"
import { PostPreview } from "@/app/type"
import { PostList } from "@/app/blog/components/PostList"

const fetcher = (url: string): Promise<PostPreview[]> =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Gagal mengambil data artikel")
    return res.json()
  })

export default function BlogClientPage() {
  const { data, error, isLoading } = useSWR("/api/posts", fetcher)

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-slate-900">
        Artikel Blog
      </h1>

      <p className="text-slate-500">
        Data diambil di browser lewat SWR
      </p>

      {isLoading && <p className="mt-4 text-slate-500">Memuat artikel...</p>}
      {error && <p className="mt-4 text-red-600">Error: {error.message}</p>}
      {data && <PostList post={data}/>}
    </div>
  )
}
