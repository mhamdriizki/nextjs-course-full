import type { Member } from "@/lib/store/user-store";
import { cacheLife } from "next/cache";

// Mock session lookup — di aplikasi nyata ini baca cookies() / getUserFromSession()
// (yang butuh Suspense, bukan "use cache", karena itu runtime data).
// Di sini datanya statis/mock, jadi cukup di-cache seperti data lain di lib/data/blog.ts.
export async function getCurrentMember(): Promise<Member> {
  "use cache"
  cacheLife("max")

  return { name: "Rizki", tier: "Gold" };
}
