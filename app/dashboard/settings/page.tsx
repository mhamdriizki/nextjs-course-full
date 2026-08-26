import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AvatarUploadForm } from "./AvatarUploadForm";

async function SettingsGuard() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="space-y-4">
      <h2>Settings Dashboard</h2>

      <div>
        <h3 className="font-medium mb-2">Avatar</h3>
        <AvatarUploadForm currentAvatarUrl={session.user.image} />
      </div>
    </div>
  )
}


export default function SettingsDashboard() {
  return (
    <Suspense fallback={<p>Memuat setting dashboard ...</p>}>
      <SettingsGuard/>
    </Suspense>
  )
}