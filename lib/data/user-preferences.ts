import { db } from "../db";

export async function upsertUserPreferences(
  userId: string,
  data: Partial<{ theme: string, emailNotified: boolean }>
) {
  return db.userPreferences.upsert({
    where: { userId },
    update: data,
    create: {
      userId,
      theme: data.theme ?? "system",
      emailNotified: data.emailNotified ?? true
    }
  });
}