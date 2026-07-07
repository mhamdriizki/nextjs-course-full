import Link from "next/link";
import SearchForm from "../components/SearchForm";

export default async function MemberPage({
  searchParams
}: {
  searchParams: Promise<{ crash?: string, query?: string }>
}) {
  const { crash, query } = await searchParams;
  console.log('query ', query);

  // 1. Simulasi Delay/loading
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // 2. Simulasi Error
  if (crash === "true") {
    throw new Error("Koneksi ke database error");
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Daftar member course Next.JS</h1>
      <p>Data ini berhasil ditarik setelah loading selama 2 detik</p>

      {/* Applied si search form di sini */}
      <SearchForm/>

      <ul style={{ marginTop: "1rem", lineHeight: "2" }}>
        <li><Link href="/member/budi">Member 1: Budi</Link></li>
        <li><Link href="/member/andi">Member 2: Andi</Link></li>
        <li><Link href="/member/999">Member 999: Hamtono</Link></li>
      </ul>

      {/* Tombol untuk trigger error */}
      <Link
        href="/member?crash=true"
        style={{ display: 'inline-block', marginTop:"2rem", padding: "10px",
          background:"red", color:"white", textDecoration:"none"
        }}>Trigger Error
        </Link>
    </div>
  )

}