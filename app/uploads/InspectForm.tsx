"use client";

import { inspectFileAction } from "./inspect-action";

export function InspectForm() {
  return (
    <form action={inspectFileAction} className="space-y-2">
      <input type="file" name="file" accept="image/*" />
      <button type="submit" className="border px-3 py-1 rounded">
        Cek Properti File
      </button>
    </form>
  );
}
