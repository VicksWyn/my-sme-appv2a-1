import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import SMEProfileSetup from './SMEProfileSetup';
import BossDashboard from './BossDashboard';
import AssociateDashboard from './AssociateDashboard';

const RoleDashboard = () => {
  const { userProfile, loading } = useAuth();
  const [showProfileSetup, setShowProfileSetup] = useState(false);

  useEffect(() => {
    // Check if user needs to set up SME profile
    if (!loading && userProfile && !userProfile.sme_details) {
      setShowProfileSetup(true);
    } else {
      setShowProfileSetup(false);
    }
  }, [userProfile, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (showProfileSetup) {
    return (
      <div className="container mx-auto px-4 py-8">
        <SMEProfileSetup 
          onProfileCreated={async () => {
            setShowProfileSetup(false);
          }}
        />
      </div>
    );
  }

  // Check user role and render appropriate dashboard
  const isBoss = userProfile?.role?.toLowerCase() === 'boss';
  
  return (
    <div>
      {isBoss ? (
        <BossDashboard smeDetails={userProfile?.sme_details} />
      ) : (
        <AssociateDashboard />
      )}
    </div>
  );
};

export default RoleDashboard;
