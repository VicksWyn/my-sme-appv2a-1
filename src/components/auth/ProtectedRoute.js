import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';

const ProtectedRoute = ({ children, requiredRole }) => {
  const session = useSession();
  const location = useLocation();
  const supabase = useSupabaseClient();
  const [loading, setLoading] = React.useState(true);
  const [hasAccess, setHasAccess] = React.useState(false);

  React.useEffect(() => {
    const checkAccess = async () => {
      if (!session?.user) {
        setLoading(false);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (error) throw error;

        // If no required role specified, just need to be authenticated
        // Otherwise, check if user's role matches required role
        setHasAccess(
          !requiredRole || profile.role === requiredRole
        );
      } catch (error) {
        console.error('Error checking access:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [session, supabase, requiredRole]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!hasAccess) {
    return <Navigate to="/login" state={{ from: location, error: 'Unauthorized access' }} replace />;
  }

  return children;
};

export default ProtectedRoute;
