import { cookies, headers } from "next/headers";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import KanbanBoard, { type IssueSummary } from "./kanban-board";
import { ISSUE_STATUS_COLUMNS } from "@/lib/issue-status";
import ProjectTabs from "../project-tabs";

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

type ProjectIssuesResult = {
  project: ProjectDetail;
  issues: IssueSummary[];
  issueError: string | null;
};

async function fetchProjectAndIssues(projectId: string): Promise<ProjectIssuesResult> {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const headersList = headers();
  const host = headersList.get("host");
  if (!host) redirect("/projects");

  const protocol = host.includes("localhost") || host.startsWith("127.") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;
  const cookieHeader = cookies().getAll().map(({ name, value }) => `${name}=${value}`).join("; ");
  const commonHeaders = cookieHeader ? { Cookie: cookieHeader } : undefined;

  let projectPayload: any;
  try {
    const projectRes = await fetch(`${baseUrl}/api/projects/${projectId}`, {
      headers: commonHeaders,
      cache: "no-store",
    });

    if (projectRes.status === 401) redirect("/login");
    if (projectRes.status === 403 || projectRes.status === 404 || !projectRes.ok) redirect("/projects");

    projectPayload = await projectRes.json();
  } catch {
    redirect("/projects");
  }

  const project = projectPayload.project as ProjectDetail;
  let issues: IssueSummary[] = [];
  let issueError: string | null = null;

  try {
    const issuesRes = await fetch(`${baseUrl}/api/projects/${projectId}/issues/list`, {
      headers: commonHeaders,
      cache: "no-store",
    });

    if (issuesRes.status === 401) redirect("/login");
    if (issuesRes.status === 403) redirect("/projects");

    if (!issuesRes.ok) {
      issueError = "Failed to load issues";
    } else {
      const issuesPayload = await issuesRes.json();
      issues = (issuesPayload.issues ?? []) as IssueSummary[];
    }
  } catch {
    issueError = "Failed to load issues";
  }

  return { project, issues, issueError };
}

export default async function ProjectIssuesPage({ params }: RouteParams) {
  const { project, issues, issueError } = await fetchProjectAndIssues(params.id);

  return (
    <div className="stack">
      <section className="card space-y-4">
        <div className="page-header">
          <div className="space-y-2">
            <h1>{project.name}</h1>
            <p className="text-sm text-muted-foreground">
              Project key: {project.key} / Board columns: {ISSUE_STATUS_COLUMNS.map((col) => col.label).join(" / ")}
            </p>
          </div>
          <ProjectTabs projectId={project.id} />
        </div>
        {project.description ? (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{project.description}</p>
        ) : null}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {project.start_date ? <span>Start: {new Date(project.start_date).toLocaleDateString("ja-JP")}</span> : null}
          {project.end_date ? <span>End: {new Date(project.end_date).toLocaleDateString("ja-JP")}</span> : null}
          {project.owner ? <span>Owner: {project.owner.name ?? project.owner.email}</span> : null}
          {project.account ? (
            <span>
              Account:{" "}
              <Link className="underline decoration-dotted underline-offset-2" href={`/accounts/${project.account.id}`}>
                {project.account.name}
              </Link>
            </span>
          ) : null}
        </div>
        {project.sprints?.length ? (
          <div className="border border-border rounded p-3">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Sprints</h2>
              <Link href={`/projects/${project.id}/sprints`} className="text-xs text-primary underline underline-offset-2">
                View all
              </Link>
            </div>
            <ul className="space-y-2 text-sm">
              {project.sprints.map((sprint) => (
                <li key={sprint.id} className="flex flex-wrap gap-3 text-muted-foreground">
                  <span className="font-medium text-foreground">{sprint.name}</span>
                  <span>Status: {sprint.status}</span>
                  {sprint.start_date ? <span>Start: {new Date(sprint.start_date).toLocaleDateString("ja-JP")}</span> : null}
                  {sprint.end_date ? <span>End: {new Date(sprint.end_date).toLocaleDateString("ja-JP")}</span> : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <KanbanBoard projectId={project.id} initialIssues={issues} initialError={issueError} />
    </div>
  );
}
