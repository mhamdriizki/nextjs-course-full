"use client"

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface FilterButtonProps {
  activeFilter: string;
}

export function FilterButton({ activeFilter }: FilterButtonProps) {
  const router = useRouter();

  const setFilter = (value: "all" | "published") => {
    router.push(`/blog?filter=${value}`);
  }

  return (
    <div className="mb-6 flex gap-2">
      <Button
        onClick={() => setFilter("all")}
        className={`px-4 py-2 rounded ${activeFilter === 'all' ? "bg-blue-600 text-white" : "bg-grey-200"}`}>
          Semua Artikel
      </Button>

      <Button
        onClick={() => setFilter("published")}
        className={`px-4 py-2 rounded ${activeFilter === 'all' ? "bg-blue-600 text-white" : "bg-grey-200"}`}>
          Sudah Terbit
      </Button>
    </div>
  )
}