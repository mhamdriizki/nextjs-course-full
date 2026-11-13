export function GET(req: Request) {
  const ok = req.headers.get('authorization') === 'Bearer rahasia123'
  return Response.json({ ok, jumlah: 3 })
}
