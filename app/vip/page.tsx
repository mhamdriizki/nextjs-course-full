"use client";

import { redirect } from "next/navigation";

export default function VIPpage() {
  const data = localStorage.getItem('vip');

  if (data !== 'yes') {
    redirect("/");
  }

  return (
    <div style={{ padding:'3rem', background:'gold', minHeight:'100vh'}}>
      <h1>Selamat datang di ruang VIP</h1>
    </div>
  )
}