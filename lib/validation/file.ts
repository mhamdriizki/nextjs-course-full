import { z } from "zod";

const MAX_IMG = 5 * 1024 * 1024; // 5MB
const MAX_DOC = 10 * 1024 * 1024; // 10MB

const IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

const DOC_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

// ── Image validator ──────────────────────────────────────────────
export const imageFileSchema = z
  .file()
  .min(1, "File tidak boleh kosong")
  .max(MAX_IMG, "Ukuran maksimal 5MB")
  .mime([...IMAGE_TYPES], `Hanya ${IMAGE_TYPES.join(", ")} yang diizinkan`);

// ── Document validator ───────────────────────────────────────────
export const documentFileSchema = z
  .file()
  .max(MAX_DOC, "Maksimal 10MB")
  .mime([...DOC_TYPES], "Hanya PDF dan DOC yang diizinkan");

// ── Form schema dengan file ──────────────────────────────────────
export const uploadAvatarSchema = z.object({
  avatar: imageFileSchema,
});

export type UploadAvatarInput = z.infer<typeof uploadAvatarSchema>;

// ── Optional file ─────────────────────────────────────────────────
export const optionalImageSchema = imageFileSchema.optional().nullable();
