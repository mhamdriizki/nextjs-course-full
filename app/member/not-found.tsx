import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div style={{ padding:"4rem", textAlign:"center"}}>
      <h1 style={{fontSize:"3rem", color:"#6b7280"}}>404</h1>
      <h2>Data tidak ditemukan</h2>
      <p>Mungkin sudah tidak berlangganan</p>
      <Link href="/member" style={{display:"inline-block", marginTop:"1rem", color:"blue"}}>Kembali ke daftar</Link>
    </div>
  )
}