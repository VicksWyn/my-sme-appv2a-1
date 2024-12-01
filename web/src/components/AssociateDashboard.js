import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import supabase from '../lib/supabase';

const ActionCard = ({ title, description, to, icon }) => (
  <Link
    to={to}
    className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
  >
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      <div className="text-blue-500">{icon}</div>
    </div>
    <p className="text-sm text-gray-600">{description}</p>
  </Link>
);

const SalesMetric = ({ title, value, icon }) => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
      </div>
      <div className="text-blue-500">{icon}</div>
    </div>
  </div>
);

const AssociateDashboard = () => {
  const { userProfile } = useAuth();
  const [metrics, setMetrics] = useState({
    todaySales: 0,
    totalTransactions: 0
  });
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssociateData = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        const [salesData, recentSalesData] = await Promise.all([
          // Fetch today's sales metrics
          supabase
            .from('sales')
            .select('amount_paid')
            .eq('recorded_by', userProfile.id)
            .eq('sale_date', today),

          // Fetch recent sales
          supabase
            .from('sales')
            .select(`
              id,
              amount_paid,
              quantity,
              payment_type,
              created_at,
              stock:stock_id (
                item_name
              )
            `)
            .eq('recorded_by', userProfile.id)
            .order('created_at', { ascending: false })
            .limit(5)
        ]);

        const todaySales = salesData.data?.reduce((sum, sale) => sum + sale.amount_paid, 0) || 0;
        const totalTransactions = salesData.data?.length || 0;

        setMetrics({
          todaySales,
          totalTransactions
        });

        setRecentSales(recentSalesData.data || []);
      } catch (error) {
        console.error('Error fetching associate data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userProfile?.id) {
      fetchAssociateData();
    }
  }, [userProfile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {userProfile?.full_name}</h1>
        <p className="mt-1 text-sm text-gray-600">Here's your sales activity for today.</p>
      </div>

      {/* Sales Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <SalesMetric
          title="Today's Sales"
          value={`$${metrics.todaySales.toFixed(2)}`}
          icon="💰"
        />
        <SalesMetric
          title="Total Transactions"
          value={metrics.totalTransactions}
          icon="🧾"
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ActionCard
            title="Record New Sale"
            description="Create a new sales record and generate receipt"
            to="/sales/new"
            icon="💵"
          />
          <ActionCard
            title="Check Stock"
            description="View current stock levels and availability"
            to="/stock"
            icon="📦"
          />
        </div>
      </div>

      {/* Recent Sales */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Sales</h2>
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentSales.map((sale) => (
                  <tr key={sale.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sale.stock.item_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sale.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${sale.amount_paid.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{sale.payment_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(sale.created_at).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
                {recentSales.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                      No recent sales found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssociateDashboard;
