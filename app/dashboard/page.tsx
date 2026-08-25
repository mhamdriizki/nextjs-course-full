import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

async function DashboardGuard() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <div>
      <h2>Dashboard Overview</h2>
      {/* Ini halaman dashboard */}
      <h3>Ini konten konten dashboard</h3>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<p>Memuat dashboard . . .</p>}>
      <DashboardGuard />
    </Suspense>
  );
}
