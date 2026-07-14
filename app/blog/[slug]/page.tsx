import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import CommentSection from "./components/CommentsSection";

export default async function BlogPostPage({ 
  params 
}: { 
  params: Promise<{slug: string}> 
}) {
    const {slug} = await params;

    return (
      <article className="max-w-3xl mx-auto p-8">
        {/* Render utama, yang enteng */}
        <div className="mb-12">
          <p className="text-blue-500 font-semibold mb-2">Artikel Blog /{slug}</p>
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Streaming di Next.JS</h1>
          <p className="text-lg text-slate-700 leading-relaxed">Ini adalah artikel yang tidak perlu dirender lama, enteng sekali</p>
        </div>

        {/* Bagian yang akan dirender lama (KOMENTAR) */}
        <hr />
        {/* Error boundary, kalau komentar gagal, halaman artikel akan tetap aman */}
        <ErrorBoundary
          fallback={
            <div className="mt-8 p-4 bg-red-50 text-red-600 border border-red-200 rounded-lg">
              Gagal memuat section komentar. Silahkan refresh halaman secara berkala.
            </div>
          }>

            {/* Suspense untuk menampilkan loading ketika fetch data */}
            <Suspense
              fallback={
                <div className="mt-8 p-6 bg-slate-50 rounded-xl border border-slate-200 animate-pulse">
                  <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
                  <div className="h-20 bg-slate-200 rounded w-full"></div>
                </div>
              }>
                <CommentSection slug="{slug}"/>
            </Suspense>
        </ErrorBoundary>

      </article>
    )
}