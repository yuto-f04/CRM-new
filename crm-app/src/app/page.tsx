import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = { title: "Home" };

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="stack">
      <section className="card">
        <div className="page-header">
          <h1>Home</h1>
          <Link href="/dashboard" className="button">Dashboard</Link>
        </div>
        <p className="text-sm">Welcome back, {session.user?.email ?? "user"}.</p>
      </section>
    </div>
  );
}
