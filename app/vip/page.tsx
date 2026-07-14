"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function VIPpage() {
  const router = useRouter();
  const [isVip, setIsVip] = useState(false);

  useEffect(() => {
    const data = localStorage.getItem('vip');

    if (data !== 'yes') {
      router.replace("/");
    } else {
      setIsVip(true);
    }
  }, [router]);

  if (!isVip) {
    return null;
  }

  return (
    <div style={{ padding:'3rem', background:'gold', minHeight:'100vh'}}>
      <h1>Selamat datang di ruang VIP</h1>
    </div>
  )
}