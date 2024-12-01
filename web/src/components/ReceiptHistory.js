import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { format } from 'date-fns';

const ReceiptHistory = () => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    fetchReceipts();
  }, [dateFilter]);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      
      // Get user's SME ID
      const { data: { user } } = await supabase.auth.getUser();
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('sme_id')
        .eq('user_id', user.id)
        .single();

      let query = supabase
        .from('sales')
        .select(`
          *,
          sales_items (
            stock_items (
              name
            )
          )
        `)
        .eq('sme_id', userProfile.sme_id)
        .order('sale_date', { ascending: false });

      // Apply date filter
      const now = new Date();
      switch (dateFilter) {
        case 'today':
          query = query.gte('sale_date', new Date(now.setHours(0,0,0,0)).toISOString());
          break;
        case 'week':
          now.setDate(now.getDate() - 7);
          query = query.gte('sale_date', now.toISOString());
          break;
        case 'month':
          now.setMonth(now.getMonth() - 1);
          query = query.gte('sale_date', now.toISOString());
          break;
      }

      const { data, error: receiptsError } = await query;

      if (receiptsError) throw receiptsError;
      setReceipts(data);
    } catch (err) {
      console.error('Error fetching receipts:', err);
      setError('Failed to load receipts');
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

  const getItemsSummary = (items) => {
    if (!items || items.length === 0) return 'No items';
    if (items.length === 1) return items[0].stock_items.name;
    return `${items[0].stock_items.name} +${items.length - 1} more`;
  };

  const filteredReceipts = receipts.filter(receipt => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      receipt.customer_name?.toLowerCase().includes(searchLower) ||
      receipt.id.toLowerCase().includes(searchLower) ||
      receipt.payment_method.toLowerCase().includes(searchLower) ||
      receipt.sales_items.some(item => 
        item.stock_items.name.toLowerCase().includes(searchLower)
      )
    );
  });

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Receipt History</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search receipts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading receipts...</p>
        </div>
      ) : filteredReceipts.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No receipts found</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredReceipts.map((receipt) => (
            <Link
              key={receipt.id}
              to={`/receipt/${receipt.id}`}
              className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
            >
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium">
                      Receipt #{receipt.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(receipt.sale_date), 'PPp')}
                    </p>
                  </div>
                  <span className="text-lg font-semibold">
                    {formatCurrency(receipt.total_amount)}
                  </span>
                </div>
                
                <div className="text-sm">
                  <p>
                    <span className="text-gray-600">Customer:</span>{' '}
                    {receipt.customer_name || 'Walk-in Customer'}
                  </p>
                  <p>
                    <span className="text-gray-600">Items:</span>{' '}
                    {getItemsSummary(receipt.sales_items)}
                  </p>
                  <p>
                    <span className="text-gray-600">Payment:</span>{' '}
                    {receipt.payment_method.replace('_', ' ')}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReceiptHistory;
