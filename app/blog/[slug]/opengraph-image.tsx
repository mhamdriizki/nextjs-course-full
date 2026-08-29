import { getPostBySlug } from "@/lib/data/post";
import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  return new ImageResponse(
    <div
      style={{
        background: "#0C1220",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: 80,
      }}
    >
      <p style={{ color: "#1E86CF", fontSize: 28 }}>EasyCoding Blog</p>
      <h1 style={{ color: "white", fontSize: 60, margin: 0 }}>
        {post?.title ?? "Post"}
      </h1>
    </div>,
    { ...size },
  );
}
