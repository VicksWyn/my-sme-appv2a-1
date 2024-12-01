import React, { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const BossDashboard = () => {
  const [stats, setStats] = useState({
    totalSales: 0,
    todaySales: 0,
    totalStock: 0,
    activeAssociates: 0
  });
  const [recentSales, setRecentSales] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const supabase = useSupabaseClient();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [business, setBusiness] = useState(location.state?.business);

  useEffect(() => {
    const fetchBusiness = async () => {
      if (!business && user) {
        try {
          const { data, error } = await supabase
            .from('businesses')
            .select('*')
            .eq('owner_id', user.id)
            .single();

          if (error) throw error;
          setBusiness(data);
        } catch (error) {
          toast.error('Error fetching business data');
          navigate('/login');
        }
      }
    };

    fetchBusiness();
  }, [user, business, supabase, navigate]);

  useEffect(() => {
    if (!business) {
      navigate('/login');
      return;
    }
    const fetchDashboardData = async () => {
      try {
        // Fetch total sales
        const { data: salesData, error: salesError } = await supabase
          .from('sales')
          .select('total_amount')
          .eq('business_id', business.id);

        if (salesError) throw salesError;

        // Fetch today's sales
        const today = new Date().toISOString().split('T')[0];
        const { data: todaySalesData, error: todaySalesError } = await supabase
          .from('sales')
          .select('total_amount')
          .eq('business_id', business.id)
          .gte('created_at', today);

        if (todaySalesError) throw todaySalesError;

        // Fetch stock count
        const { count: stockCount, error: stockError } = await supabase
          .from('stock')
          .select('*', { count: 'exact' })
          .eq('business_id', business.id);

        if (stockError) throw stockError;

        // Fetch active associates count
        const { count: associateCount, error: associateError } = await supabase
          .from('business_associates')
          .select('*', { count: 'exact' })
          .eq('business_id', business.id)
          .eq('status', 'active');

        if (associateError) throw associateError;

        // Fetch recent sales
        const { data: recent, error: recentError } = await supabase
          .from('sales')
          .select(`
            id,
            total_amount,
            created_at,
            associate:profiles(full_name)
          `)
          .eq('business_id', business.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (recentError) throw recentError;

        // Fetch low stock items
        const { data: lowStockItems, error: lowStockError } = await supabase
          .from('stock')
          .select('*')
          .eq('business_id', business.id)
          .lt('quantity', 10)
          .order('quantity')
          .limit(5);

        if (lowStockError) throw lowStockError;

        // Update state
        setStats({
          totalSales: salesData.reduce((sum, sale) => sum + sale.total_amount, 0),
          todaySales: todaySalesData.reduce((sum, sale) => sum + sale.total_amount, 0),
          totalStock: stockCount,
          activeAssociates: associateCount
        });
        setRecentSales(recent);
        setLowStock(lowStockItems);

      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [business, supabase]);

  const handleQuickAction = (action) => {
    if (!business) {
      toast.error('Please select a business first');
      return;
    }

    switch (action) {
      case 'record-sale':
        navigate('/sales/record', { state: { business } });
        break;
      case 'add-product':
        navigate('/stock', { state: { openAddForm: true, business } });
        break;
      case 'manage-stock':
        navigate('/stock', { state: { business } });
        break;
      case 'view-reports':
        navigate('/sales/reports', { state: { business } });
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-red-600">Error loading dashboard: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">
              {business ? `${business.name} Dashboard` : 'Dashboard'}
            </h1>
          </div>
          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div 
                onClick={() => handleQuickAction('record-sale')}
                className="bg-white p-6 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
              >
                <h3 className="text-lg font-semibold mb-2">Record Sale</h3>
                <p className="text-gray-600">Record a new sale transaction</p>
              </div>

              <div 
                onClick={() => handleQuickAction('add-product')}
                className="bg-white p-6 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
              >
                <h3 className="text-lg font-semibold mb-2">Add Product</h3>
                <p className="text-gray-600">Add a new product to inventory</p>
              </div>

              <div 
                onClick={() => handleQuickAction('manage-stock')}
                className="bg-white p-6 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
              >
                <h3 className="text-lg font-semibold mb-2">Manage Stock</h3>
                <p className="text-gray-600">View and manage inventory</p>
              </div>

              <div 
                onClick={() => handleQuickAction('view-reports')}
                className="bg-white p-6 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
              >
                <h3 className="text-lg font-semibold mb-2">View Reports</h3>
                <p className="text-gray-600">Access sales and inventory reports</p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Sales Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Sales</dt>
                      <dd className="text-lg font-medium text-gray-900">${stats.totalSales.toFixed(2)}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Today's Sales Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Today's Sales</dt>
                      <dd className="text-lg font-medium text-gray-900">${stats.todaySales.toFixed(2)}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Stock Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Stock Items</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.totalStock}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Associates Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Active Associates</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.activeAssociates}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Sales and Low Stock Grid */}
          <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* Recent Sales */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Sales</h3>
                <div className="mt-5">
                  <div className="flow-root">
                    <ul className="-my-4 divide-y divide-gray-200">
                      {recentSales.map((sale) => (
                        <li key={sale.id} className="py-4">
                          <div className="flex items-center space-x-4">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                Sale #{sale.id}
                              </p>
                              <p className="text-sm text-gray-500">
                                By {sale.associate.full_name}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                ${sale.total_amount.toFixed(2)}
                              </p>
                              <p className="text-sm text-gray-500">
                                {new Date(sale.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Low Stock Alert */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Low Stock Alert</h3>
                <div className="mt-5">
                  <div className="flow-root">
                    <ul className="-my-4 divide-y divide-gray-200">
                      {lowStock.map((item) => (
                        <li key={item.id} className="py-4">
                          <div className="flex items-center space-x-4">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {item.name}
                              </p>
                              <p className="text-sm text-gray-500">
                                SKU: {item.sku}
                              </p>
                            </div>
                            <div>
                              <p className={`text-sm font-medium ${
                                item.quantity <= 5 ? 'text-red-600' : 'text-yellow-600'
                              }`}>
                                {item.quantity} units left
                              </p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BossDashboard;
