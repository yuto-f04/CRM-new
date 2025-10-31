import Link from "next/link";
import { headers, cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export const metadata = { title: "Projects" };

type ProjectListItem = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

type ProjectsResult = {
  projects: ProjectListItem[];
  error: string | null;
};

async function fetchProjects(): Promise<ProjectsResult> {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const headersList = headers();
  const cookieStore = cookies();
  const host = headersList.get("host");
  if (!host) {
    return { projects: [], error: "Failed to load projects" };
  }

  const protocol = host.includes("localhost") || host.startsWith("127.") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;
  const cookieHeader = cookieStore.getAll().map(({ name, value }) => `${name}=${value}`).join("; ");

  try {
    const res = await fetch(`${baseUrl}/api/projects`, {
      method: "GET",
      headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
      cache: "no-store",
    });

    if (res.status === 401) {
      redirect("/login");
    }
    if (!res.ok) {
      return { projects: [], error: "Failed to load projects" };
    }

    const data = (await res.json()) as { projects?: ProjectListItem[] };
    return { projects: data.projects ?? [], error: null };
  } catch {
    return { projects: [], error: "Failed to load projects" };
  }
}

export default async function ProjectsPage() {
  const { projects, error } = await fetchProjects();

  return (
    <div className="stack">
      <section className="card">
        <div className="page-header">
          <h1>Your Projects</h1>
        </div>
        <p className="text-sm">Only projects you participate in are listed.</p>
      </section>

      {error ? (
        <section className="card">
          <p className="form-error">{error}</p>
        </section>
      ) : null}

      {projects.length ? (
        <section className="card">
          <ul className="stack">
            {projects.map((project) => (
              <li key={project.id} className="border border-border rounded p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold">{project.name}</h2>
                    <p className="text-sm text-muted-foreground">Key: {project.key}</p>
                    {project.description ? (
                      <p className="text-sm text-muted-foreground">{project.description}</p>
                    ) : null}
                  </div>
                  <Link href={`/projects/${project.id}/issues`} className="button">
                    Open Board
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="card">
          <p className="text-sm text-muted-foreground">No visible projects yet.</p>
        </section>
      )}
    </div>
  );
}
