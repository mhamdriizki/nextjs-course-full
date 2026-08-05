import { z } from "zod";

// superRefine dipakai di sini (bukan refine) karena kita perlu nambah lebih
// dari satu error, ke lebih dari satu field, dalam satu validasi.
export const registerSchema = z
  .object({
    email: z.string().trim().toLowerCase().pipe(z.email("Email tidak valid")),
    password: z.string().min(8, "Password minimal 8 karakter"),
    confirmPassword: z.string(),
  })
  .superRefine(({ password, confirmPassword }, ctx) => {
    if (confirmPassword !== password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password tidak cocok",
        path: ["confirmPassword"],
      });
    }
    if (!/[A-Z]/.test(password)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Harus mengandung huruf kapital",
        path: ["password"],
      });
    }
    if (!/[0-9]/.test(password)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Harus mengandung angka",
        path: ["password"],
      });
    }
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Email tidak valid")),
  password: z.string().min(1, "Password wajib diisi"),
});

export type LoginInput = z.infer<typeof loginSchema>;
