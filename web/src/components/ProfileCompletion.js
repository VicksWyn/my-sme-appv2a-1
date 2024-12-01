import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import supabase from '../lib/supabase';
import { toast } from 'react-hot-toast';

const ProfileCompletion = () => {
  const { user, userProfile, setUserProfile } = useAuth();
  const [businessName, setBusinessName] = useState('');
  const [fullName, setFullName] = useState('');
  const [associateSlots, setAssociateSlots] = useState(2);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create business first
      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .insert([
          {
            name: businessName,
            associate_slots: associateSlots
          }
        ])
        .select()
        .single();

      if (businessError) throw businessError;

      // Create profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: user.id,
            email: user.email,
            full_name: fullName,
            business_id: business.id,
            role: 'boss'
          }
        ])
        .select()
        .single();

      if (profileError) throw profileError;

      setUserProfile(profile);
      toast.success('Profile completed successfully!');
    } catch (error) {
      console.error('Error completing profile:', error);
      toast.error('Failed to complete profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (userProfile) {
    return null; // Don't show if profile exists
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-6 text-center">Complete Your Profile</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Business Name</label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="Enter your business name"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="Enter your full name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Associate Slots</label>
          <input
            type="number"
            value={associateSlots}
            onChange={(e) => setAssociateSlots(parseInt(e.target.value))}
            min="1"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
            isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isSubmitting ? 'Completing Profile...' : 'Complete Profile'}
        </button>
      </form>
    </div>
  );
};

export default ProfileCompletion;
