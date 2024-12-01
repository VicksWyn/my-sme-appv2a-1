import React, { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useLocation } from 'react-router-dom';

const AssociateDashboard = () => {
  const [stats, setStats] = useState({
    todaySales: 0,
    weekSales: 0,
    totalSales: 0,
    completedSales: 0
  });
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const supabase = useSupabaseClient();
  const location = useLocation();
  const business = location.state?.business;

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        // Get date ranges
        const today = new Date();
        const startOfToday = new Date(today.setHours(0, 0, 0, 0)).toISOString();
        const startOfWeek = new Date(today.setDate(today.getDate() - 7)).toISOString();

        // Fetch today's sales
        const { data: todaySalesData, error: todaySalesError } = await supabase
          .from('sales')
          .select('total_amount')
          .eq('business_id', business.id)
          .eq('associate_id', user.id)
          .gte('created_at', startOfToday);

        if (todaySalesError) throw todaySalesError;

        // Fetch week's sales
        const { data: weekSalesData, error: weekSalesError } = await supabase
          .from('sales')
          .select('total_amount')
          .eq('business_id', business.id)
          .eq('associate_id', user.id)
          .gte('created_at', startOfWeek);

        if (weekSalesError) throw weekSalesError;

        // Fetch total sales
        const { data: totalSalesData, error: totalSalesError } = await supabase
          .from('sales')
          .select('total_amount')
          .eq('business_id', business.id)
          .eq('associate_id', user.id);

        if (totalSalesError) throw totalSalesError;

        // Fetch recent sales
        const { data: recent, error: recentError } = await supabase
          .from('sales')
          .select(`
            id,
            total_amount,
            created_at,
            items:sale_items(
              quantity,
              price,
              stock:stock(name)
            )
          `)
          .eq('business_id', business.id)
          .eq('associate_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (recentError) throw recentError;

        // Update state
        setStats({
          todaySales: todaySalesData.reduce((sum, sale) => sum + sale.total_amount, 0),
          weekSales: weekSalesData.reduce((sum, sale) => sum + sale.total_amount, 0),
          totalSales: totalSalesData.reduce((sum, sale) => sum + sale.total_amount, 0),
          completedSales: totalSalesData.length
        });
        setRecentSales(recent);

      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (business?.id) {
      fetchDashboardData();
    }
  }, [supabase, business]);

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
          <h1 className="text-2xl font-semibold text-gray-900">My Dashboard</h1>
          
          {/* Stats Grid */}
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Today's Sales */}
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
                      <dt className="text-sm font-medium text-gray-500 truncate">Today's Sales</dt>
                      <dd className="text-lg font-medium text-gray-900">${stats.todaySales.toFixed(2)}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Week's Sales */}
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
                      <dt className="text-sm font-medium text-gray-500 truncate">This Week's Sales</dt>
                      <dd className="text-lg font-medium text-gray-900">${stats.weekSales.toFixed(2)}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Sales */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
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

            {/* Completed Sales */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Completed Sales</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.completedSales}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Sales */}
          <div className="mt-8">
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
                                {sale.items.map(item => 
                                  `${item.stock.name} (${item.quantity})`
                                ).join(', ')}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssociateDashboard;
