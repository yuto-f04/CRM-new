import { type Session } from 'next-auth';

type Role = 'viewer' | 'member' | 'manager' | 'admin';

const roleRank: Record<Role, number> = {
  viewer: 0,
  member: 1,
  manager: 2,
  admin: 3,
};

export type SessionWithRole = Session & {
  user: NonNullable<Session['user']> & { role: Role };
};

function hasSessionRole(session: Session | null | undefined): session is SessionWithRole {
  return Boolean(session?.user?.role);
}

export function isAdmin(session: Session | null): session is SessionWithRole {
  return hasSessionRole(session) && session.user.role === 'admin';
}

export function hasAtLeast(session: Session | null, minimum: Role): session is SessionWithRole {
  if (!hasSessionRole(session)) {
    return false;
  }

  return roleRank[session.user.role] >= roleRank[minimum];
}

export function hasAtLeastManager(session: Session | null): session is SessionWithRole {
  return hasAtLeast(session, 'manager');
}

export function hasRole(session: Session | null, role: Role): session is SessionWithRole {
  return hasSessionRole(session) && session.user.role === role;
}

export function assertRole(session: Session | null, required: Role | Role[]): asserts session is SessionWithRole {
  const requiredRoles = Array.isArray(required) ? required : [required];
  if (!hasSessionRole(session) || !requiredRoles.some((role) => session.user.role === role)) {
    throw new Error('Not authorized for this action');
  }
}
