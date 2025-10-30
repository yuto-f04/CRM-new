import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MANAGER_ROLES = new Set(["admin", "manager"]);

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role ?? "member";

  if (!MANAGER_ROLES.has(role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const payload = await request.json().catch(() => ({}));
  const name = typeof payload?.name === "string" ? payload.name.trim() : "";
  const email = typeof payload?.email === "string" ? payload.email.trim().toLowerCase() : "";
  const password = typeof payload?.password === "string" ? payload.password : "";

  if (!email || !password || password.length < 8) {
    return NextResponse.json({ error: "invalid input" }, { status: 400 });
  }

  const password_hash = await bcrypt.hash(password, 12);

  try {
    const user = await prisma.users.create({
      data: {
        name,
        email,
        password_hash,
        role: "member",
        is_active: true,
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json({ ok: true, user }, { status: 201 });
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "duplicate email" }, { status: 409 });
    }

    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
