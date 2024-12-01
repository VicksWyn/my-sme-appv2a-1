import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import supabase from '../lib/supabase';
import { toast } from 'react-hot-toast';

const SetupBusiness = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [businessName, setBusinessName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    try {
      // Create business
      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .insert([{ name: businessName }])
        .select()
        .single();

      if (businessError) throw businessError;

      // Update user profile with business reference
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          business_id: business.id,
          role: 'owner'
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      toast.success('Business setup complete!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Setup error:', error);
      toast.error(error.message || 'Failed to setup business');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Setup Your Business
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Let's get your business set up in our system
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="business-name" className="sr-only">
                Business Name
              </label>
              <input
                id="business-name"
                name="businessName"
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Enter your business name"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Setting up...' : 'Complete Setup'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SetupBusiness;
