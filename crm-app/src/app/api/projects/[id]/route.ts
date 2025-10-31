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

  const project = await prisma.projects.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      key: true,
      name: true,
      description: true,
      start_date: true,
      end_date: true,
      created_at: true,
      updated_at: true,
      owner: {
        select: { id: true, name: true, email: true },
      },
      account: {
        select: { id: true, name: true },
      },
      sprints: {
        select: {
          id: true,
          name: true,
          status: true,
          start_date: true,
          end_date: true,
          created_at: true,
          updated_at: true,
        },
        orderBy: { start_date: "asc" },
      },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  return NextResponse.json({ project });
}
