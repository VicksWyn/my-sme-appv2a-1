import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import toast from 'react-hot-toast';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const session = useSession();
  const supabase = useSupabaseClient();
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (session?.user) {
      setUser(session.user);
      fetchProfile(session.user.id);
    } else {
      setUser(null);
      setUserProfile(null);
      setLoading(false);
    }
  }, [session]);

  const fetchProfile = async (userId) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*, business:businesses(*)')
        .eq('id', userId)
        .single();

      if (error) {
        // If it's a network error and we haven't retried too many times
        if (error.message.includes('network') && retryCount < 3) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            fetchProfile(userId);
          }, 2000); // Wait 2 seconds before retrying
          return;
        }
        throw error;
      }

      setUserProfile(profile);
      setRetryCount(0); // Reset retry count on success
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Error loading profile. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setUserProfile(null);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
      // If it's a network error, we can still clear the local state
      if (error.message.includes('network')) {
        setUser(null);
        setUserProfile(null);
        toast.success('Logged out successfully');
      } else {
        toast.error('Error signing out');
      }
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    session,
    signOut,
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
