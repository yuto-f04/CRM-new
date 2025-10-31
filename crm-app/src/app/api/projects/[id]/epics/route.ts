import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertProjectAccess } from "@/lib/project-access";

type RouteParams = {
  params: { id: string };
};

const epicSelect = {
  id: true,
  project_id: true,
  name: true,
  description: true,
  created_at: true,
  updated_at: true,
  _count: { select: { issues: true } },
};

export async function GET(_req: Request, { params }: RouteParams) {
  const projectId = params.id;
  try {
    await assertProjectAccess(projectId);
  } catch (error) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const epics = await prisma.epics.findMany({
    where: { project_id: projectId },
    select: epicSelect,
    orderBy: [{ created_at: "asc" }],
  });

  return NextResponse.json({
    epics: epics.map(({ _count, ...rest }) => ({
      ...rest,
      issue_count: _count.issues,
    })),
  });
}

export async function POST(req: Request, { params }: RouteParams) {
  const projectId = params.id;
  try {
    await assertProjectAccess(projectId);
  } catch (error) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const payload = await req.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rawName = typeof payload.name === "string" ? payload.name.trim() : "";
  if (!rawName) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const descriptionRaw = typeof payload.description === "string" ? payload.description.trim() : undefined;

  const epic = await prisma.epics.create({
    data: {
      project_id: projectId,
      name: rawName,
      ...(descriptionRaw !== undefined ? { description: descriptionRaw.length ? descriptionRaw : null } : {}),
    },
    select: epicSelect,
  });

  const { _count, ...rest } = epic;
  return NextResponse.json(
    {
      epic: {
        ...rest,
        issue_count: _count.issues,
      },
    },
    { status: 201 },
  );
}
