import { cookies, headers } from "next/headers";
import { getServerSession } from "next-auth/next";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import AccountDetailPanel, { type AccountDetail } from "./account-detail-panel";

type RouteParams = {
  params: { id: string };
};

async function fetchAccountDetail(accountId: string): Promise<AccountDetail> {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const headersList = headers();
  const host = headersList.get("host");
  if (!host) throw new Error("Host header is missing");
  const protocol = host.includes("localhost") || host.startsWith("127.") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  const cookieValue = cookies().getAll().map(({ name, value }) => `${name}=${value}`).join("; ");
  const commonHeaders = cookieValue ? { Cookie: cookieValue } : undefined;

  const res = await fetch(`${baseUrl}/api/accounts/${accountId}`, {
    headers: commonHeaders,
    cache: "no-store",
  });

  if (res.status === 401) {
    redirect("/login");
  }
  if (res.status === 404) {
    notFound();
  }
  if (!res.ok) {
    throw new Error("取引先の取得に失敗しました");
  }

  const payload = await res.json();
  return payload.account as AccountDetail;
}

export const metadata = {
  title: "取引先詳細",
};

export default async function AccountDetailPage({ params }: RouteParams) {
  const account = await fetchAccountDetail(params.id);
  return <AccountDetailPanel account={account} />;
}
