"use client";

import { useActionState, useEffect, useState } from "react";
import { updateAvatarAction } from "./avatar-action";
import { toast } from "sonner";

export function AvatarUploadForm({
  currentAvatarUrl,
}: {
  currentAvatarUrl?: string | null;
}) {
  const [state, formAction, isPending] = useActionState(
    updateAvatarAction,
    null,
  );
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (state?.success) {
      toast.success("Avatar berhasil diperbaharui");
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

  const fieldErrors = state && !state.success ? state.errors : undefined;
  const displayUrl =
    (state?.success ? state.data.url : null) ?? preview ?? currentAvatarUrl;

  return (
    <form action={formAction} className="space-y-3 border rounded-lg p-4">
      {displayUrl && (
        <img
          src={displayUrl}
          alt="Avatar"
          className="w-24 h24 rounded-full object-cover-hover"
        />
      )}

      <input
        type="file"
        name="avatar"
        accept="image/&"
        onChange={handleFileChange}
        className="block"
      />

      {fieldErrors?.avatar?.[0] && (
        <p className="text-sm text-red-600">{fieldErrors.avatar[0]}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="bg-slate-900 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {isPending ? "Mengupload" : "Update Avatar"}
      </button>
    </form>
  );
}
