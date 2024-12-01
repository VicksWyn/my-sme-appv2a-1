import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Loading component
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-secondary-50">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600"></div>
  </div>
);

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading, user, userProfile } = useAuth();

  // Show loading screen while checking authentication
  if (loading) {
    return <LoadingScreen />;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    // Save the current path to redirect back after login
    localStorage.setItem('redirectPath', window.location.pathname);
    return <Navigate to="/login" replace />;
  }

  // If authenticated but profile is not loaded yet, show loading screen
  if (isAuthenticated && !userProfile) {
    return <LoadingScreen />;
  }

  return children;
};

export default PrivateRoute;
