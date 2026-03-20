// ============================================================
// ROLE GUARD
// Component seviyesinde rol/izin bazlı görünürlük kontrolü.
// ============================================================
import type { ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ROLE_PERMISSIONS } from '../../types';
import type { Permission, UserRole } from '../../types';

interface RoleGuardProps {
  /** İzin verilen roller (OR mantığı) */
  roles?: UserRole[];
  /** Gerekli izin */
  permission?: Permission;
  /** Erişim yoksa gösterilecek alternatif (varsayılan: null) */
  fallback?: ReactNode;
  children: ReactNode;
}

export function RoleGuard({
  roles,
  permission,
  fallback = null,
  children,
}: RoleGuardProps) {
  const { currentUser } = useAuth();

  if (!currentUser) return <>{fallback}</>;

  // Rol kontrolü
  if (roles && !roles.includes(currentUser.role)) {
    return <>{fallback}</>;
  }

  // İzin kontrolü
  if (permission && !ROLE_PERMISSIONS[currentUser.role].includes(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
