import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function visibleProjectIds(userId: string): Promise<Set<string>> {
  if (!userId) {
    return new Set();
  }

  const rows = await prisma.project_members.findMany({
    where: { user_id: userId },
    select: { project_id: true },
  });

  return new Set(rows.map((row) => row.project_id));
}

export async function assertProjectAccess(projectId: string) {
  if (!projectId) {
    throw new Error("Forbidden");
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const ids = await visibleProjectIds(session.user.id);
  if (!ids.has(projectId)) {
    throw new Error("Forbidden");
  }

  return session;
}
