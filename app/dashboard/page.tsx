import Link from "next/link";

export default function DashboardPage() {
  return (
    <div>
      <h2>Dashboard Overview</h2>

      <Link href="/dashboard/settings" style={{ color: "blue" }}>
        Go to Settings
      </Link>
    </div>
  );
}