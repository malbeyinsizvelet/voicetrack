// ============================================================
// PROTECTED ROUTE
// Oturum açılmamışsa Login'e yönlendirir.
// isLoading süresince splash gösterir.
// ============================================================
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FullPageSpinner } from '../ui/Spinner';

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullPageSpinner />;

  if (!isAuthenticated) {
    // Kullanıcının gitmek istediği yolu saklıyoruz — login sonrası redirect için
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
