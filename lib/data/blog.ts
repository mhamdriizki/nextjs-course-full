import { cacheLife } from "next/cache";
import { PostPreview } from "@/app/type";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock get all post
export async function getPublishedPosts(): Promise<PostPreview[]> {
  'use cache'
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
  'use cache'
  cacheLife('blog')
  await delay(1000);
  return ["Tutorial", "Tips & Trick", "Berita"];
}

// Mock get all trending tag
// Sengaja TIDAK pakai 'use cache' — fungsi ini didesain bisa gagal (mock crash)
// dan errornya perlu bisa ditangkap pemanggil (lihat penggunaan .catch di blog/page.tsx).
// 'use cache' pada Next.js versi ini menjadikan error di dalamnya fatal saat build,
// jadi data yang berpotensi gagal harus tetap uncached + dirender via <Suspense>.
export async function getTrendingTags(): Promise<string[]> {
  await delay(500);
  throw new Error("Database trending sedang crash");
}