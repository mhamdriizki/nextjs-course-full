// ActionResult<T> — discriminated union di level TypeScript (bukan Zod
// runtime schema). Ini nilai balik Server Action kita SENDIRI, bukan data
// dari luar yang datang tanpa dipercaya — jadi tidak perlu divalidasi ulang
// pakai z.discriminatedUnion(). Yang kita pakai dari konsep discriminatedUnion
// di sini murni manfaat type-narrowing-nya di sisi pemanggil (Client Component).
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; errors: Record<string, string[] | undefined> };
