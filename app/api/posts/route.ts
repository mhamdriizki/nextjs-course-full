import { getPosts } from "@/lib/posts"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  // Simulasi error
  if (searchParams.get("gagal") === "true") {
    return Response.json({ message: "Gagal mengambil data" }, { status: 500 })
  }

  return Response.json(await getPosts())
}
