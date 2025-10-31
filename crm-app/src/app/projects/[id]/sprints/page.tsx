import { cookies, headers } from "next/headers";
import { getServerSession } from "next-auth/next";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { hasAtLeastManager } from "@/lib/rbac";
import ProjectTabs from "../project-tabs";
import SprintsBoard, { type SprintSummary } from "./sprints-board";

type ProjectDetail = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  owner: { id: string; name: string | null; email: string | null } | null;
  account: { id: string; name: string } | null;
};

type RouteParams = {
  params: { id: string };
};

async function fetchProjectAndSprints(projectId: string): Promise<{ project: ProjectDetail; sprints: SprintSummary[] }> {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const headersList = headers();
  const host = headersList.get("host");
  if (!host) throw new Error("Host header is missing");
  const protocol = host.includes("localhost") || host.startsWith("127.") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  const cookieValue = cookies().getAll().map(({ name, value }) => `${name}=${value}`).join("; ");
  const commonHeaders = cookieValue ? { Cookie: cookieValue } : undefined;

  const [projectRes, sprintsRes] = await Promise.all([
    fetch(`${baseUrl}/api/projects/${projectId}`, { headers: commonHeaders, cache: "no-store" }),
    fetch(`${baseUrl}/api/projects/${projectId}/sprints`, { headers: commonHeaders, cache: "no-store" }),
  ]);

  if (projectRes.status === 401 || sprintsRes.status === 401) {
    redirect("/login");
  }
  if (projectRes.status === 403 || sprintsRes.status === 403) {
    redirect("/projects");
  }
  if (projectRes.status === 404) {
    notFound();
  }

  if (!projectRes.ok) {
    throw new Error("プロジェクト情報の取得に失敗しました");
  }
  if (!sprintsRes.ok) {
    throw new Error("スプリント一覧の取得に失敗しました");
  }

  const projectPayload = await projectRes.json();
  const sprintsPayload = await sprintsRes.json();

  return {
    project: projectPayload.project as ProjectDetail,
    sprints: (sprintsPayload.sprints ?? []) as SprintSummary[],
  };
}

export const metadata = {
  title: "スプリント管理",
};

export default async function ProjectSprintsPage({ params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { project, sprints } = await fetchProjectAndSprints(params.id);
  const canManage = hasAtLeastManager(session);

  return (
    <div className="stack">
      <section className="card space-y-4">
        <div className="page-header">
          <div className="space-y-2">
            <h1>{project.name}</h1>
            <p className="text-sm text-muted-foreground">プロジェクトキー: {project.key}</p>
          </div>
          <ProjectTabs projectId={project.id} />
        </div>
        {project.description ? (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{project.description}</p>
        ) : null}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {project.start_date ? <span>開始日: {new Date(project.start_date).toLocaleDateString("ja-JP")}</span> : null}
          {project.end_date ? <span>終了予定日: {new Date(project.end_date).toLocaleDateString("ja-JP")}</span> : null}
          {project.owner ? <span>オーナー: {project.owner.name ?? project.owner.email}</span> : null}
          {project.account ? (
            <span>
              取引先:{" "}
              <Link className="underline decoration-dotted underline-offset-2" href={`/accounts/${project.account.id}`}>
                {project.account.name}
              </Link>
            </span>
          ) : null}
        </div>
      </section>

      <SprintsBoard projectId={project.id} initialSprints={sprints} canManage={canManage} />
    </div>
  );
}
