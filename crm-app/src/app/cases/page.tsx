import { headers, cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import CasesBoard, { type CaseSummary } from "./cases-board";

export const metadata = { title: "案件カンバン" };

async function fetchCases(): Promise<CaseSummary[]> {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const host = headers().get("host");
  if (!host) throw new Error("Host header is missing");
  const protocol = host.includes("localhost") || host.startsWith("127.") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  const cookieValue = cookies().getAll().map(({ name, value }) => `${name}=${value}`).join("; ");

  const res = await fetch(`${baseUrl}/api/cases`, {
    method: "GET",
    headers: cookieValue ? { Cookie: cookieValue } : undefined,
    cache: "no-store",
  });

  if (res.status === 401) redirect("/login");
  if (!res.ok) throw new Error("案件一覧の取得に失敗しました");

  const payload = (await res.json()) as { cases: CaseSummary[] };
  return payload.cases ?? [];
}

export default async function CasesPage() {
  const cases = await fetchCases();

  return (
    <div className="stack">
      <section className="card">
        <div className="page-header">
          <h1>案件一覧</h1>
        </div>
        <p className="text-sm text-muted-foreground">ステージをクリックして案件の進捗を更新できます。</p>
      </section>

      <CasesBoard initialCases={cases} />
    </div>
  );
}
