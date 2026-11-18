import type { PostPreview } from "@/app/type"

// Data sementara pengganti database, nanti diganti query Prisma
const posts: PostPreview[] = [
  { id: "1", title: "Belajar Next.js", slug: "belajar-next", published: true },
  { id: "2", title: "Memahami App Router", slug: "memahami-app-router", published: true },
  { id: "3", title: "Server Components", slug: "server-components", published: false },
]

export async function getPosts(): Promise<PostPreview[]> {
  // Simulasi delay/loading
  await new Promise((resolve) => setTimeout(resolve, 1000))
  return posts
}
