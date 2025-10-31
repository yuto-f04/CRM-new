import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export class UnauthorizedProjectAccessError extends Error {
  status = 401;
  constructor(message = "Authentication required") {
    super(message);
    this.name = "UnauthorizedProjectAccessError";
  }
}

export class ForbiddenProjectAccessError extends Error {
  status = 403;
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenProjectAccessError";
  }
}

export async function visibleProjectIds(userId: string): Promise<Set<string>> {
  if (!userId) return new Set();
  const [memberships, owned] = await Promise.all([
    prisma.project_members.findMany({
      where: { user_id: userId },
      select: { project_id: true },
    }),
    prisma.projects.findMany({
      where: { owner_id: userId },
      select: { id: true },
    }),
  ]);

  const ids = new Set<string>();
  for (const m of memberships) ids.add(m.project_id);
  for (const p of owned) ids.add(p.id);
  return ids;
}

export async function assertProjectAccess(projectId: string): Promise<Session> {
  if (!projectId) throw new ForbiddenProjectAccessError("Missing project id");

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new UnauthorizedProjectAccessError();

  const user = await prisma.users.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) throw new UnauthorizedProjectAccessError();

  const allowed = await visibleProjectIds(user.id);
  if (!allowed.has(projectId)) {
    throw new ForbiddenProjectAccessError("You do not have access to this project");
  }

  return session;
}
