"use client"

import { PostPreview } from "@/app/type"
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { FilterButton } from "./FilterButton";
import { LikeButton } from "./LikeButton";

interface PostListProps {
  post: PostPreview[];
  activeFilter: string;
}

export function PostList({
  post,
  activeFilter
}: PostListProps) {

  return (
    <div className="mt-4">
      {/* Kontrol filter baru */}
      <FilterButton activeFilter={activeFilter}/>

      {/* Menampilkan data */}
      <div className="grid gap-4">
        {post.map((p) => (
          <div 
            key={p.id}
            className="p-4 border rounded-lg bg-white shadow-sm">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold tex-slate-800">{p.title}</h3>
                <span className={`text-xs px-2 py-1 rounded-full ${p.published ? 'bg-green-100 text-green-800}' : 'bg-yellow-100 text-yellow-800'}`}>
                  {p.published ? 'Published' : 'Draft'}
                </span>
              </div>

              <p className="text-sm text-gray-500 mt-1">Slug: /{p.slug}</p>
              <LikeButton postId={p.id} initialLiked={p.liked} likeCount={p}/>

          </div>
        ))}
      </div>
    </div>
  )
}