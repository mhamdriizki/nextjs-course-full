export default function LoadingPage() {
  return (
    <div style={{ padding:"2rem" }}>
      <h1>Sedang memuat data . . .</h1>

      {/* Efek skeleton untuk animasi loading */}
      <div style={{ display:"flex", flexDirection:"column", gap:"10px", marginTop:"2rem"}}>
        <div style={{ height:"20px", background:"#e5e7eb", width:"50%", borderRadius:"4px"}}></div>
        <div style={{ height:"20px", background:"#e5e7eb", width:"40%", borderRadius:"4px"}}></div>
        <div style={{ height:"20px", background:"#e5e7eb", width:"60%", borderRadius:"4px"}}></div>
      </div>

    </div>
  );
}