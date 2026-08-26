"use server";

import { writeFile } from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";
import { ActionResult } from "@/lib/validation/action-result";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export async function uploadLocalAction(
  _prevState: ActionResult<{ url: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ url: string }>> {
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { success: false, message: "Pilih file terlebih dahulu" };
  }

  if (!file.type.startsWith("image/")) {
    return { success: false, message: "File harus berupa gambar" };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name); // ambil ekstensi asli, misal ".jpg"
    const filename = `${nanoid()}${ext}`;

    await writeFile(path.join(UPLOAD_DIR, filename), buffer);

    return { success: true, data: { url: `/uploads/${filename}` } };
  } catch (error) {
    return { success: false, message: "Gagal menyimpan file" };
  }
}
