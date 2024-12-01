import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import supabase from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { 
  CurrencyDollarIcon, 
  ShoppingBagIcon, 
  ExclamationIcon,
  PlusIcon,
  DocumentReportIcon,
  TrendingUpIcon,
  UserGroupIcon,
  ArrowRightIcon,
  CubeIcon
} from '@heroicons/react/solid';

// Beautiful gradient backgrounds for cards
const gradients = {
  blue: 'from-blue-500 to-blue-600',
  green: 'from-green-500 to-green-600',
  yellow: 'from-yellow-500 to-yellow-600',
  purple: 'from-purple-500 to-purple-600',
  red: 'from-red-500 to-red-600'
};

const StatCard = ({ title, value, icon: Icon, trend, gradient, subtitle }) => (
  <div className={`rounded-xl shadow-lg overflow-hidden bg-gradient-to-br ${gradient} hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
    <div className="px-6 py-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-75">{title}</p>
          <h3 className="mt-2 text-3xl font-bold">{value}</h3>
          {subtitle && (
            <p className="text-sm mt-1 opacity-75">{subtitle}</p>
          )}
        </div>
        <div className="p-3 bg-white bg-opacity-30 rounded-lg">
          <Icon className="h-8 w-8 text-white" />
        </div>
      </div>
      {trend !== undefined && (
        <div className="mt-4 flex items-center text-sm">
          <TrendingUpIcon className={`h-4 w-4 ${trend >= 0 ? 'rotate-0' : 'rotate-180'} mr-1`} />
          <span>{Math.abs(trend)}% {trend >= 0 ? 'increase' : 'decrease'}</span>
        </div>
      )}
    </div>
  </div>
);

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

const QuickActionButton = ({ to, icon: Icon, label, gradient }) => (
  <Link
    to={to}
    className={`flex items-center px-6 py-4 rounded-xl shadow-md bg-gradient-to-br ${gradient} text-white hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1`}
  >
    <Icon className="h-6 w-6 mr-3" />
    <span className="font-medium">{label}</span>
  </Link>
);

const BossDashboard = () => {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    lowStockItems: 0,
    associates: 0,
    recentSales: []
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (!user?.id || !userProfile?.business_id) return;

        // Fetch total sales
        const { data: salesData, error: salesError } = await supabase
          .from('sales')
          .select('total_amount')
          .eq('business_id', userProfile.business_id);

        if (salesError) throw salesError;

        // Fetch low stock items
        const { data: stockData, error: stockError } = await supabase
          .from('stock_items')
          .select('*')
          .eq('business_id', userProfile.business_id)
          .lt('quantity', 10);

        if (stockError) throw stockError;

        // Fetch associates
        const { data: associatesData, error: associatesError } = await supabase
          .from('profiles')
          .select('*')
          .eq('business_id', userProfile.business_id)
          .eq('role', 'associate');

        if (associatesError) throw associatesError;

        // Fetch recent sales
        const { data: recentSalesData, error: recentSalesError } = await supabase
          .from('sales')
          .select(`
            id,
            total_amount,
            created_at,
            seller:seller_id (
              full_name
            )
          `)
          .eq('business_id', userProfile.business_id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (recentSalesError) throw recentSalesError;

        // Calculate total revenue
        const totalRevenue = salesData?.reduce((sum, sale) => sum + (parseFloat(sale.total_amount) || 0), 0) || 0;

        setStats({
          totalSales: salesData?.length || 0,
          totalRevenue,
          lowStockItems: stockData?.length || 0,
          associates: associatesData?.length || 0,
          recentSales: recentSalesData || []
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.id, userProfile?.business_id]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 min-h-screen">
      {/* Welcome Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              Welcome back, {userProfile?.full_name || 'Owner'}
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Here's what's happening with your business today
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionButton
            to="/sales/new"
            icon={PlusIcon}
            label="New Sale"
            gradient={gradients.blue}
          />
          <QuickActionButton
            to="/stock"
            icon={CubeIcon}
            label="Manage Stock"
            gradient={gradients.green}
          />
          <QuickActionButton
            to="/reports"
            icon={DocumentReportIcon}
            label="View Reports"
            gradient={gradients.purple}
          />
          <QuickActionButton
            to="/associate-registration"
            icon={UserGroupIcon}
            label="Add Associate"
            gradient={gradients.yellow}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Business Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Sales"
            value={stats.totalSales}
            icon={ShoppingBagIcon}
            gradient={gradients.blue}
          />
          <StatCard
            title="Revenue"
            value={`$${stats.totalRevenue.toFixed(2)}`}
            icon={CurrencyDollarIcon}
            gradient={gradients.green}
          />
          <StatCard
            title="Low Stock Items"
            value={stats.lowStockItems}
            icon={ExclamationIcon}
            gradient={gradients.red}
          />
          <StatCard
            title="Associates"
            value={stats.associates}
            icon={UserGroupIcon}
            gradient={gradients.purple}
          />
        </div>
      </div>

      {/* Recent Sales */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-blue-600">
          <h2 className="text-lg font-medium text-white">Recent Sales</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {stats.recentSales.length > 0 ? (
            stats.recentSales.map((sale) => (
              <div key={sale.id} className="px-6 py-4 hover:bg-gray-50 transition-colors duration-150">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Sale #{sale.id.slice(-6)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(sale.created_at).toLocaleDateString()} at {' '}
                      {new Date(sale.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      ${Number(sale.total_amount).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center text-gray-500">
              <ShoppingBagIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No recent sales</p>
            </div>
          )}
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <Link
            to="/sales"
            className="text-sm font-medium text-blue-600 hover:text-blue-500 flex items-center justify-center"
          >
            View all sales
            <ArrowRightIcon className="h-5 w-5 ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BossDashboard;
