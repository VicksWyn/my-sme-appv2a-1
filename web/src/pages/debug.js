import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { debugSupabase } from '../lib/supabase';
import supabase from '../lib/supabase';

const DebugPage = () => {
  const { user, userProfile, loading } = useAuth();
  const [debugData, setDebugData] = useState({
    session: null,
    profile: null,
    allProfiles: null,
    errors: [],
    rls: null,
    directQuery: null
  });

  useEffect(() => {
    const runDebugChecks = async () => {
      try {
        console.log('Starting debug checks...');
        
        // Check session
        const sessionResult = await debugSupabase.checkSession();
        console.log('Session check complete:', sessionResult);
        
        // Check profile if we have a user
        let profileResult = null;
        let directQueryResult = null;
        if (user?.id) {
          console.log('Checking profile for user:', user.id);
          profileResult = await debugSupabase.checkProfile(user.id);
          console.log('Profile check complete:', profileResult);

          // Direct query to check RLS
          const { data: rlsCheck, error: rlsError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          console.log('RLS check:', { data: rlsCheck, error: rlsError });

          // Direct database query with service role
          const { data: directData, error: directError } = await supabase.rpc(
            'debug_get_profile',
            { user_id: user.id }
          );

          directQueryResult = { data: directData, error: directError };
          console.log('Direct query result:', directQueryResult);

          setDebugData(prev => ({
            ...prev,
            rls: { data: rlsCheck, error: rlsError },
            directQuery: directQueryResult
          }));
        } else {
          console.log('No user ID available for profile check');
        }

        // List all profiles
        console.log('Fetching all profiles...');
        const allProfilesResult = await debugSupabase.listProfiles();
        console.log('All profiles fetch complete:', allProfilesResult);

        setDebugData(prev => ({
          ...prev,
          session: sessionResult,
          profile: profileResult,
          allProfiles: allProfilesResult,
          errors: []
        }));
      } catch (error) {
        console.error('Debug checks failed:', error);
        setDebugData(prev => ({
          ...prev,
          errors: [...prev.errors, error]
        }));
      }
    };

    runDebugChecks();
  }, [user]);

  const renderObject = (obj) => {
    if (!obj) return 'null';
    try {
      return (
        <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
          {JSON.stringify(obj, null, 2)}
        </pre>
      );
    } catch (error) {
      return (
        <div className="text-red-600">
          Error rendering object: {error.message}
        </div>
      );
    }
  };

  const renderSection = (title, content, summary = null, error = null) => (
    <section className="mb-8 p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      {summary && (
        <div className="text-sm text-gray-600 mb-2">
          {summary}
        </div>
      )}
      {error && (
        <div className="text-sm text-red-600 mb-2">
          Error: {error.message || JSON.stringify(error)}
        </div>
      )}
      {content}
    </section>
  );

  const renderAuthStatus = () => {
    const status = {
      authenticated: !!user,
      hasProfile: !!userProfile,
      role: userProfile?.role || 'none',
      sessionValid: !!debugData.session?.data?.session,
      rlsWorking: !!debugData.rls?.data,
      directQueryWorking: !!debugData.directQuery?.data
    };

    return (
      <div className="grid grid-cols-2 gap-4 mb-4">
        {Object.entries(status).map(([key, value]) => (
          <div key={key} className={`p-2 rounded ${value ? 'bg-green-100' : 'bg-red-100'}`}>
            <span className="font-medium">{key}:</span> {value.toString()}
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Authentication Debug Page</h1>
      
      {renderSection(
        "Authentication Status",
        renderAuthStatus()
      )}

      {renderSection(
        "Current User",
        renderObject(user),
        user ? `User ID: ${user.id}` : 'No user logged in'
      )}

      {renderSection(
        "User Profile",
        renderObject(userProfile),
        userProfile ? `Role: ${userProfile.role}` : 'No profile loaded'
      )}

      {renderSection(
        "Session Data",
        renderObject(debugData.session),
        debugData.session?.data?.session ? 'Active session' : 'No active session'
      )}

      {renderSection(
        "Profile Check (Direct Query)",
        renderObject(debugData.profile),
        'Direct profile query result',
        debugData.profile?.error
      )}

      {renderSection(
        "RLS Check",
        renderObject(debugData.rls),
        'Row Level Security check result',
        debugData.rls?.error
      )}

      {renderSection(
        "Service Role Query",
        renderObject(debugData.directQuery),
        'Direct database query result (bypassing RLS)',
        debugData.directQuery?.error
      )}

      {renderSection(
        "All Profiles",
        renderObject(debugData.allProfiles),
        debugData.allProfiles?.data ? 
          `Found ${debugData.allProfiles.data.length} profiles` : 
          'No profiles found',
        debugData.allProfiles?.error
      )}

      {debugData.errors.length > 0 && renderSection(
        "Errors",
        debugData.errors.map((error, index) => (
          <div key={index} className="text-red-600 mb-2">
            {renderObject(error)}
          </div>
        )),
        `${debugData.errors.length} error(s) occurred`
      )}
    </div>
  );
};

export default DebugPage;
