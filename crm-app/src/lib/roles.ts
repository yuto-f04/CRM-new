export const ROLE_OPTIONS = ['admin', 'manager', 'member', 'viewer'] as const;

export type RoleSlug = (typeof ROLE_OPTIONS)[number];
