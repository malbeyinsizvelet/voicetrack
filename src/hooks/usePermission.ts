// ============================================================
// usePermission HOOK
// Rol bazlı izin kontrolü. Component'larda şöyle kullanılır:
//
//   const canWrite = usePermission('projects:write');
//   const { hasAll, hasAny } = usePermissions(['qc:read', 'qc:approve']);
//
// Gerçek sistemde bu izinler JWT claim'lerinden veya
// backend permission API'sinden gelir.
// ============================================================

import { useAuth } from '../context/AuthContext';
import { ROLE_PERMISSIONS } from '../types';
import type { Permission } from '../types';

/**
 * Tek bir izni kontrol eder.
 */
export function usePermission(permission: Permission): boolean {
  const { currentUser } = useAuth();
  if (!currentUser) return false;
  return ROLE_PERMISSIONS[currentUser.role].includes(permission);
}

/**
 * Birden fazla izni kontrol eder.
 * hasAll: tümüne sahip mi?
 * hasAny: herhangi birine sahip mi?
 */
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
  const check  = (p: Permission) => userPerms.includes(p);

  return { hasAll, hasAny, check };
}

/**
 * Verilen rollere sahip mi?
 */
export function useRole(...roles: Array<import('../types').UserRole>): boolean {
  const { currentUser } = useAuth();
  if (!currentUser) return false;
  return roles.includes(currentUser.role);
}
