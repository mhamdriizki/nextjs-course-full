let hit = 0

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  if (searchParams.has("hitung")) return Response.json({ hit })
  if (searchParams.has("reset")) { hit = 0; return Response.json({ hit }) }

  hit++
  await new Promise((r) => setTimeout(r, 600))
  return Response.json([
    { id: 1, title: "Kopi" },
    { id: 2, title: "Teh" },
    { id: 3, title: "Roti" },
  ])
}