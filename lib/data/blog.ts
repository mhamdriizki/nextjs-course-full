import { PostPreview } from "@/app/type";
import { cacheLife, cacheTag } from "next/cache";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const FAKE_DB_POST = [
  { id: "1", title: "Belajar Next.js" },
  { id: "2", title: "Belajar Cache Component" },
]

// Mock like state (data mutasi user, dipisah dari cache "use cache")
const POST_LIKES: Record<string, { liked: boolean; likeCount: number }> = {
  "1": { liked: false, likeCount: 12 },
  "2": { liked: true, likeCount: 8 },
  "3": { liked: false, likeCount: 0 },
};

export async function toggleLikeInDb(postId: string) {
  await delay(400); // simulasi network
  const current = POST_LIKES[postId];
  current.liked = !current.liked;
  current.likeCount += current.liked ? 1 : -1;
  return current;
}

// Mock get all post
export async function getPublishedPosts(): Promise<PostPreview[]> {
  "use cache"
  cacheLife('blog')
  cacheTag("blog-posts")
  await delay(1500);

  return [
    { id: "1", title: "Belajar Next.js", slug: "belajar-next", published: true, ...POST_LIKES["1"] },
    { id: "2", title: "Memahami App Router", slug: "memahami-app-router", published: true, ...POST_LIKES["2"] },
    { id: "3", title: "Server Components", slug: "server-components", published: false, ...POST_LIKES["3"] }
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

export async function getPosts() {
  "use cache";

  cacheTag("blog-posts");

  await new Promise((res) => setTimeout(res, 1500));
  return FAKE_DB_POST;
}

export async function addPostToDb(title: string) {
  const newPost = { id: Date.now().toString(), title: title };
  FAKE_DB_POST.push(newPost);
}