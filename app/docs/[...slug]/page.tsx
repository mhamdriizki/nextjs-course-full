export default async function DocsPage({
  params
}: {
  params: Promise<{ slug: string[] }>
}) {
  const { slug } = await params;

  const fullPath = slug.join('/');

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Halaman Dokumentasi</h1>
      <p>URL Saat ini adalah <strong>{fullPath}</strong></p>
      <p>Total Segment : <strong>{slug.length}</strong></p>
    </div>
  )
}