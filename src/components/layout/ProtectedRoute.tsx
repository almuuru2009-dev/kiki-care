import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRole?: 'kinesiologist' | 'caregiver';
}

export function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-2 border-mint border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-2 border-mint border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (allowedRole && profile.role !== allowedRole) {
    const redirect = profile.role === 'kinesiologist' ? '/kine/home' : '/cuidadora/home';
    return <Navigate to={redirect} replace />;
  }

  return <>{children}</>;
}
