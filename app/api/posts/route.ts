import { getOrCreateDemoAuthor } from "@/lib/data/user";
import { db } from "@/lib/db";
import { createPostSchema, postsQuerySchema } from "@/lib/validation/post";
import { NextRequest } from "next/server";
import { ok, created, badRequest, serverError, zodError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const query = postsQuerySchema.safeParse(params);

    if (!query.success) {
      return zodError(query.error);
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

    return ok({ posts, total, page, limit });
  } catch (error) {
    console.error("GET /api/posts error:", error);
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  let body: unknown;
  
  // Lapis 1: JSON Parsing Error (400)
  try {
    body = await req.json();
  } catch (error) {
    return badRequest("Invalid JSON body");
  }

  // Lapis 2: Validation Error (422)
  const validated = createPostSchema.safeParse(body);
  if (!validated.success) {
    return zodError(validated.error);
  }

  // Lapis 3: Database / Server Error (500)
  try {
    const author = await getOrCreateDemoAuthor();
    const post = await db.post.create({
      data: { ...validated.data, authorId: author.id}
    });

    return created(post);
  } catch (error) {
    console.error("POST /api/posts error:", error);
    return serverError();
  }
}