import z from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL wajib diisi"),
  BETTER_AUTH_SECRET: z.string().min(1, "BETTER_AUTH_SECRET wajib diisi"),
  BETTER_AUTH_URL: z.url("BETTER_AUTH_URL wajib diisi"),
  GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID wajib diisi"),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET wajib diisi"),
  CLOUDINARY_CLOUD_NAME: z.string().min(1, "CLOUDINARY_CLOUD_NAME wajib diisi"),
  CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY wajib diisi"),
  CLOUDINARY_API_SECRET: z.string().min(1, "CLOUDINARY_API_SECRET wajib diisi"),
});

const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.url("NEXT_PUBLIC_APP_URL wajib diisi"),
});

function parseServerEnv() {
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("❌ Invalid server environment variables:", parsed.error.format());
    throw new Error("Invalid server environment variables");
  }
  return parsed.data;
}

function parseClientEnv() {
  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });
  if (!parsed.success) {
    console.error("❌ Invalid client environment variables:", parsed.error.format());
    throw new Error("Invalid client environment variables");
  }
  return parsed.data;
}

export const env = parseServerEnv();
export const clientEnv = parseClientEnv();