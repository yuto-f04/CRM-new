import { NextResponse } from "next/server";
import { IssueStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { assertProjectAccess } from "@/lib/project-access";

type RouteParams = {
  params: { id: string };
};

const STATUS_VALUES = new Set(Object.values(IssueStatus));

export async function PATCH(req: Request, { params }: RouteParams) {
  const issueId = params.id;
  const payload = await req.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const statusRaw = typeof payload.status === "string" ? payload.status.trim().toUpperCase() : "";
  if (!STATUS_VALUES.has(statusRaw as IssueStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const issue = await prisma.issues.findUnique({
    where: { id: issueId },
    select: { id: true, project_id: true },
  });
  if (!issue) {
    return NextResponse.json({ error: "Issue not found" }, { status: 404 });
  }

  try {
    await assertProjectAccess(issue.project_id);
  } catch (error) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const updated = await prisma.issues.update({
    where: { id: issueId },
    data: { status: statusRaw as IssueStatus },
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      type: true,
      due_date: true,
      updated_at: true,
    },
  });

  return NextResponse.json({ issue: updated });
}
