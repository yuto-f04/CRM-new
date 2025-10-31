import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { CaseStage } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { visibleProjectIds } from "@/lib/project-access";

const STAGE_VALUES = new Set(Object.values(CaseStage));

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const stageParam = url.searchParams.get("stage");
  const stage = stageParam ? stageParam.trim().toUpperCase() : undefined;

  if (stage && !STAGE_VALUES.has(stage as CaseStage)) {
    return NextResponse.json({ error: "invalid_stage" }, { status: 400 });
  }

  const visible = await visibleProjectIds(session.user.id);

  const cases = await prisma.cases.findMany({
    where: {
      ...(stage ? { stage: stage as CaseStage } : {}),
      OR: [
        { project_id: { in: Array.from(visible) } },
        {
          AND: [
            { project_id: null },
            {
              account: {
                projects: {
                  some: {
                    members: { some: { user_id: session.user.id } },
                  },
                },
              },
            },
          ],
        },
      ],
    },
    select: {
      id: true,
      title: true,
      description: true,
      stage: true,
      created_at: true,
      updated_at: true,
      account: { select: { id: true, name: true } },
      contact: { select: { id: true, first_name: true, last_name: true, email: true } },
      project_id: true,
    },
    orderBy: [{ updated_at: "desc" }],
  });

  return NextResponse.json({ cases });
}
