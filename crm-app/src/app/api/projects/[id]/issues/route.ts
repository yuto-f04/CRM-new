import { NextResponse } from "next/server";
import { IssuePriority, IssueType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  assertProjectAccess,
  ForbiddenProjectAccessError,
  UnauthorizedProjectAccessError,
} from "@/lib/project-access";

type RouteParams = {
  params: { id: string };
};

const PRIORITY_VALUES = new Set(Object.values(IssuePriority));
const TYPE_VALUES = new Set(Object.values(IssueType));

export async function POST(req: Request, { params }: RouteParams) {
  const projectId = params.id;
  let session;
  try {
    session = await assertProjectAccess(projectId);
  } catch (error) {
    if (error instanceof UnauthorizedProjectAccessError || error instanceof ForbiddenProjectAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }

  const payload = await req.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const title = typeof payload.title === "string" ? payload.title.trim() : "";
  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const description = typeof payload.description === "string" ? payload.description : undefined;
  const priorityRaw = typeof payload.priority === "string" ? payload.priority.trim().toUpperCase() : undefined;
  const typeRaw = typeof payload.type === "string" ? payload.type.trim().toUpperCase() : undefined;
  const dueDateRaw = typeof payload.due_date === "string" ? payload.due_date : undefined;

  let priorityValue: IssuePriority | undefined;
  if (priorityRaw) {
    if (!PRIORITY_VALUES.has(priorityRaw as IssuePriority)) {
      return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
    }
    priorityValue = priorityRaw as IssuePriority;
  }

  let typeValue: IssueType | undefined;
  if (typeRaw) {
    if (!TYPE_VALUES.has(typeRaw as IssueType)) {
      return NextResponse.json({ error: "Invalid issue type" }, { status: 400 });
    }
    typeValue = typeRaw as IssueType;
  }

  let dueDateValue: Date | undefined;
  if (dueDateRaw) {
    const parsed = new Date(dueDateRaw);
    if (Number.isNaN(parsed.getTime())) {
      return NextResponse.json({ error: "Invalid due_date" }, { status: 400 });
    }
    dueDateValue = parsed;
  }

  const userEmail = session.user?.email;
  if (!userEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.users.findUnique({
    where: { email: userEmail },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const issue = await prisma.issues.create({
    data: {
      project_id: projectId,
      reporter_id: user.id,
      title,
      ...(description !== undefined ? { description } : {}),
      ...(priorityValue ? { priority: priorityValue } : {}),
      ...(typeValue ? { type: typeValue } : {}),
      ...(dueDateValue ? { due_date: dueDateValue } : {}),
    },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      type: true,
      due_date: true,
      created_at: true,
      updated_at: true,
    },
  });

  return NextResponse.json({ issue }, { status: 201 });
}
