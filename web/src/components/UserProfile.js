import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import supabase from '../lib/supabase';
import { toast } from 'react-hot-toast';

const UserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [business, setBusiness] = useState(null);
  const [associates, setAssociates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfileAndBusiness();
    }
  }, [user]);

  const fetchProfileAndBusiness = async () => {
    try {
      // Fetch profile with business details
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          businesses (
            id,
            name,
            associate_slots
          )
        `)
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      
      setProfile(profileData);
      setBusiness(profileData.businesses);
      
      // If user is boss, fetch associates
      if (profileData.role === 'boss') {
        const { data: associatesData, error: associatesError } = await supabase
          .from('profiles')
          .select('*')
          .eq('business_id', profileData.business_id)
          .eq('role', 'associate')
          .order('associate_number');
        
        if (associatesError) throw associatesError;
        setAssociates(associatesData || []);
      }
    } catch (error) {
      console.error('Error fetching profile:', error.message);
      toast.error('Failed to load profile information');
    } finally {
      setLoading(false);
    }
  };

  const generateAssociateInviteLink = (slotNumber) => {
    const baseUrl = window.location.origin;
    const params = new URLSearchParams({
      business_id: business.id,
      slot: slotNumber,
      role: 'associate'
    });
    return `${baseUrl}/register?${params.toString()}`;
  };

  const copyInviteLink = async (slotNumber) => {
    const link = generateAssociateInviteLink(slotNumber);
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Invite link copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy invite link');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">User Profile</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Business Name</label>
            <p className="mt-1 text-lg font-semibold text-gray-900">{business?.name}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <p className="mt-1 text-lg font-semibold text-gray-900">{profile?.full_name}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <p className="mt-1 text-lg font-semibold text-gray-900 capitalize">{profile?.role}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <p className="mt-1 text-lg font-medium text-gray-500">{profile?.email}</p>
          </div>

          {profile?.role === 'associate' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Associate Number</label>
              <p className="mt-1 text-lg font-medium text-gray-500">AR{profile?.associate_number}</p>
            </div>
          )}
        </div>
      </div>

      {/* Associates Management - Only visible for Boss role */}
      {profile?.role === 'boss' && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Associates Management</h3>
          
          <div className="space-y-4">
            {[...Array(business?.associate_slots || 0)].map((_, index) => {
              const slotNumber = index + 1;
              const associate = associates.find(a => a.associate_number === slotNumber);
              
              return (
                <div key={slotNumber} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <input
                      type="checkbox"
                      checked={!!associate}
                      readOnly
                      className="h-4 w-4 text-primary-600 rounded border-gray-300"
                    />
                    <div>
                      {associate ? (
                        <>
                          <p className="font-medium text-gray-900">AR{slotNumber}: {associate.full_name}</p>
                          <p className="text-sm text-gray-500">{associate.email}</p>
                        </>
                      ) : (
                        <p className="text-gray-500">Associate Slot {slotNumber} (Vacant)</p>
                      )}
                    </div>
                  </div>
                  
                  {!associate && (
                    <button
                      onClick={() => copyInviteLink(slotNumber)}
                      className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Copy Invite Link
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          
          <p className="mt-4 text-sm text-gray-500">
            You can have up to {business?.associate_slots} associates in your business.
          </p>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
