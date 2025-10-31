import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata = { title: "プロジェクト一覧" };

type ProjectListItem = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

async function fetchProjects(): Promise<ProjectListItem[]> {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const headersList = headers();
  const cookieStore = cookies();
  const host = headersList.get("host");
  if (!host) throw new Error("Host header is missing");

  const protocol = host.includes("localhost") || host.startsWith("127.") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;
  const cookieHeader = cookieStore.getAll().map(({ name, value }) => `${name}=${value}`).join("; ");

  const res = await fetch(`${baseUrl}/api/projects`, {
    method: "GET",
    headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
    cache: "no-store",
  });

  if (res.status === 401) {
    redirect("/login");
  }
  if (!res.ok) {
    throw new Error("プロジェクト一覧の取得に失敗しました");
  }

  const data = (await res.json()) as { projects: ProjectListItem[] };
  return data.projects ?? [];
}

export default async function ProjectsPage() {
  const projects = await fetchProjects();

  return (
    <div className="stack">
      <section className="card">
        <div className="page-header">
          <h1>プロジェクト一覧</h1>
        </div>
        <p className="text-sm">参画中のプロジェクトのみ表示されます。</p>
      </section>

      {projects.length ? (
        <section className="card">
          <ul className="stack">
            {projects.map((project) => (
              <li key={project.id} className="border border-border rounded p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold">{project.name}</h2>
                    <p className="text-sm text-muted-foreground">キー: {project.key}</p>
                    {project.description ? (
                      <p className="text-sm text-muted-foreground">{project.description}</p>
                    ) : null}
                  </div>
                  <Link href={`/projects/${project.id}/issues`} className="button">
                    イシューを表示
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="card">
          <p className="text-sm text-muted-foreground">参画中のプロジェクトがありません。</p>
        </section>
      )}
    </div>
  );
}
