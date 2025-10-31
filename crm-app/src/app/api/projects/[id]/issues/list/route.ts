import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertProjectAccess } from "@/lib/project-access";

type RouteParams = {
  params: { id: string };
};

export async function GET(_req: Request, { params }: RouteParams) {
  const projectId = params.id;
  try {
    await assertProjectAccess(projectId);
  } catch (error) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const issues = await prisma.issues.findMany({
    where: { project_id: projectId },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      type: true,
      due_date: true,
      updated_at: true,
      assignees: {
        select: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
    orderBy: { updated_at: "desc" },
  });

  return NextResponse.json({
    issues: issues.map((issue) => ({
      ...issue,
      assignees: issue.assignees.map((item) => item.user),
    })),
  });
}
