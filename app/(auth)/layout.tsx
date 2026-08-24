import Link from "next/link";

export default function AuthLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-[calc(100vh-72px)] items-center justify-center overflow-hidden px-4 py-12">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(600px circle at 50% 0%, var(--color-brand-terang) 0%, transparent 70%)",
        }}
      />

      <div className="flex w-full max-w-md flex-col items-center gap-6">
        <Link
          href="/"
          className="text-lg font-heading font-semibold tracking-tight text-foreground hover:text-primary"
        >
          MyApp
        </Link>

        {children}
      </div>
    </div>
  )
}
