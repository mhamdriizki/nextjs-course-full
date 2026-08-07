import Link from "next/link";
import { CreatePostFormRHF } from "../CreatePostFormRHF";

export default function NewPostPage() {
  return (
    <div className="max-w-2xl mx-auto p-8 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Buat Post (react-hook-form + Zod)</h1>
        <p className="text-sm text-slate-500">
          Demo Bab 4 — validasi real-time saat mengetik, sebelum submit sama sekali.
          Bandingkan dengan form di{" "}
          <Link href="/posts" className="underline">
            /posts
          </Link>{" "}
          yang pakai <code>useActionState</code> (baru validasi setelah submit).
        </p>
      </div>

      <CreatePostFormRHF />
    </div>
  );
}
