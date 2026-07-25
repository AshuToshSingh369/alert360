export type AccessRole = 'admin' | 'citizen' | 'guest' | 'operator';

export interface AccessState {
  canAccess: boolean;
  role: AccessRole;
  reason?: 'role' | 'auth';
}

export function isAdminLikeRole(role: string | null | undefined): boolean {
  const normalizedRole = (role || 'guest').toLowerCase() as AccessRole;
  return normalizedRole === 'admin' || normalizedRole === 'operator';
}

export function getAccessState(role: string | null | undefined): AccessState {
  const normalizedRole = (role || 'guest').toLowerCase() as AccessRole;

  if (isAdminLikeRole(normalizedRole)) {
    return { canAccess: true, role: normalizedRole };
  }

  return { canAccess: false, role: normalizedRole, reason: 'role' };
}

export function summarizeIncidentStats(items: Array<{ status?: string }>) {
  return items.reduce(
    (summary, item) => {
      const status = item.status || 'pending';
      if (status === 'in-progress') summary.inProgress += 1;
      else if (status === 'resolved') summary.resolved += 1;
      else summary.pending += 1;
      return summary;
    },
    { pending: 0, inProgress: 0, resolved: 0 },
  );
}
