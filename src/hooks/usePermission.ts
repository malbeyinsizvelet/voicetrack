// ============================================================
// usePermission HOOK
// Rol bazlı izin kontrolü.
// ============================================================
import { useAuth } from '../context/AuthContext';
import { ROLE_PERMISSIONS } from '../types';
import type { Permission } from '../types';

export function usePermission(permission: Permission): boolean {
  const { currentUser } = useAuth();
  if (!currentUser) return false;
  return ROLE_PERMISSIONS[currentUser.role].includes(permission);
}

export function usePermissions(permissions: Permission[]): {
  hasAll: boolean;
  hasAny: boolean;
  check: (p: Permission) => boolean;
} {
  const { currentUser } = useAuth();
  if (!currentUser) {
    return { hasAll: false, hasAny: false, check: () => false };
  }
  const userPerms = ROLE_PERMISSIONS[currentUser.role];
  const hasAll = permissions.every((p) => userPerms.includes(p));
  const hasAny = permissions.some((p) => userPerms.includes(p));
  const check = (p: Permission) => userPerms.includes(p);
  return { hasAll, hasAny, check };
}

export function useRole(...roles: Array<import('../types').UserRole>): boolean {
  const { currentUser } = useAuth();
  if (!currentUser) return false;
  return roles.includes(currentUser.role);
}
