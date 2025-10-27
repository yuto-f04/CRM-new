'use server';

import bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { getAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertRole } from '@/lib/rbac';

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(120),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.nativeEnum(Role),
});

const updateRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.nativeEnum(Role),
});

const toggleActiveSchema = z.object({
  userId: z.string().uuid(),
  isActive: z.enum(['true', 'false']),
});

export type CreateUserState = {
  success?: boolean;
  error?: string;
};

export async function createUserAction(_: CreateUserState | undefined, formData: FormData): Promise<CreateUserState> {
  const session = await getAuthSession();
  assertRole(session, 'admin');

  const parsed = createUserSchema.safeParse({
    email: formData.get('email'),
    name: formData.get('name'),
    password: formData.get('password'),
    role: formData.get('role'),
  });

  if (!parsed.success) {
    return { error: 'Please check the form fields and try again.' };
  }

  const { email, name, password, role } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return { error: 'A user with that email already exists.' };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      email: normalizedEmail,
      name,
      passwordHash,
      role,
    },
  });

  revalidatePath('/admin/users');
  return { success: true };
}

export async function updateUserRoleAction(formData: FormData) {
  const session = await getAuthSession();
  assertRole(session, 'admin');

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
  const session = await getAuthSession();
  assertRole(session, 'admin');

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
