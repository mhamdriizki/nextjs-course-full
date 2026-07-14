import { Suspense } from "react";

export async function generateStaticParams() {
  return[
    {
      id: "budi"
    },
    {
      id: "tono"
    },
  ]
}

export default function ModalCegatanFoto({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<p>Loading . . .</p>}>
      <ModalCegatanContent params={params}/>
    </Suspense>
  )
}

async function ModalCegatanContent({
  params
}: {
  params: Promise<{id: string}>
}) {
  const { id } = await params;

  return (
    <div style={{ 
      marginTop: "2rem", 
      padding: "2rem", 
      background: "#d1fae5", 
      border: "4px dashed #10b981" 
    }}>
      <h2 style={{ color: "#047857" }}>PREVIEW FOTO INTERCEPTOR</h2>
      <p style={{ color: "#047857" }}>
        URL di browser berubah jadi <strong>/foto/{id}</strong>, tapi kita nggak pindah ke halaman merah! 
        Kita cuma memba`jak tampilannya ke dalam sini.
      </p>
    </div>
  );
}