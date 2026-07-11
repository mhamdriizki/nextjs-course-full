import { PostPreview } from "@/app/type";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock get all post
export async function getPublishedPosts(): Promise<PostPreview[]> {
  await delay(1500);

  return [
    { id: "1", title: "Belajar Next.js", slug: "belajar-next", published: true },
    { id: "2", title: "Memahami App Router", slug: "memahami-app-router", published: true },
    { id: "3", title: "Server Components", slug: "server-components", published: false }
  ]
}

// Mock get all categories
export async function getCategories(): Promise<string[]> {
  await delay(1000);
  return ["Tutorial", "Tips & Trick", "Berita"];
}

// Mock get all trending tag
export async function getTrendingTags(): Promise<string[]> {
  await delay(500);
  throw new Error("Database trending sedang crash");
}