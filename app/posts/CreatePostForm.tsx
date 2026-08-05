"use client";

import { useActionState } from "react";
import { createPostAction } from "./action";

export function CreatePostForm() {
  const [state, formAction, isPending] = useActionState(createPostAction, null);

  const errors = state && !state.success ? state.errors : undefined;

  return (
    <form action={formAction} className="space-y-2 border rounded-lg p-4">
      <div>
        <input
          type="text"
          name="title"
          placeholder="Judul Post"
          className="border p-2 w-full rounded"/>

          {errors?.title && (
            <p className="text-red-500 text-xs mt-1">{errors.title[0]}</p>
          )}
      </div>

      <div>
        <input
          type="text"
          name="slug"
          placeholder="Slug"
          className="border p-2 w-full rounded"/>

          {errors?.slug && (
            <p className="text-red-500 text-xs mt-1">{errors.slug[0]}</p>
          )}
      </div>

      <div>
        <input
          type="text"
          name="excerpt"
          placeholder="Ringkasan"
          className="border p-2 w-full rounded"/>

          {errors?.excerpt && (
            <p className="text-red-500 text-xs mt-1">{errors.excerpt[0]}</p>
          )}
      </div>

      <div>
        <input
          type="text"
          name="content"
          placeholder="Konten"
          className="border p-2 w-full rounded"/>

          {errors?.content && (
            <p className="text-red-500 text-xs mt-1">{errors.content[0]}</p>
          )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="bg-slate-900 text-white px-4 py-2 rounded disabled:opacity-50">
        {isPending ? "Menyimpan..." : "Simpan Post"}
      </button>

      {state?.success && <p className="text-green-500 text-sm">Post berhasil dibuat</p>}
    </form>
  )
}