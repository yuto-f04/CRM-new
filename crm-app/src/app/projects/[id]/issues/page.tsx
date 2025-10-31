import { cookies, headers } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import KanbanBoard, { type IssueSummary } from "./kanban-board";
import { ISSUE_STATUS_COLUMNS } from "@/lib/issue-status";

type ProjectDetail = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  owner: { id: string; name: string | null; email: string | null } | null;
  account: { id: string; name: string } | null;
  sprints: {
    id: string;
    name: string;
    status: string;
    start_date: string | null;
    end_date: string | null;
    created_at: string;
    updated_at: string;
  }[];
};

type RouteParams = {
  params: { id: string };
};

async function fetchProjectAndIssues(projectId: string): Promise<{ project: ProjectDetail; issues: IssueSummary[] }> {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const headersList = headers();
  const host = headersList.get("host");
  if (!host) throw new Error("Host header is missing");
  const protocol = host.includes("localhost") || host.startsWith("127.") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  const cookieValue = cookies().getAll().map(({ name, value }) => `${name}=${value}`).join("; ");
  const commonHeaders = cookieValue ? { Cookie: cookieValue } : undefined;

  const [projectRes, issuesRes] = await Promise.all([
    fetch(`${baseUrl}/api/projects/${projectId}`, { headers: commonHeaders, cache: "no-store" }),
    fetch(`${baseUrl}/api/projects/${projectId}/issues/list`, { headers: commonHeaders, cache: "no-store" }),
  ]);

  if (projectRes.status === 401 || issuesRes.status === 401) {
    redirect("/login");
  }
  if (projectRes.status === 403 || issuesRes.status === 403) {
    redirect("/projects");
  }
  if (projectRes.status === 404) {
    notFound();
  }
  if (!projectRes.ok) {
    throw new Error("プロジェクト情報の取得に失敗しました");
  }
  if (!issuesRes.ok) {
    throw new Error("イシュー一覧の取得に失敗しました");
  }

  const projectPayload = await projectRes.json();
  const issuesPayload = await issuesRes.json();

  return {
    project: projectPayload.project as ProjectDetail,
    issues: (issuesPayload.issues ?? []) as IssueSummary[],
  };
}

export default async function ProjectIssuesPage({ params }: RouteParams) {
  const { project, issues } = await fetchProjectAndIssues(params.id);

  return (
    <div className="stack">
      <section className="card space-y-4">
        <div className="page-header">
          <div>
            <h1>{project.name}</h1>
            <p className="text-sm text-muted-foreground">
              プロジェクトキー: {project.key} / イシュー列:{" "}
              {ISSUE_STATUS_COLUMNS.map((col) => col.label).join(" → ")}
            </p>
          </div>
        </div>
        {project.description ? <p className="text-sm text-muted-foreground">{project.description}</p> : null}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {project.start_date ? <span>開始日: {new Date(project.start_date).toLocaleDateString("ja-JP")}</span> : null}
          {project.end_date ? <span>終了予定: {new Date(project.end_date).toLocaleDateString("ja-JP")}</span> : null}
          {project.owner ? <span>オーナー: {project.owner.name ?? project.owner.email}</span> : null}
          {project.account ? <span>アカウント: {project.account.name}</span> : null}
        </div>
        {project.sprints?.length ? (
          <div className="border border-border rounded p-3">
            <h2 className="text-sm font-semibold mb-2">スプリント概要</h2>
            <ul className="space-y-2 text-sm">
              {project.sprints.map((sprint) => (
                <li key={sprint.id} className="flex flex-wrap gap-3 text-muted-foreground">
                  <span className="font-medium text-foreground">{sprint.name}</span>
                  <span>ステータス: {sprint.status}</span>
                  {sprint.start_date ? (
                    <span>開始: {new Date(sprint.start_date).toLocaleDateString("ja-JP")}</span>
                  ) : null}
                  {sprint.end_date ? (
                    <span>終了: {new Date(sprint.end_date).toLocaleDateString("ja-JP")}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <KanbanBoard projectId={project.id} initialIssues={issues} />
    </div>
  );
}
