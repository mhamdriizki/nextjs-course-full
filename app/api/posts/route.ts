import { getOrCreateDemoAuthor } from "@/lib/data/user";
import { db } from "@/lib/db";
import { createPostSchema, postsQuerySchema } from "@/lib/validation/post";
import { NextRequest, NextResponse } from "next/server";
import { flattenError } from "zod";

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams);
  const query = postsQuerySchema.safeParse(params);

  if (!query.success) {
    return NextResponse.json(
      { errors: flattenError(query.error).fieldErrors },
      { status: 400 }
    )
  }

  const { page, limit, q } = query.data;

  const where = {
    published: true,
    deletedAt: null,
    ...(q ? { title: { contains: q, mode: "insensitive" as const }}: {})
  };

  const [posts, total] = await db.$transaction([
    db.post.findMany({
      where,
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, slug: true, excerpt: true}
    }),
    db.post.count({where})
  ]);

  return NextResponse.json({ posts, total, page, limit })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const validated = createPostSchema.safeParse(body);

  if (!validated.success) {
    const {fieldErrors, formErrors} = flattenError(validated.error);
    return NextResponse.json({ errors: fieldErrors, formErrors}, {status: 422});
  }

  const author = await getOrCreateDemoAuthor();
  const post = await db.post.create({
    data: { ...validated.data, authorId: author.id}
  });

  return NextResponse.json(post, {status: 201});

}