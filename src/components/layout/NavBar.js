import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const NavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile, loading } = useAuth();

  const isActive = (path) => location.pathname.startsWith(path);

  const handleNavigation = async (path) => {
    try {
      // Check if user is authenticated and has business context
      if (!userProfile?.business?.id) {
        toast.error('Please select a business first');
        navigate('/dashboard/boss');
        return;
      }

      // Navigate to the appropriate route
      switch (path) {
        case '/stock':
          navigate('/stock/list', {
            state: { 
              business: userProfile.business,
              from: location.pathname 
            }
          });
          break;
        case '/sales':
          navigate('/sales/history', {
            state: { 
              business: userProfile.business,
              from: location.pathname 
            }
          });
          break;
        default:
          navigate(path);
      }
    } catch (error) {
      console.error('Navigation error:', error);
      toast.error('Error navigating to page');
    }
  };

  // Only show navbar if user is logged in and not on auth pages
  if (loading || 
      location.pathname.includes('/login') || 
      location.pathname.includes('/register') || 
      location.pathname.includes('/forgot-password') || 
      location.pathname.includes('/reset-password')) {
    return null;
  }

  return (
    <nav className="bg-white shadow-lg fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and App Name */}
          <div className="flex-shrink-0 flex items-center">
            <span 
              className="text-2xl font-bold text-indigo-600 cursor-pointer"
              onClick={() => navigate('/dashboard/boss')}
            >
              SME Tracker
            </span>
          </div>

          {/* Navigation Links */}
          <div className="flex space-x-8">
            {userProfile?.business && (
              <>
                {/* Stock Link */}
                <button
                  onClick={() => handleNavigation('/stock')}
                  className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                    isActive('/stock')
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  } transition-all duration-200`}
                >
                  Stock
                </button>

                {/* Sales Link */}
                <button
                  onClick={() => handleNavigation('/sales')}
                  className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                    isActive('/sales')
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  } transition-all duration-200`}
                >
                  Sales
                </button>
              </>
            )}
          </div>

          {/* User Info */}
          <div className="flex items-center">
            {userProfile?.business && (
              <span className="text-sm text-gray-700 mr-4">
                {userProfile.business.name}
              </span>
            )}
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md hover:bg-gray-50"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
