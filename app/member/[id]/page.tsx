import { notFound } from "next/navigation";
import { Suspense } from "react";

export async function generateStaticParams() {
  return [
    {
      id: "budi"
    },
    {
      id: "andi"
    },
    {
      id: "999"
    }
  ]
}

export default function DetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <Suspense fallback={<p>Loading . . .</p>}>
      <DetailContent params={params}/>
    </Suspense>
  )
}

async function DetailContent({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;

  if (id === "999") {
    // Simulasi not found
    notFound();
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Detail id : #{id} </h2>
      <p>Data profil lengkap ada di bawah :</p>
    </div>
  );
}