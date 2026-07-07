import { notFound } from "next/navigation";

export default async function DetailPage({
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