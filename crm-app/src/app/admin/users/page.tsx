import Link from "next/link";
import UsersClient from "./users-client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "User management" };

// ★ default export は同期コンポーネントにする
export default function Page() {
  return <Content />;
}

// Server Component（ここで認証/権限チェック）
async function Content() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if ((session as any).user?.role !== "admin") redirect("/dashboard");

  return (
    <div className="stack">
      <section className="card">
        <div className="page-header">
          <h1>User management</h1>
          <Link href="/dashboard" className="button">Back</Link>
        </div>
        <p className="text-sm">
          Provision and maintain user accounts for the CRM platform.
          Admins and managers can create new accounts and adjust roles.
          Other users cannot access this page.
        </p>
      </section>

      {/* 当初のフォーム＋一覧UI */}
      <UsersClient />
    </div>
  );
}
