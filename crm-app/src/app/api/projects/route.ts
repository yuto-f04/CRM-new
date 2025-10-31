import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { visibleProjectIds } from "@/lib/project-access";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.users.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const visible = await visibleProjectIds(user.id);
  if (!visible.size) return NextResponse.json({ projects: [] });

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
