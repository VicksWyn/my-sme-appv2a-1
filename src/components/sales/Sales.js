import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const Sales = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  if (!userProfile?.business) {
    toast.error('No business selected');
    navigate('/dashboard/boss');
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Sales Management</h2>
        <button
          onClick={() => navigate('/dashboard/boss')}
          className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg shadow transition-colors duration-200"
        >
          Back to Dashboard
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Record Sale Card */}
        <div className="bg-white rounded-lg shadow-md p-6 transform hover:scale-105 transition-transform duration-200">
          <h3 className="text-lg font-semibold mb-4">Record Sale</h3>
          <p className="text-gray-600 mb-4">Record a new sale transaction for your business.</p>
          <button
            onClick={() => navigate('/sales/record')}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg shadow transition-colors duration-200"
          >
            Record Sale
          </button>
        </div>

        {/* Sales History Card */}
        <div className="bg-white rounded-lg shadow-md p-6 transform hover:scale-105 transition-transform duration-200">
          <h3 className="text-lg font-semibold mb-4">Sales History</h3>
          <p className="text-gray-600 mb-4">View and manage your sales history.</p>
          <button
            onClick={() => navigate('/sales/history')}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg shadow transition-colors duration-200"
          >
            View History
          </button>
        </div>

        {/* Sales Reports Card */}
        <div className="bg-white rounded-lg shadow-md p-6 transform hover:scale-105 transition-transform duration-200">
          <h3 className="text-lg font-semibold mb-4">Sales Reports</h3>
          <p className="text-gray-600 mb-4">Generate and view sales reports.</p>
          <button
            onClick={() => navigate('/sales/reports')}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-4 rounded-lg shadow transition-colors duration-200"
          >
            View Reports
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sales;
