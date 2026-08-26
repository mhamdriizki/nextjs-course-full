"use server"

export async function inspectFileAction(formData: FormData) {
  const file = formData.get("file");

  if (!(file instanceof File)) {
    console.log("Tidak ada file yang dikirim");
  }

  console.log({
    name: file?.name,
    type: file?.type,
    sizeInKb: (file?.size / 1024).toFixed(2)
  });

  const buffer = Buffer.from(await file?.arrayBuffer());
  console.log("Binary length: ", buffer.length, "bytes");
}