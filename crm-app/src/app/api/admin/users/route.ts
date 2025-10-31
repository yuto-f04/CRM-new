import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// 一覧
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session as any).user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const users = await prisma.users.findMany({
    select: { id: true, name: true, email: true, role: true },
    orderBy: { created_at: "desc" }
  });
  return NextResponse.json({ users });
}

// 作成
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session as any).user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { name, email, password, role } = await req.json();
  if (!email || !password) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const hashed = await bcrypt.hash(password, 10);
  try {
    const u = await prisma.users.create({
      data: { name: name ?? null, email, password_hash: hashed, role: (role ?? "member") as any },
      select: { id: true, name: true, email: true, role: true }
    });
    return NextResponse.json({ user: u }, { status: 201 });
  } catch (e: any) {
    if (e?.code === "P2002") return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// 削除（?email= のクエリで指定）
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session as any).user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const email = url.searchParams.get("email");
  if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

  // 自分自身の削除は防止
  if ((session as any).user?.email === email) {
    return NextResponse.json({ error: "You cannot delete yourself" }, { status: 400 });
  }

  try {
    await prisma.users.delete({ where: { email } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.code === "P2025") return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
