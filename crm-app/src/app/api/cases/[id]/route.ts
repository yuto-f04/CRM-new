import { NextResponse } from "next/server";
import { CaseStage } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteParams = {
  params: { id: string };
};

const STAGE_VALUES = new Set(Object.values(CaseStage));

export async function PATCH(req: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await req.json().catch(() => null);
  if (!data || typeof data !== "object") {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const stageRaw = typeof data.stage === "string" ? data.stage.trim().toUpperCase() : "";
  if (!STAGE_VALUES.has(stageRaw as CaseStage)) {
    return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
  }

  try {
    const updated = await prisma.cases.update({
      where: { id: params.id },
      data: { stage: stageRaw as CaseStage },
      select: {
        id: true,
        stage: true,
        updated_at: true,
      },
    });

    return NextResponse.json({ case: updated });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }
    throw error;
  }
}
