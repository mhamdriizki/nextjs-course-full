import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import { notFound } from "next/navigation";
import CommentSection from "./components/CommentsSection";
import { getPublishedPosts } from "@/lib/data/blog";
import { getPostBySlug } from "@/lib/data/post";

export async function generateStaticParams() {
  const post = await getPublishedPosts();
  return post.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  "use cache"
  cacheLife("blog")

  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return { title: "Artikel tidak ditemukan" };
  }

  return {
    title: post.title,
    description: post.excerpt,
    alternates: {
      canonical: `/blog/${slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
    },
  };
}

export default async function BlogPostPage({
  params
}: {
  params: Promise<{slug: string}>
}) {
  return (
    <Suspense
      fallback={<div>Loading . . </div>}>
        <BlogPostContent params={params}/>
    </Suspense>
  )
}

async function BlogPostContent({
  params
}: {
  params: Promise<{slug: string}>
}) {
  "use cache"
  cacheLife("blog")

  const {slug} = await params;
  const post = await getPostBySlug(slug);

  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    author: { "@type": "Person", name: post.author.name },
    datePublished: post.createdAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
  };

  return (
    <article className="max-w-3xl mx-auto p-8">
      {/* JSON-LD structured data buat rich results Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      {/* Render utama, yang enteng */}
      <div className="mb-12">
        <p className="text-blue-500 font-semibold mb-2">Artikel Blog /{slug}</p>
        <h1 className="text-4xl font-extrabold text-slate-900 mb-4">{post.title}</h1>
        <p className="text-lg text-slate-700 leading-relaxed">{post.excerpt}</p>
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
              <CommentSection slug={slug}/>
          </Suspense>
      </ErrorBoundary>
    </article>
  )

}