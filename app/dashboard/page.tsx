import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Suspense } from "react";
import { auth } from "@/lib/auth";

// Session check pakai headers() -> data runtime, harus di dalam <Suspense>
// biar gak nge-block seluruh route dari di-prerender (Cache Components).
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
    <Suspense fallback={<p>Memuat dashboard...</p>}>
      <DashboardGuard />
    </Suspense>
  );
}