import { badRequest, created, serverError } from "@/lib/api-response";
import { writeFile } from "fs/promises";
import { nanoid } from "nanoid";
import { NextRequest } from "next/server";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export async function POST(req: NextRequest) {
  let formData: FormData;

  try {
    formData = await req.formData();
  } catch (error) {
    return badRequest("Body harus berupa multipart/form-data");
  }

  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return badRequest("Field `file` wajib diisi");
  }

  if (!file.type.startsWith("image/")) {
    return badRequest("File harus berupa gambar");
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name);
    const filename = `${nanoid()}${ext}`;

    await writeFile(path.join(UPLOAD_DIR, filename), buffer);

    return created({ url: `/uploads/${filename}`});
  } catch(error) {
    return serverError("Gagal menyimpan file");
  }
}