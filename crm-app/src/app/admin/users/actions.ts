"use server";

import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertRole } from "@/lib/rbac";

const ROLE_VALUES = ["admin", "manager", "member", "viewer"] as const;
type Role = (typeof ROLE_VALUES)[number];

const updateRoleSchema = z.object({
  userId: z.string().cuid(),
  role: z.enum(ROLE_VALUES),
});

const toggleActiveSchema = z.object({
  userId: z.string().cuid(),
  isActive: z.enum(["true", "false"]),
});

const MANAGER_ROLES: Role[] = ["admin", "manager"];

export async function updateUserRoleAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }
  assertRole(session, MANAGER_ROLES);

  const parsed = updateRoleSchema.safeParse({
    userId: formData.get('userId'),
    role: formData.get('role'),
  });

  if (!parsed.success) {
    return;
  }

  const { userId, role } = parsed.data;

  if (session.user.id === userId) {
    return;
  }

  await prisma.users.update({
    where: { id: userId },
    data: { role },
  });

  revalidatePath("/admin/users");
}

export async function toggleUserActiveAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }
  assertRole(session, MANAGER_ROLES);

  const parsed = toggleActiveSchema.safeParse({
    userId: formData.get('userId'),
    isActive: formData.get('isActive'),
  });

  if (!parsed.success) {
    return;
  }

  const { userId, isActive } = parsed.data;

  if (session.user.id === userId) {
    return;
  }

  await prisma.users.update({
    where: { id: userId },
    data: { is_active: isActive === "true" },
  });

  revalidatePath("/admin/users");
}
