import { NextResponse } from "next/server";
import { SprintStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { assertProjectAccess } from "@/lib/project-access";
import { hasAtLeastManager } from "@/lib/rbac";

type RouteParams = {
  params: { id: string };
};

const STATUS_VALUES = new Set(Object.values(SprintStatus));

export async function PATCH(req: Request, { params }: RouteParams) {
  const sprintId = params.id;

  const payload = await req.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const statusRaw = typeof payload.status === "string" ? payload.status.trim().toUpperCase() : "";
  if (!STATUS_VALUES.has(statusRaw as SprintStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const sprint = await prisma.sprints.findUnique({
    where: { id: sprintId },
    select: { id: true, project_id: true },
  });
  if (!sprint) {
    return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
  }

  let session;
  try {
    session = await assertProjectAccess(sprint.project_id);
  } catch (error) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  if (!hasAtLeastManager(session)) {
    return NextResponse.json({ error: "Insufficient role" }, { status: 403 });
  }

  const updated = await prisma.sprints.update({
    where: { id: sprintId },
    data: { status: statusRaw as SprintStatus },
    select: {
      id: true,
      project_id: true,
      name: true,
      goal: true,
      status: true,
      start_date: true,
      end_date: true,
      created_at: true,
      updated_at: true,
    },
  });

  return NextResponse.json({ sprint: updated });
}
