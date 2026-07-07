"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchForm() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleCariData = (e: React.FormEvent) => {
    e.preventDefault();

    if (query) {
      router.push(`/member/${query}`);
    }
  };

  return (
    <form
      onSubmit={handleCariData}
      style={{ margin: "1.5rem 0", padding: "1rem", borderRadius: "8px" }}
    >
      <h3>Cari data di sini ...</h3>
      <input
        type="text"
        value={query}
        placeholder="Ketik nama di sini . . ."
        onChange={(e) => setQuery(e.target.value)}
        style={{
          padding: "8px",
          borderRadius: "4px",
          border: "1px solid #ccc",
          width: "200px",
        }}
      />

      <button
        type="submit"
        style={{
          padding: "8px 16px",
          marginLeft: "8px",
          background: "#3b82f6",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        Cari data menggunakan useRouter()
      </button>
    </form>
  );
}
