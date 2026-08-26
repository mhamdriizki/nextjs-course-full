"use client";

import { useActionState, useEffect } from "react";
import { uploadLocalAction } from "./action";
import { toast } from "sonner";

export function UploadForm() {
  const [state, formAction, isPending] = useActionState(
    uploadLocalAction,
    null,
  );

  useEffect(() => {
    if (state?.success) {
      toast.success("Upload berhasil");
    } else if (state && !state.success && state.message) {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-2 border rounded-lg p-4">
      <input type="file" name="file" accept="image/*" className="block" />

      <button
        type="submit"
        disabled={isPending}
        className="bg-slate-900 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {isPending ? "Mengupload ..." : "Upload"}
      </button>

      {state?.success && (
        <img
          src={state.data.url}
          alt="Preview hasil upload"
          className="mt-2 max-w-xs rounded border"
        />
      )}
    </form>
  );
}
