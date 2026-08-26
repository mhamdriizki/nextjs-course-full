"use server";

export async function inspectFileAction(formData: FormData) {
  const file = formData.get("file");

  if (!(file instanceof File)) {
    console.log("Tidak ada file yang dikirim");
    return;
  }

  console.log({
    name: file.name,
    type: file.type,
    sizeInKB: (file.size / 1024).toFixed(2),
  });

  const buffer = Buffer.from(await file.arrayBuffer());
  console.log("Binary length:", buffer.length, "bytes");
}
