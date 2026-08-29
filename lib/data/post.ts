import { cacheTag } from "next/cache";
import { db } from "../db";
import { cache } from "react";

export async function createPost(data: {
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  authorId: string
}) {
  return db.post.create({
    data,
    include: {author: {select: {name: true }}}
  });
}

export const getPostBySlug = cache(async (slug: string) => {
  return db.post.findFirst({
    where: {slug, deletedAt: null},
    include: {author: { select: {name: true, email: true}}}
  })
})

export async function listPublishPosts() {
  "use cache"
  cacheTag("posts")

  return db.post.findMany({
    where: { published: true, deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      excerpt: true,
      viewCount: true,
      createdAt: true,
      author: { select: {name: true }}
    }
  });
}

export async function updatePost(
  id: string,
  data: Partial<{
    title: string;
    excerpt: string;
    content: string;
    published: boolean
  }>
) {
  return db.post.update({
    where: { id },
    data
  });
}

export async function incrementPostViewCount(id: string) {
  return db.post.update({
    where: { id },
    data: { viewCount: {increment: 1}}
  });
}

export async function softDeletePost(id: string, authorId?: string) {
  return db.post.update({
    where: authorId ? { id, authorId } : { id },
    data: { deletedAt: new Date() }
  });
}

// Pagination
const PAGE_SIZE = 10;

// Offset pagination - page number
export async function getPosts({
  query,
  category,
  page = 1
}: {
  query?: string;
  category?: string;
  page?: number;
}) {
  "use cache"
  cacheTag("posts")
  
  const where = {
    published: true,
    deletedAt: null,
    ...(category ? { category } : {}),
    ...(query
      ? {
        OR: [
          { title: { contains: query, mode: "insensitive" as const }},
          { excerpt: { contains: query, mode: "insensitive" as const }},
        ],
      }
    : {})
  };

  const [posts, total] = await db.$transaction([
    db.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      select: { id: true, title: true, slug: true, excerpt: true, category: true }
    }),
    db.post.count({ where })
  ])

  return {
    posts,
    total,
    totalPages: Math.ceil(total / PAGE_SIZE),
    currentPage: page,
    hasNext: page * PAGE_SIZE < total,
    hasPrev: page > 1
  };
}

// Cursor pagination 
export async function getPostsCursor(cursor?: string) {
  const posts = await db.post.findMany({
    where: { published: true, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 11,
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : 0,
    select: { id: true, title: true, slug: true, excerpt: true, category: true }
  });

  const hasMore = posts.length > 10;
  const data = hasMore ? posts.slice(0, 10) : posts;
  const nextCursor = hasMore ? data[9].id : null;
  return {
    posts: data,
    nextCursor,
    hasMore
  };
}

// Transaction
export async function createPostWithTransaction(data: {
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  authorId: string
}) {
  return db.$transaction(async(tx) => {
    const post = await tx.post.create({ data });
    const followers = await tx.follow.findMany({
      where: { followingId: data.authorId },
      select: { followerId: true }
    });

    if (followers.length > 0) {
      await tx.notification.createMany({
        data: followers.map((f) => ({
          userId: f.followerId,
          postId: post.id,
          message: `New post from ${post.authorId}: ${post.title}`
        })),
      });
    }
    return post;
  })
}
