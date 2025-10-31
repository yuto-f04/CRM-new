import { headers, cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import CasesBoard, { type CaseSummary } from "./cases-board";

export const metadata = { title: "Deals" };

type CasesResult = {
  cases: CaseSummary[];
  error: string | null;
};

async function fetchCases(): Promise<CasesResult> {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const headersList = headers();
  const host = headersList.get("host");
  if (!host) {
    return { cases: [], error: "Failed to load deals" };
  }

  const protocol = host.includes("localhost") || host.startsWith("127.") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;
  const cookieHeader = cookies().getAll().map(({ name, value }) => `${name}=${value}`).join("; ");
  const commonHeaders = cookieHeader ? { Cookie: cookieHeader } : undefined;

  try {
    const res = await fetch(`${baseUrl}/api/cases`, {
      method: "GET",
      headers: commonHeaders,
      cache: "no-store",
    });

    if (res.status === 401) redirect("/login");
    if (!res.ok) {
      return { cases: [], error: "Failed to load deals" };
    }

    const payload = await res.json();
    return { cases: (payload.cases ?? []) as CaseSummary[], error: null };
  } catch {
    return { cases: [], error: "Failed to load deals" };
  }
}

export default async function CasesPage() {
  const { cases, error } = await fetchCases();

  return (
    <div className="stack">
      <section className="card">
        <div className="page-header">
          <h1>Deal Board</h1>
        </div>
        <p className="text-sm text-muted-foreground">Deals are grouped by stage for easy triage.</p>
        {error ? (
          <div className="mt-3 space-y-2">
            <p className="form-error">{error}</p>
            <a href="/cases" className="button ghost inline-flex w-max">
              Retry
            </a>
          </div>
        ) : null}
      </section>

      <CasesBoard initialCases={cases} initialError={error} />
    </div>
  );
}
