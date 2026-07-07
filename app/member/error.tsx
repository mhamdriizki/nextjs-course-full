"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error
}: {
  error: Error & { digest?: string }
}) {
  useEffect(() => {
    console.error("Error tertangkap di sini : ", error);
  }, [error]);

  return (
    <div style={{ padding:"3rem", background:"#fee2e2", border:"2px solid #ef4444", margin:"2rem"}}>
      <h2 style={{ color:"#b91c1c" }}>Terjadi Kesalahan!</h2>
      <p style={{ color:"#991b1b" }}>Pesan error : {error.message}</p>
    </div>
  )
}