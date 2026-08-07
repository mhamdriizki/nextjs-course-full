import { db } from "../db";

const DEMO_AUTHOR_EMAIL = "rizki@email.com";

// Dipakai di Server Action (app/posts/action.ts) DAN Route Handler
// (app/api/posts/route.ts) — dua "pintu masuk" beda, satu sumber logic.
export async function getOrCreateDemoAuthor() {
  const existing = await db.user.findFirst({
    where: { email: DEMO_AUTHOR_EMAIL },
  });
  if (existing) return existing;
  return db.user.create({
    data: {
      email: DEMO_AUTHOR_EMAIL,
      name: "Rizki",
      role: "AUTHOR",
    },
  });
}
