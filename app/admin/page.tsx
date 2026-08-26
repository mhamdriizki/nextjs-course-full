import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

async function AdminGuard() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/unauthorized");

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h2>Admin Dashboard</h2>
      <p>Halo, {session.user.name} — role kamu: {session.user.role}</p>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<p>Memuat admin dashboard...</p>}>
      <AdminGuard />
    </Suspense>
  );
}
