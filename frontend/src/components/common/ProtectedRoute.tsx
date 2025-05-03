import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requireOrganizer?: boolean;
}

export const ProtectedRoute = ({ 
  children, 
  requireOrganizer = false 
}: ProtectedRouteProps) => {
  const { isAuthenticated, isOrganizer, loading } = useAuth();

  // Show loading indicator while checking authentication
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  // Redirect to home if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Check if organizer role is required
  if (requireOrganizer && !isOrganizer) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}; 