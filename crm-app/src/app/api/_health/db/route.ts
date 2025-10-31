import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await prisma.$queryRaw`select 1`;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}
