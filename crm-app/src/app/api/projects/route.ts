import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { visibleProjectIds } from "@/lib/project-access";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const visible = await visibleProjectIds(session.user.id);
  if (!visible.size) {
    return NextResponse.json({ projects: [] });
  }

  const projects = await prisma.projects.findMany({
    where: { id: { in: Array.from(visible) } },
    select: {
      id: true,
      name: true,
      key: true,
      created_at: true,
      updated_at: true,
    },
    orderBy: { created_at: "desc" },
  });

  return NextResponse.json({ projects });
}
