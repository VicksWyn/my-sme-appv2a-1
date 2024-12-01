import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

export default function Sales() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [duration, setDuration] = useState('daily');

  useEffect(() => {
    fetchSales();
  }, [duration]);

  const calculateDateRange = () => {
    const end = new Date();
    let start = new Date();

    switch (duration) {
      case 'daily':
        start.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        start.setDate(start.getDate() - 7);
        break;
      case 'monthly':
        start.setMonth(start.getMonth() - 1);
        break;
      default:
        start.setHours(0, 0, 0, 0);
    }

    return { start, end };
  };

  const fetchSales = async () => {
    try {
      setLoading(true);
      const { start, end } = calculateDateRange();

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('business_id')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select(`
          *,
          sales_items (
            *,
            stock_item:stock_items (
              name,
              unit_of_measure
            )
          )
        `)
        .eq('business_id', profileData.business_id)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at', { ascending: false });

      if (salesError) throw salesError;
      setSales(salesData);
    } catch (error) {
      console.error('Error fetching sales:', error);
      toast.error('Failed to load sales data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sales History</h1>
            <p className="mt-2 text-sm text-gray-600">
              View and manage your sales records
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/sales/record')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Record New Sale
            </button>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="block w-40 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="daily">Today</option>
              <option value="weekly">Last 7 days</option>
              <option value="monthly">Last 30 days</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
        ) : sales.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <p className="text-gray-500">No sales found for the selected period</p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {sales.map((sale) => (
                <li key={sale.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <p className="text-sm font-medium text-indigo-600 truncate">
                          {sale.customer_name || 'Walk-in Customer'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(sale.created_at), 'PPp')}
                        </p>
                      </div>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {formatCurrency(sale.total_amount)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          {sale.payment_method}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <p>
                          {sale.sales_items.length} item{sale.sales_items.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="flex flex-wrap gap-2">
                        {sale.sales_items.map((item) => (
                          <span
                            key={item.id}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            {item.stock_item.name} ({item.quantity} {item.stock_item.unit_of_measure})
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
