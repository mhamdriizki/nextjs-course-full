"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { updateAvatarAction } from "./avatar-action";

export function AvatarUploadForm({
  currentAvatarUrl,
}: {
  currentAvatarUrl?: string | null;
}) {
  const [state, formAction, isPending] = useActionState(updateAvatarAction, null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (state?.success) {
      toast.success("Avatar berhasil diperbarui");
    } else if (state && !state.success && state.message) {
      toast.error(state.message);
    }
  }, [state]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  }

  const displayUrl = (state?.success ? state.data.url : null) ?? preview ?? currentAvatarUrl;

  return (
    <form action={formAction} className="space-y-3 border rounded-lg p-4">
      {displayUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={displayUrl}
          alt="Avatar"
          className="w-24 h-24 rounded-full object-cover border"
        />
      )}

      <input
        type="file"
        name="avatar"
        accept="image/*"
        onChange={handleFileChange}
        className="block"
      />

      <button
        type="submit"
        disabled={isPending}
        className="bg-slate-900 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {isPending ? "Mengupload..." : "Update Avatar"}
      </button>
    </form>
  );
}
