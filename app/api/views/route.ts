import { NextResponse } from "next/server";

export async function GET() {
  // Simulasi angka random
  const randomViews = Math.floor(Math.random() * 400) + 100;


  return NextResponse.json({
    activeViewers: randomViews,
    timeStamp: new Date().toLocaleTimeString()
  });
}