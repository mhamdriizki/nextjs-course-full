export default async function Page({
  params,
}: {
  params: { nama: string}
}) {
  const { nama } = await params;

  return (
    <h1>Halo : {nama.toUpperCase()}</h1>
  )
}