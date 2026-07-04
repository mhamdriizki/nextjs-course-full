import Link from "next/link";

export default function GaleriPage() {
  return (
    <div style={{ marginTop: "1rem" }}>
      <p>Klik salah satu user di bawah ini (Perhatikan URL di atas!)</p>
      
      <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
        {/* Link biasa yang mengarah ke /foto/budi */}
        <Link href="/foto/budi" style={{ padding: "10px", background: "blue", color: "white" }}>
          Lihat Foto Budi
        </Link>

        {/* Link biasa yang mengarah ke /foto/tono */}
        <Link href="/foto/tono" style={{ padding: "10px", background: "black", color: "white" }}>
          Lihat Foto Tono
        </Link>
      </div>
    </div>
  );
}