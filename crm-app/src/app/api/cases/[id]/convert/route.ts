import { NextResponse } from "next/server";
import { CaseStage } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { visibleProjectIds } from "@/lib/project-access";

type RouteParams = {
  params: { id: string };
};

function slugify(value: string) {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 12);
}

type ProjectKeyClient = Pick<PrismaClient, "projects">;

async function generateProjectKey(base: string | null, client?: ProjectKeyClient): Promise<string> {
  const tx = client ?? prisma;
  const slug = slugify(base ?? "") || "PROJ";
  for (let attempt = 0; attempt < 5; attempt++) {
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    const candidate = `${slug}-${suffix}`;
    const exists = await tx.projects.findUnique({ where: { key: candidate } });
    if (!exists) return candidate;
  }
  return `PROJ-${randomUUID().slice(0, 8).toUpperCase()}`;
}

export async function POST(_req: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const deal = await prisma.cases.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      title: true,
      description: true,
      stage: true,
      account_id: true,
      project_id: true,
      account: { select: { name: true } },
    },
  });

  if (!deal) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const visible = await visibleProjectIds(session.user.id);
  let allowed = deal.project_id ? visible.has(deal.project_id) : false;

  if (!allowed && deal.account_id) {
    const access = await prisma.project_members.findFirst({
      where: {
        user_id: session.user.id,
        project: { account_id: deal.account_id },
      },
      select: { id: true },
    });
    allowed = Boolean(access);
  }

  if (!allowed) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  if (deal.project_id) {
    return NextResponse.json({ error: "already_converted" }, { status: 400 });
  }

  const userId = session.user.id;

  const result = await prisma.$transaction(async (tx) => {
    const projectKey = await generateProjectKey(deal.account?.name ?? deal.title, tx);
    const project = await tx.projects.create({
      data: {
        name: deal.title,
        key: projectKey,
        description: deal.description,
        account_id: deal.account_id,
        start_date: new Date(),
      },
      select: { id: true, name: true, key: true },
    });

    const memberIds = new Set<string>([userId]);

    await tx.project_members.createMany({
      data: Array.from(memberIds).map((memberId) => ({
        project_id: project.id,
        user_id: memberId,
        role: memberId === userId ? "manager" : "member",
      })),
      skipDuplicates: true,
    });

    await tx.cases.update({
      where: { id: deal.id },
      data: { stage: CaseStage.WON, project_id: project.id },
    });

    return project;
  });

  return NextResponse.json({ project: result }, { status: 201 });
}
