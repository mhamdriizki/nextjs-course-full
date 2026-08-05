"use client";

import { useActionState } from "react";
import { createPostAction, CreatePostActionState } from "./action";

const initialState: CreatePostActionState = {};

export function CreatePostForm() {
  const [state, formAction, isPending] = useActionState(createPostAction, initialState);

  return (
    <form action={formAction} className="space-y-2 border rounded-lg p-4">
      <div>
        <input
          type="text"
          name="title"
          placeholder="Judul Post"
          className="border p-2 w-full rounded"/>

          {state.errors?.title && (
            <p className="text-red-500 text-xs mt-1">{state.errors.title[0]}</p>
          )}
      </div>

      <div>
        <input
          type="text"
          name="slug"
          placeholder="Slug"
          className="border p-2 w-full rounded"/>

          {state.errors?.slug && (
            <p className="text-red-500 text-xs mt-1">{state.errors.slug[0]}</p>
          )}
      </div>

      <div>
        <input
          type="text"
          name="excerpt"
          placeholder="Ringkasan"
          className="border p-2 w-full rounded"/>

          {state.errors?.excerpt && (
            <p className="text-red-500 text-xs mt-1">{state.errors.excerpt[0]}</p>
          )}
      </div>

      <div>
        <input
          type="text"
          name="content"
          placeholder="Konten"
          className="border p-2 w-full rounded"/>

          {state.errors?.content && (
            <p className="text-red-500 text-xs mt-1">{state.errors.content[0]}</p>
          )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="bg-slate-900 text-white px-4 py-2 rounded disabled:opacity-50">
        {isPending ? "Menyimpan..." : "Simpan Post"}
      </button>

      {state.success && <p className="text-green-500 text-sm">Post berhasil dibuat</p>}
    </form>
  )
}