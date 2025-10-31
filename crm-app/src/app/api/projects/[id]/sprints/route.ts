import { NextResponse } from "next/server";
import { SprintStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { assertProjectAccess } from "@/lib/project-access";
import { hasAtLeastManager } from "@/lib/rbac";

type RouteParams = {
  params: { id: string };
};

const sprintSelect = {
  id: true,
  project_id: true,
  name: true,
  goal: true,
  status: true,
  start_date: true,
  end_date: true,
  created_at: true,
  updated_at: true,
  _count: { select: { issues: true } },
};

const STATUS_VALUES = new Set(Object.values(SprintStatus));

export async function GET(_req: Request, { params }: RouteParams) {
  const projectId = params.id;
  try {
    await assertProjectAccess(projectId);
  } catch (error) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const sprints = await prisma.sprints.findMany({
    where: { project_id: projectId },
    select: sprintSelect,
    orderBy: [{ start_date: "asc" }, { created_at: "asc" }],
  });

  return NextResponse.json({
    sprints: sprints.map(({ _count, ...rest }) => ({
      ...rest,
      issue_count: _count.issues,
    })),
  });
}

export async function POST(req: Request, { params }: RouteParams) {
  const projectId = params.id;
  let session;
  try {
    session = await assertProjectAccess(projectId);
  } catch (error) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  if (!hasAtLeastManager(session)) {
    return NextResponse.json({ error: "Insufficient role" }, { status: 403 });
  }

  const payload = await req.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const goalRaw = typeof payload.goal === "string" ? payload.goal.trim() : undefined;
  const statusRaw = typeof payload.status === "string" ? payload.status.trim().toUpperCase() : undefined;
  const startRaw = typeof payload.start_date === "string" ? payload.start_date : undefined;
  const endRaw = typeof payload.end_date === "string" ? payload.end_date : undefined;

  let statusValue: SprintStatus | undefined;
  if (statusRaw) {
    if (!STATUS_VALUES.has(statusRaw as SprintStatus)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    statusValue = statusRaw as SprintStatus;
  }

  let startDate: Date | undefined;
  if (startRaw) {
    const parsed = new Date(startRaw);
    if (Number.isNaN(parsed.getTime())) {
      return NextResponse.json({ error: "Invalid start_date" }, { status: 400 });
    }
    startDate = parsed;
  }

  let endDate: Date | undefined;
  if (endRaw) {
    const parsed = new Date(endRaw);
    if (Number.isNaN(parsed.getTime())) {
      return NextResponse.json({ error: "Invalid end_date" }, { status: 400 });
    }
    endDate = parsed;
  }

  if (startDate && endDate && startDate > endDate) {
    return NextResponse.json({ error: "start_date must be before end_date" }, { status: 400 });
  }

  const sprint = await prisma.sprints.create({
    data: {
      project_id: projectId,
      name,
      ...(goalRaw !== undefined ? { goal: goalRaw.length ? goalRaw : null } : {}),
      ...(statusValue ? { status: statusValue } : {}),
      ...(startDate ? { start_date: startDate } : {}),
      ...(endDate ? { end_date: endDate } : {}),
    },
    select: sprintSelect,
  });

  const { _count, ...rest } = sprint;
  return NextResponse.json(
    {
      sprint: {
        ...rest,
        issue_count: _count.issues,
      },
    },
    { status: 201 },
  );
}
