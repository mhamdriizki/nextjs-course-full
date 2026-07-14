import { PostPreview } from "@/app/type";
import { cacheLife, cacheTag } from "next/cache";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 1. FAKE DATABASE (Pakai 'let' biar datanya bisa ditambah)
export const FAKE_DB_POSTS = [
  { id: "1", title: "Belajar Next.js 16" },
  { id: "2", title: "Memahami App Router" },
];

// Mock get all post
export async function getPublishedPosts(): Promise<PostPreview[]> {
  "use cache"
  cacheLife('blog')
  await delay(1500);

  return [
    { id: "1", title: "Belajar Next.js", slug: "belajar-next", published: true },
    { id: "2", title: "Memahami App Router", slug: "memahami-app-router", published: true },
    { id: "3", title: "Server Components", slug: "server-components", published: false }
  ]
}

// Mock get all categories
export async function getCategories(): Promise<string[]> {
  "use cache"
  cacheLife("blog")
  await delay(1000);
  return ["Tutorial", "Tips & Trick", "Berita"];
}

// Mock get all trending tag
export async function getTrendingTags(): Promise<string[]> {
  await delay(500);
  throw new Error("Database trending sedang crash");
}

// 2. FUNGSI FETCH (Yang Di-cache)
export async function getPosts() {
  "use cache";
  
  // MAGIC WORD 1: Pasang Label (Tag) di cache ini!
  cacheTag("blog-posts");

  await new Promise((res) => setTimeout(res, 1500)); // Simulasi query lambat
  return FAKE_DB_POSTS;
}

// 3. FUNGSI MUTASI (Simpan ke DB)
export async function addPostToDB(title: string) {
  const newPost = { id: Date.now().toString(), title };
  FAKE_DB_POSTS.push(newPost);
}