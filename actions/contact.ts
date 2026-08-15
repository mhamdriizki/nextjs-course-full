"use server";
import { z } from "zod";

// 1. Definisikan Zod Schema
const contactSchema = z.object({
  email: z.string().email("Email tidak valid"),
  message: z.string().min(10, "Pesan minimal 10 karakter"),
});

// 2. Buat Server Action. Ingat signature baru: (prevState, formData)
export async function submitContact(prevState: any, formData: FormData) {
  // Simulasi delay network
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const rawData = {
    email: formData.get("email"),
    message: formData.get("message"),
  };

  const validated = contactSchema.safeParse(rawData);

  if (!validated.success) {
    return {
      success: false,
      errors: validated.error.flatten().fieldErrors,
    };
  }

  // Jika sukses (misal: kirim email ke database)
  console.log("Email sent to:", validated.data.email);
  
  return {
    success: true,
    errors: undefined,
  };
}
