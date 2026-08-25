import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

async function SettingsGuard() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <div>
      <h2>Settings Dashboard</h2>
    </div>
  );
}

export default function SettingsDashboard() {
  return (
    <Suspense fallback={<p>Memuat pengaturan...</p>}>
      <SettingsGuard />
    </Suspense>
  );
}
