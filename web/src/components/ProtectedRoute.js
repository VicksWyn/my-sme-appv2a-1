import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

const ProtectedRoute = ({ 
  children, 
  requiredRole = null,
  requireProfile = true
}) => {
  const { user, userProfile, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      toast.error('Please sign in to access this page');
    }
  }, [loading, user]);

  // Show loading spinner while checking auth state
  if (loading) {
    return <LoadingSpinner />;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if we need to wait for profile
  if (requireProfile) {
    // Wait for profile to load
    if (!userProfile) {
      return <LoadingSpinner />;
    }

    // Check role if required
    if (requiredRole && userProfile.role?.toLowerCase() !== requiredRole.toLowerCase()) {
      toast.error(`You need ${requiredRole} permissions to access this page`);
      const redirectPath = userProfile.role?.toLowerCase() === 'associate' 
        ? '/sales' 
        : '/dashboard';
      return <Navigate to={redirectPath} replace />;
    }

    // Check if business exists
    if (!userProfile.business_id) {
      return <Navigate to="/setup-business" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
