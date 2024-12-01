import React, { useState } from 'react';
import supabase from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import Toast from './Toast';

const SMEProfileSetup = ({ onProfileCreated }) => {
  const { user, refreshProfile } = useAuth();
  const [formData, setFormData] = useState({
    business_name: '',
    business_type: '',
    address: '',
    phone: '',
    registration_number: ''
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // Prevent double submission
    setLoading(true);

    try {
      // First, check if user already has an SME profile
      const { data: existingProfile, error: profileError } = await supabase
        .from('sme_details')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Profile check error:', profileError);
        throw new Error('Failed to check existing profile');
      }

      if (existingProfile?.id) {
        showToast('You already have an SME profile', 'warning');
        setLoading(false);
        return;
      }

      // Create SME profile
      const { data: smeProfile, error: smeError } = await supabase
        .from('sme_details')
        .insert({
          owner_id: user.id,
          business_name: formData.business_name,
          business_type: formData.business_type,
          address: formData.address,
          phone: formData.phone,
          registration_number: formData.registration_number || null,
          status: 'active'
        })
        .select()
        .single();

      if (smeError) {
        console.error('SME Creation Error:', smeError);
        throw new Error(smeError.message || 'Failed to create SME profile');
      }

      // Update user's profile with SME ID and role
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          sme_id: smeProfile.id,
          role: 'boss'
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Profile Update Error:', updateError);
        // Try to rollback SME creation
        await supabase
          .from('sme_details')
          .delete()
          .eq('id', smeProfile.id);
        throw new Error('Failed to update user profile');
      }

      showToast('SME profile created successfully!', 'success');
      await refreshProfile();
      
      if (onProfileCreated) {
        onProfileCreated(smeProfile);
      }

    } catch (error) {
      console.error('Error creating SME profile:', error);
      showToast(error.message || 'Failed to create SME profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      {toast.show && <Toast message={toast.message} type={toast.type} />}
      
      <h2 className="text-2xl font-semibold mb-6">Set Up Your Business Profile</h2>
      <p className="text-gray-600 mb-6">
        Please provide your business details to complete your profile setup.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Business Name</label>
          <input
            type="text"
            name="business_name"
            value={formData.business_name}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Business Type</label>
          <select
            name="business_type"
            value={formData.business_type}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="">Select a business type</option>
            <option value="retail">Retail</option>
            <option value="wholesale">Wholesale</option>
            <option value="manufacturing">Manufacturing</option>
            <option value="service">Service</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Business Address</label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Phone Number</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Registration Number (Optional)</label>
          <input
            type="text"
            name="registration_number"
            value={formData.registration_number}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
        >
          {loading ? 'Creating Profile...' : 'Create Business Profile'}
        </button>
      </form>
    </div>
  );
};

export default SMEProfileSetup;
