import Image from "next/image";

function getInitials(name?: string | null) {
  if (!name) return "?";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function Avatar({
  src,
  name,
  size = 40,
  preload = false,
}: {
  src?: string | null;
  name?: string | null;
  size?: number;
  preload?: boolean;
}) {
  if (!src) {
    return (
      <div
        style={{ width: size, height: size }}
        className="rounded-full bg-slate-700 text-white flex items-center justify-center text-sm font-medium shrink-0"
      >
        {getInitials(name)}
      </div>
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className="relative rounded-full overflow-hidden shrink-0"
    >
      <Image
        src={src}
        alt={name ? `Avatar ${name}` : "Avatar"}
        fill
        sizes={`${size}px`}
        style={{ objectFit: "cover" }}
        preload={preload}
      />
    </div>
  );
}
