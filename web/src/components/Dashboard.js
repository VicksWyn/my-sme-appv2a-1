import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const BossDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Stock Management */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-xl font-semibold mb-4">Stock Management</h3>
        <div className="space-y-4">
          <button
            onClick={() => navigate('/stock/record')}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Update Stock
          </button>
          <button
            onClick={() => navigate('/stock/list')}
            className="w-full py-2 px-4 bg-gray-100 text-gray-900 rounded hover:bg-gray-200 transition-colors"
          >
            View Current Stock
          </button>
        </div>
      </div>

      {/* Sales Overview */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-xl font-semibold mb-4">Sales Overview</h3>
        <select
          className="w-full p-2 border rounded mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          onChange={(e) => {
            if (e.target.value) {
              navigate(`/sales/${e.target.value}`);
            }
          }}
        >
          <option value="">Select Duration</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="semi-annual">Semi-Annually</option>
          <option value="annual">Annually</option>
        </select>
      </div>

      {/* Receipt Management */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-xl font-semibold mb-4">Receipt Management</h3>
        <div className="space-y-4">
          <button
            onClick={() => navigate('/receipts/new')}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            New Receipt
          </button>
          <button
            onClick={() => navigate('/receipts/list')}
            className="w-full py-2 px-4 bg-gray-100 text-gray-900 rounded hover:bg-gray-200"
          >
            Receipt History
          </button>
        </div>
      </div>

      {/* Business Info */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-xl font-semibold mb-4">Business Information</h3>
        <div className="space-y-2">
          <p><span className="font-medium">Business Name:</span> {profile.sme?.business_name || 'Not set'}</p>
          <p><span className="font-medium">Business Type:</span> {profile.sme?.business_type || 'Not set'}</p>
          <p><span className="font-medium">Status:</span> {profile.sme?.status || 'Not set'}</p>
        </div>
      </div>
    </div>
  );

  const AssociateDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Stock Recording */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-xl font-semibold mb-4">Stock Management</h3>
        <button
          onClick={() => navigate('/stock/record')}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Record Stock Changes
        </button>
      </div>

      {/* Daily Sales */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-xl font-semibold mb-4">Daily Sales</h3>
        <button
          onClick={() => navigate('/sales/record')}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Record Sales
        </button>
      </div>

      {/* Business Info */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-xl font-semibold mb-4">Business Information</h3>
        <div className="space-y-2">
          <p><span className="font-medium">Your Role:</span> Associate</p>
          <p><span className="font-medium">Business Name:</span> {profile.sme?.business_name || 'Not set'}</p>
          <p><span className="font-medium">Manager:</span> {profile.boss_name || 'Not set'}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Welcome back, {profile.full_name}!
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {profile.role === 'boss' ? 'Business Owner Dashboard' : 'Associate Dashboard'}
          </p>
        </div>

        {profile.role === 'boss' ? <BossDashboard /> : <AssociateDashboard />}
      </div>
    </div>
  );
};

export default Dashboard;
