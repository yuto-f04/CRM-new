import { cookies, headers } from "next/headers";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import AccountsBoard, { type AccountListItem } from "./accounts-board";

async function fetchAccounts(): Promise<AccountListItem[]> {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const headersList = headers();
  const host = headersList.get("host");
  if (!host) throw new Error("Host header is missing");
  const protocol = host.includes("localhost") || host.startsWith("127.") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  const cookieValue = cookies().getAll().map(({ name, value }) => `${name}=${value}`).join("; ");
  const commonHeaders = cookieValue ? { Cookie: cookieValue } : undefined;

  const res = await fetch(`${baseUrl}/api/accounts`, {
    headers: commonHeaders,
    cache: "no-store",
  });

  if (res.status === 401) {
    redirect("/login");
  }
  if (!res.ok) {
    throw new Error("取引先一覧の取得に失敗しました");
  }

  const payload = await res.json();
  return (payload.accounts ?? []) as AccountListItem[];
}

export const metadata = {
  title: "取引先",
};

export default async function AccountsPage() {
  const accounts = await fetchAccounts();

  return (
    <div className="stack">
      <section className="card">
        <div className="page-header">
          <h1>取引先管理</h1>
          <p className="text-sm text-muted-foreground">
            顧客企業の基本情報を管理し、関連する案件やプロジェクトと紐付けます。
          </p>
        </div>
      </section>

      <AccountsBoard initialAccounts={accounts} />
    </div>
  );
}
