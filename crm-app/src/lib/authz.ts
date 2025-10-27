import { assertRole, type SessionWithRole } from '@/lib/rbac';

/**
 * Placeholder for the eventual project visibility guard described in spec §5.1.
 * Once project_members are available we will load visible project ids here.
 */
export async function getVisibleProjectIds(_session: SessionWithRole): Promise<string[]> {
  return [];
}

/**
 * Example guard pattern (see spec §5.1):
 *
 * ```ts
 * export async function assertProjectAccess(session: SessionWithRole, projectId: string) {
 *   assertRole(session, ['manager', 'admin']);
 *   const visibleProjectIds = await getVisibleProjectIds(session);
 *   if (!visibleProjectIds.includes(projectId)) {
 *     throw new Error('Forbidden');
 *   }
 * }
 * ```
 */
export function placeholder() {
  return;
}
