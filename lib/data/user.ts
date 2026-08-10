import { db } from "../db"

const DEMO_AUTHOR_EMAIL = "rizki@email.com"

export async function getOrCreateDemoAuthor() {
  const existing = await db.user.findFirst({
    where: {email: DEMO_AUTHOR_EMAIL}
  });
  if (existing) return existing;

  return db.user.create({
    data: {
      email: DEMO_AUTHOR_EMAIL,
      name: "Rizki",
      role: "AUTHOR"
    }
  })
}