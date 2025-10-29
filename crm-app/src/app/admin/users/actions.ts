'use server';

import { Role } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertRole } from '@/lib/rbac';

const updateRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.nativeEnum(Role),
});

const toggleActiveSchema = z.object({
  userId: z.string().uuid(),
  isActive: z.enum(['true', 'false']),
});

const MANAGER_ROLES: Role[] = ['admin', 'manager'];

export async function updateUserRoleAction(formData: FormData) {
  const session = await auth();
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

  await prisma.user.update({
    where: { id: userId },
    data: { role },
  });

  revalidatePath('/admin/users');
}

export async function toggleUserActiveAction(formData: FormData) {
  const session = await auth();
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

  await prisma.user.update({
    where: { id: userId },
    data: { isActive: isActive === 'true' },
  });

  revalidatePath('/admin/users');
}
