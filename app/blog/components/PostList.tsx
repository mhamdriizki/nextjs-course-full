"use client"

import { PostPreview } from "@/app/type"
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface PostListProps {
  post: PostPreview[];
}

export function PostList({
  post
}: PostListProps) {
  // Declare data atau const
  const [filter, setFilter] = useState<"all" | "published">("all");

  const filteredPosts = filter === "all" ? post : post.filter((p) => p.published === true);

  return (
    <div className="mt-4">
      {/* Kontrol filter */}
      <div className="mb-6 flex gap-2">
        <Button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded ${filter === 'all' ? "bg-blue-600 text-white" : "bg-gray-200"}`}>
            Semua Artikel
        </Button>

        <Button
          onClick={() => setFilter("published")}
          className={`px-4 py-2 rounded ${filter === 'published' ? "bg-blue-600 text-white" : "bg-gray-200"}`}>
            Sudah Terbit
        </Button>
      </div>

      {/* Menampilkan data */}
      <div className="grid gap-4">
        {filteredPosts.map((post) => (
          <div key={post.id} className="p-4 border rounded-lg bg-white shadow-sm">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">{post.title}</h3>
              <span className={`text-xs px-2 py-1 rounded-full ${post.published ? 'bg-green-100 text-green-800}' : 'bg-yellow-100 text-yellow-800'}`}>
                {post.published ? 'Published' : 'Draft'}
              </span>
            </div>

            <p className="text-sm text-gray-500 mt-1">Slug: /{post.slug}</p>
          </div>
        ))}
      </div>
    </div>
  )
}