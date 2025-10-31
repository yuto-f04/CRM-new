import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertProjectAccess } from "@/lib/project-access";

type RouteParams = {
  params: { epicId: string };
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

export async function PATCH(req: Request, { params }: RouteParams) {
  const epicId = params.epicId;

  const payload = await req.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const nameRaw = payload.name === undefined ? undefined : String(payload.name).trim();
  const descriptionRaw = payload.description === undefined ? undefined : String(payload.description).trim();

  if (nameRaw === undefined && descriptionRaw === undefined) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  if (nameRaw !== undefined && nameRaw.length === 0) {
    return NextResponse.json({ error: "name must not be empty" }, { status: 400 });
  }

  const existing = await prisma.epics.findUnique({
    where: { id: epicId },
    select: { id: true, project_id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Epic not found" }, { status: 404 });
  }

  try {
    await assertProjectAccess(existing.project_id);
  } catch (error) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const data: Record<string, unknown> = {};
  if (nameRaw !== undefined) data.name = nameRaw;
  if (descriptionRaw !== undefined) data.description = descriptionRaw.length ? descriptionRaw : null;

  const epic = await prisma.epics.update({
    where: { id: epicId },
    data,
    select: epicSelect,
  });

  const { _count, ...rest } = epic;
  return NextResponse.json({
    epic: {
      ...rest,
      issue_count: _count.issues,
    },
  });
}
