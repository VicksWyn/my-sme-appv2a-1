import React, { useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useNavigate } from 'react-router-dom';

const AssociateOnboarding = () => {
  const [businessCode, setBusinessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const supabase = useSupabaseClient();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      // Find business by code
      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .select('id, business_name, owner_id')
        .eq('registration_number', businessCode)
        .single();

      if (businessError) {
        if (businessError.code === 'PGRST116') {
          throw new Error('Invalid business code. Please check and try again.');
        }
        throw businessError;
      }

      // Check if already associated
      const { data: existingAssociation, error: associationCheckError } = await supabase
        .from('business_associates')
        .select('id, status')
        .eq('business_id', business.id)
        .eq('associate_id', user.id)
        .single();

      if (associationCheckError && associationCheckError.code !== 'PGRST116') {
        throw associationCheckError;
      }

      if (existingAssociation) {
        if (existingAssociation.status === 'active') {
          throw new Error('You are already associated with this business.');
        } else {
          // Reactivate association
          const { error: updateError } = await supabase
            .from('business_associates')
            .update({ status: 'active' })
            .eq('id', existingAssociation.id);

          if (updateError) throw updateError;
        }
      } else {
        // Create new association
        const { error: createError } = await supabase
          .from('business_associates')
          .insert([
            {
              business_id: business.id,
              associate_id: user.id,
              status: 'active'
            }
          ]);

        if (createError) throw createError;
      }

      // Navigate to dashboard with business data
      navigate('/associate-dashboard', { 
        state: { 
          business,
          message: `Successfully joined ${business.business_name}!`
        }
      });

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Join a Business
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter the business code provided by your employer
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Business Code
              </label>
              <input
                type="text"
                required
                value={businessCode}
                onChange={(e) => setBusinessCode(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Enter business registration number"
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  loading ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Joining...' : 'Join Business'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Need help?
                </span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Contact your employer for the business registration number
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssociateOnboarding;
