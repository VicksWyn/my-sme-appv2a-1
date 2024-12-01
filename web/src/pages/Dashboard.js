import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [stockStats, setStockStats] = useState({
    totalItems: 0,
    lowStockItems: 0,
    totalValue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStockStats();
  }, [user]);

  const fetchStockStats = async () => {
    try {
      if (!user) return;

      const { data: stockItems, error } = await supabase
        .from('stock_items')
        .select('*');

      if (error) throw error;

      const totalValue = stockItems.reduce((sum, item) => 
        sum + (item.quantity * item.unit_price), 0);
      
      const lowStockItems = stockItems.filter(item => 
        item.quantity <= item.reorder_level).length;

      setStockStats({
        totalItems: stockItems.length,
        lowStockItems,
        totalValue
      });
    } catch (error) {
      console.error('Error fetching stock stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (!error) {
      navigate('/login');
    }
  };

  const handleNavigateToStock = () => {
    navigate('/stock');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-md backdrop-blur-sm bg-white/90 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and Brand */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-500">SME Tracker</span>
              </div>
              {/* Navigation Links */}
              <div className="hidden md:ml-6 md:flex md:space-x-8">
                <a href="#" className="border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200">
                  Dashboard
                </a>
                <a href="#" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200">
                  Stock
                </a>
                <a href="#" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200">
                  Sales
                </a>
              </div>
            </div>
            {/* User Menu */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-sm text-gray-500 mr-4">{user?.email}</span>
                <button
                  onClick={handleSignOut}
                  className="relative inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-indigo-600 to-blue-500 shadow-sm hover:from-indigo-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Section */}
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-xl mb-6 transition-transform duration-300 hover:scale-[1.01]">
            <div className="p-8">
              <h1 className="text-3xl font-bold text-gray-900">Welcome back!</h1>
              <p className="mt-2 text-lg text-gray-600">Here's what's happening with your business today.</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Total Stock Items Card */}
            <div className="bg-white overflow-hidden shadow-lg rounded-xl transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border border-gray-100">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-3 bg-blue-50 rounded-lg">
                    <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Stock Items</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-bold text-gray-900">{stockStats.totalItems}</div>
                        <span className="ml-2 text-sm text-gray-500">items</span>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Low Stock Alert Card */}
            <div className="bg-white overflow-hidden shadow-lg rounded-xl transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border border-gray-100">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-3 bg-red-50 rounded-lg">
                    <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Low Stock Items</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-bold text-gray-900">{stockStats.lowStockItems}</div>
                        <span className="ml-2 text-sm text-gray-500">items need attention</span>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Stock Value Card */}
            <div className="bg-white overflow-hidden shadow-lg rounded-xl transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border border-gray-100">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-3 bg-green-50 rounded-lg">
                    <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Stock Value</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-bold text-gray-900">${stockStats.totalValue.toFixed(2)}</div>
                        <span className="ml-2 text-sm text-gray-500">USD</span>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Stock Management Button */}
              <button
                onClick={handleNavigateToStock}
                className="group relative block w-full bg-white border-2 border-gray-200 rounded-xl p-8 text-center hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300"
              >
                <div className="aspect-w-1 aspect-h-1 rounded-lg bg-blue-50 group-hover:bg-blue-100 p-4 transition-colors duration-300">
                  <svg className="mx-auto h-12 w-12 text-blue-600 group-hover:text-blue-700 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <span className="mt-4 block text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">Manage Stock</span>
              </button>

              <button className="group relative block w-full bg-white border-2 border-gray-200 rounded-xl p-8 text-center hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300">
                <div className="aspect-w-1 aspect-h-1 rounded-lg bg-indigo-50 group-hover:bg-indigo-100 p-4 transition-colors duration-300">
                  <svg className="mx-auto h-12 w-12 text-indigo-600 group-hover:text-indigo-700 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="mt-4 block text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors duration-300">Add New Product</span>
              </button>

              <button className="group relative block w-full bg-white border-2 border-gray-200 rounded-xl p-8 text-center hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300">
                <div className="aspect-w-1 aspect-h-1 rounded-lg bg-blue-50 group-hover:bg-blue-100 p-4 transition-colors duration-300">
                  <svg className="mx-auto h-12 w-12 text-blue-600 group-hover:text-blue-700 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <span className="mt-4 block text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">Record Sale</span>
              </button>

              <button className="group relative block w-full bg-white border-2 border-gray-200 rounded-xl p-8 text-center hover:border-green-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300">
                <div className="aspect-w-1 aspect-h-1 rounded-lg bg-green-50 group-hover:bg-green-100 p-4 transition-colors duration-300">
                  <svg className="mx-auto h-12 w-12 text-green-600 group-hover:text-green-700 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="mt-4 block text-sm font-semibold text-gray-900 group-hover:text-green-600 transition-colors duration-300">View Reports</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
