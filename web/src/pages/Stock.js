import React from 'react';
import StockComponent from '../components/Stock';

export default function Stock() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Stock Management</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your inventory, add new items, and track stock levels.
          </p>
        </div>
        <StockComponent />
      </div>
    </div>
  );
}
