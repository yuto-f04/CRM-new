import { NextResponse } from "next/server";
import { CaseStage } from "@prisma/client";
import { randomUUID } from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

async function generateProjectKey(base: string | null, tx = prisma): Promise<string> {
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
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.users.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deal = await prisma.cases.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      title: true,
      description: true,
      stage: true,
      account_id: true,
      owner_id: true,
      project_id: true,
      account: { select: { name: true } },
    },
  });

  if (!deal) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  if (deal.project_id) {
    return NextResponse.json({ error: "Case already converted" }, { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const projectKey = await generateProjectKey(deal.account?.name ?? deal.title, tx);
    const project = await tx.projects.create({
      data: {
        name: deal.title,
        key: projectKey,
        description: deal.description,
        owner_id: user.id,
        account_id: deal.account_id,
        start_date: new Date(),
      },
      select: { id: true, name: true, key: true },
    });

    const memberIds = new Set<string>([user.id]);
    if (deal.owner_id) memberIds.add(deal.owner_id);

    await tx.project_members.createMany({
      data: Array.from(memberIds).map((userId) => ({
        project_id: project.id,
        user_id: userId,
        role: userId === user.id ? "owner" : "manager",
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
