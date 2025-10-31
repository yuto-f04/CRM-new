import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cases = await prisma.cases.findMany({
    select: {
      id: true,
      title: true,
      description: true,
      stage: true,
      created_at: true,
      updated_at: true,
      account: { select: { id: true, name: true } },
      contact: { select: { id: true, first_name: true, last_name: true, email: true } },
      owner: { select: { id: true, name: true, email: true } },
      project_id: true,
    },
    orderBy: [{ updated_at: "desc" }],
  });

  return NextResponse.json({ cases });
}
