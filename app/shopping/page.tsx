export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { page = "1", sort = "asc" } = await searchParams;
  return <p>Halaman {page}, urutan {sort}</p>
}