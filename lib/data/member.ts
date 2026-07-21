import { cacheLife } from "next/cache";
import { Member } from "../store/user-store";

export async function getCurrentMember(): Promise<Member> {
  "use cache"
  cacheLife("max");

  return {
    name: "Rizki",
    tier: "Silver"
  }
}