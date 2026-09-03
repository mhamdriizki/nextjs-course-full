import z from "zod";

export const MAX_IMG = 5*1024*1024; // 5mb max
const MAX_DOC = 10*1024*1024; // 10mb max

const IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif"
] as const;

const DOC_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document" // jenis MIME type untuk document pdf
] as const;

// Image validator
export const imageFileSchema = z
  .file()
  .min(1, "File tidak boleh kosong")
  .max(MAX_IMG, "Ukuran maksimum 5MB")
  .mime([...IMAGE_TYPES], `Hanya ${IMAGE_TYPES.join(", ")} yang diperbolehkan`);

// Document validator
export const documentFileSchema = z 
  .file()
  .max(MAX_DOC, "Maksimal 10 MB")
  .mime([...DOC_TYPES], `Hanya ${IMAGE_TYPES.join(", ")} yang diperbolehkan`);

// Form Schema dengan file
export const uploadAvatarSchema = z.object({
  avatar: imageFileSchema
});

export type UploadAvatarInput = z.infer<typeof uploadAvatarSchema>;

export const optionalImageSchema = imageFileSchema.optional().nullable();