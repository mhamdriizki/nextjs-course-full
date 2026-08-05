import { z } from "zod";

export const registerSchema = z
  .object({
    email: z.string().trim().toLowerCase().pipe(z.email("Email tidak valid")),
    password: z.string().min(8, "Password minimal 8 karakter"),
    confirmedPassword: z.string(),
  })
  .superRefine(({ password, confirmedPassword }, ctx) => {
    if (confirmedPassword !== password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password dan konfirmasi password tidak cocok",
        path: ["confirmedPassword"],
      });
    }
    if (!/[A-Z]/.test(password)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password harus mengandung setidaknya satu huruf kapital",
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
