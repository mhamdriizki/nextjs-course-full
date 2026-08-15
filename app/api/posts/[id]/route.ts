import { db } from "@/lib/db";
import { updatePostSchema } from "@/lib/validation/post";
import { NextRequest, NextResponse } from "next/server";
import { flattenError } from "zod";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const post = await db.post.findUnique({
    where: { id, deletedAt: null },
  });

  if (!post) {
    return NextResponse.json({ error: "Post Not Found" }, { status: 404 });
  }

  return NextResponse.json(post);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => null);

  const validated = updatePostSchema.safeParse({ ...body, id });

  if (!validated.success) {
    const { fieldErrors, formErrors } = flattenError(validated.error);
    return NextResponse.json(
      { errors: fieldErrors, formErrors },
      { status: 422 },
    );
  }

  try {
    const { id: _, ...dataToUpdate } = validated.data;
    const post = await db.post.update({
      where: { id, deletedAt: null },
      data: dataToUpdate,
    });

    return NextResponse.json(post);
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 404 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    await db.post.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }
}
