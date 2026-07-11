import { PostPreview } from "../type"
import { PostList } from "./components/PostList"

export default async function BlogPage() {
  const dataPostDariDb: PostPreview[] = [
    { id: "1", title: "Belajar Next.js", slug: "belajar-next", published: true },
    { id: "2", title: "Memahami App Router", slug: "memahami-app-router", published: true },
    { id: "3", title: "Server Components", slug: "server-components", published: false }
  ]

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-slate-900">
        Artikel Blog
      </h1>

      <p className="text-slate-500">
        Daftar artikel yang Type-safe dari server ke client
      </p>
      
      <PostList post={dataPostDariDb}/>
    </div>
  )
}