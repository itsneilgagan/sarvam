import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  redirectTo?: string;
}

const ProtectedRoute = ({ children, requiredRole, redirectTo = '/login' }: ProtectedRouteProps) => {
  const { user, profile, loading, profileLoading } = useAuth();

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  if (requiredRole) {
    if (!profile) {
      return <Navigate to="/onboarding" replace />;
    }
    if (profile.role !== requiredRole) {
      return <Navigate to="/browse" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
