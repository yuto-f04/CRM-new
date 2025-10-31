import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireSessionUser, UnauthorizedError } from "@/lib/session-user";

const MIN_PASSWORD_LENGTH = 8;

export async function POST(req: Request) {
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

  const currentPassword = typeof payload.current_password === "string" ? payload.current_password : "";
  const newPassword = typeof payload.new_password === "string" ? payload.new_password : "";

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "current_password and new_password are required" }, { status: 400 });
  }

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `new_password must be at least ${MIN_PASSWORD_LENGTH} characters` },
      { status: 400 },
    );
  }

  const userRecord = await prisma.users.findUnique({
    where: { id: sessionUser.user.id },
    select: { id: true, password_hash: true },
  });

  if (!userRecord || !userRecord.password_hash) {
    return NextResponse.json({ error: "Password update unavailable" }, { status: 400 });
  }

  const matches = await bcrypt.compare(currentPassword, userRecord.password_hash);
  if (!matches) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
  }

  if (await bcrypt.compare(newPassword, userRecord.password_hash)) {
    return NextResponse.json({ error: "New password must differ from current password" }, { status: 400 });
  }

  const hash = await bcrypt.hash(newPassword, 10);
  await prisma.users.update({
    where: { id: userRecord.id },
    data: { password_hash: hash },
  });

  return NextResponse.json({
    success: true,
    message: "パスワードを更新しました。再ログインをお願いします。",
  });
}

