import {
  badRequest,
  created,
  ok,
  serverError,
  zodError,
} from "@/lib/api-response";
import { getOrCreateDemoAuthor } from "@/lib/data/user";
import { db } from "@/lib/db";
import { createPostSchema, postsQuerySchema } from "@/lib/validation/post";
import { NextRequest } from "next/server";

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
      ...(q ? { title: { contains: q, mode: "insensitive" as const } } : {}),
    };

    const [posts, total] = await db.$transaction([
      db.post.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true, slug: true, excerpt: true },
      }),
      db.post.count({ where }),
    ]);

    return ok({ posts, total, page, limit });
  } catch (error) {
    console.error("GET /api/posts error: ", error);
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  let body: unknown;

  // Lapisan 1 : JSON parsing error
  try {
    body = await req.json();
  } catch (error) {
    return badRequest("Invalid JSON Body");
  }

  // Lapisan 2 : Zod Validation
  const validated = createPostSchema.safeParse(body);

  if (!validated.success) {
    return zodError(validated.error);
  }

  // Lapisan 3 : Try catch ke database
  try {
    const author = await getOrCreateDemoAuthor();
    const post = await db.post.create({
      data: { ...validated.data, authorId: author.id },
    });
    return created(post);
  } catch (error) {
    console.error("POST /api/posts error: ", error);
    return serverError();
  }
}
