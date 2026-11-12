export default async function Page(props: PageProps<'/baru/[coba]'>) {
  const { coba } = await props.params;
  const queryParams = await props.searchParams;

  return <h1>Halo : {coba.toUpperCase()} <br /> Query Params : {JSON.stringify(queryParams)}</h1> 
}