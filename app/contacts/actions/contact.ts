"use server";

import z, { success } from "zod";

const contactSchema = z.object({
  email: z.string().email("Email tidak valid"),
  message: z.string().min(10, "Pesan minimal 10 karakter"),
});

export async function submitContact(prevState: any, formData: FormData) {
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

  console.log("Email sent to :  ", validated.data.email);

  return {
    success: true,
    errors: undefined,
  };
}
