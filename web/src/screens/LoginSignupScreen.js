import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const LoginSignupScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp, registerAssociate } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  // Get registration parameters from URL if they exist
  const searchParams = new URLSearchParams(location.search);
  const businessId = searchParams.get('business_id');
  const associateSlot = searchParams.get('slot');
  const isAssociateRegistration = businessId && associateSlot;

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    businessName: '',
    associateSlots: 2
  });

  useEffect(() => {
    // If we have business_id and slot in URL, switch to registration mode
    if (isAssociateRegistration) {
      setIsLogin(false);
    }
  }, [isAssociateRegistration]);

  const handleChange = (e) => {
    const value = e.target.type === 'number' 
      ? Math.min(Math.max(parseInt(e.target.value) || 2, 2), 5)
      : e.target.value;

    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      if (isLogin) {
        // Handle login
        const { error } = await signIn(formData.email, formData.password);
        if (error) throw error;
      } else if (isAssociateRegistration) {
        // Handle associate registration
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }

        const { error } = await registerAssociate(
          formData.email,
          formData.password,
          formData.fullName,
          businessId,
          parseInt(associateSlot)
        );
        if (error) throw error;

        toast.success('Registration successful! Please check your email for verification.');
        navigate('/login');
      } else {
        // Handle boss registration
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }

        const { error } = await signUp(
          formData.email,
          formData.password,
          formData.fullName,
          formData.businessName,
          formData.associateSlots
        );
        if (error) throw error;

        toast.success('Registration successful! Please check your email for verification.');
        navigate('/login');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isLogin ? 'Sign in to your account' : 
             isAssociateRegistration ? 'Register as Associate' : 
             'Register your Business'}
          </h2>
          {!isLogin && (
            <p className="mt-2 text-center text-sm text-gray-600">
              {isAssociateRegistration ? 
                'Complete your associate registration' : 
                'Create your business account'}
            </p>
          )}
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Email address"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Password"
              />
            </div>

            {!isLogin && (
              <>
                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <input
                    id="confirm-password"
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Confirm password"
                  />
                </div>

                <div>
                  <label htmlFor="full-name" className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    id="full-name"
                    name="fullName"
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Your full name"
                  />
                </div>

                {!isAssociateRegistration && (
                  <>
                    <div>
                      <label htmlFor="business-name" className="block text-sm font-medium text-gray-700">
                        Business Name
                      </label>
                      <input
                        id="business-name"
                        name="businessName"
                        type="text"
                        required
                        value={formData.businessName}
                        onChange={handleChange}
                        className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Your business name"
                      />
                    </div>

                    <div>
                      <label htmlFor="associate-slots" className="block text-sm font-medium text-gray-700">
                        Number of Associates (2-5)
                      </label>
                      <input
                        id="associate-slots"
                        name="associateSlots"
                        type="number"
                        min="2"
                        max="5"
                        required
                        value={formData.associateSlots}
                        onChange={handleChange}
                        className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Register'}
            </button>
          </div>

          {!isAssociateRegistration && (
            <div className="text-sm text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                {isLogin ? 'Need to register?' : 'Already have an account?'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default LoginSignupScreen;
