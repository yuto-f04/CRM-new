import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionUser, UnauthorizedError } from "@/lib/session-user";

export async function PATCH(req: Request) {
  let sessionUser;
  try {
    sessionUser = await requireSessionUser();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }

  const payload = await req.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rawName = typeof payload.name === "string" ? payload.name.trim() : "";
  if (!rawName) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const updated = await prisma.users.update({
    where: { id: sessionUser.user.id },
    data: { name: rawName },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      updated_at: true,
    },
  });

  return NextResponse.json({ user: updated });
}

