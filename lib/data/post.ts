import { db } from "@/lib/db";

export async function createPost(data: {
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  authorId: string;
}) {
  return db.post.create({
    data,
    include: { author: { select: { name: true } } },
  });
}

export async function getPostBySlug(slug: string) {
  return db.post.findFirst({
    where: { slug, deletedAt: null },
    include: { author: { select: { name: true, email: true } } },
  });
}

export async function listPublishedPosts() {
  return db.post.findMany({
    where: { published: true, deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      viewCount: true,
      createdAt: true,
      author: { select: { name: true } },
    },
  });
}

export async function updatePost(
  id: string,
  data: Partial<{
    title: string;
    excerpt: string;
    content: string;
    published: boolean;
  }>
) {
  return db.post.update({
    where: { id },
    data,
  });
}

export async function incrementPostViewCount(id: string) {
  return db.post.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  });
}

export async function softDeletePost(id: string) {
  return db.post.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
