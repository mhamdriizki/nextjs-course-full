"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function VIPpage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  // localStorage hanya ada di browser, jadi dibaca di useEffect (bukan saat render/prerender)
  useEffect(() => {
    if (localStorage.getItem('vip') === 'yes') {
      setAllowed(true);
    } else {
      router.replace("/");
    }
  }, [router]);

  if (!allowed) return null;

  return (
    <div style={{ padding:'3rem', background:'gold', minHeight:'100vh'}}>
      <h1>Selamat datang di ruang VIP</h1>
    </div>
  )
}
