import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { format } from 'date-fns';

const SalesList = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [duration, setDuration] = useState('daily');
  const [dateRange, setDateRange] = useState({ start: null, end: null });

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
      case 'quarterly':
        start.setMonth(start.getMonth() - 3);
        break;
      case 'semiannually':
        start.setMonth(start.getMonth() - 6);
        break;
      case 'annually':
        start.setFullYear(start.getFullYear() - 1);
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
      setDateRange({ start, end });

      // Get user's SME ID
      const { data: { user } } = await supabase.auth.getUser();
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('sme_id')
        .eq('user_id', user.id)
        .single();

      // Fetch sales with items
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select(`
          *,
          sales_items (
            *,
            stock_items (
              name
            )
          )
        `)
        .eq('sme_id', userProfile.sme_id)
        .gte('sale_date', start.toISOString())
        .lte('sale_date', end.toISOString())
        .order('sale_date', { ascending: false });

      if (salesError) throw salesError;
      setSales(salesData);
    } catch (err) {
      console.error('Error fetching sales:', err);
      setError('Failed to load sales data');
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
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Sales History</h2>
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">
            Duration:
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="ml-2 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="semiannually">Semi-Annually</option>
              <option value="annually">Annually</option>
            </select>
          </label>
        </div>
      </div>

      {dateRange.start && dateRange.end && (
        <p className="text-sm text-gray-500 mb-4">
          Showing sales from {format(dateRange.start, 'PPP')} to {format(dateRange.end, 'PPP')}
        </p>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading sales data...</p>
        </div>
      ) : sales.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No sales found for the selected period</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(sale.sale_date), 'PPp')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {sale.customer_name || 'Walk-in Customer'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <ul className="list-disc list-inside">
                      {sale.sales_items.map((item) => (
                        <li key={item.id}>
                          {item.stock_items.name} x {item.quantity} @ {formatCurrency(item.unit_price)}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {sale.payment_method.replace('_', ' ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(sale.total_amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SalesList;
