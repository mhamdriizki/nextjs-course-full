import Link from "next/link";
import { CreatePostFormRHF } from "../CreatePostFormRHF";

export default function NewPostPage() {
  return (
    <div className="max-w-2xl mx-auto p-8 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">
          Buat Post menggunakan react-hook-form
        </h1>
        <p>
          Validasi real time saat mengetik sebelum submit sama sekali. Bandingkan 
          dengan form di {""}
          <Link href="/posts" className="underline">
            /posts
          </Link>
        </p>
      </div>
      <CreatePostFormRHF/>
    </div>
  )
}