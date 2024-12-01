import React, { useState, useEffect } from 'react';
import { default as supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Reports = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState({
    salesByDate: [],
    topProducts: [],
    totalRevenue: 0,
    totalSales: 0,
    averageOrderValue: 0,
  });
  const [dateRange, setDateRange] = useState('week'); // week, month, year
  const [reportType, setReportType] = useState('sales'); // sales, products

  useEffect(() => {
    fetchReportData();
  }, [dateRange, reportType]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      // Get user's SME ID
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      const now = new Date();
      let startDate;

      switch (dateRange) {
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'year':
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
      }

      // Fetch sales data
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select(`
          *,
          sales_items (
            *,
            stock_items (
              name,
              unit_price
            )
          )
        `)
        .eq('sme_id', userProfile.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (salesError) throw salesError;

      // Process sales data
      const salesByDate = {};
      const productSales = {};
      let totalRevenue = 0;

      salesData.forEach(sale => {
        // Group by date
        const date = new Date(sale.created_at).toLocaleDateString();
        salesByDate[date] = (salesByDate[date] || 0) + sale.total_amount;
        totalRevenue += sale.total_amount;

        // Group by product
        sale.sales_items.forEach(item => {
          const productName = item.stock_items.name;
          if (!productSales[productName]) {
            productSales[productName] = {
              quantity: 0,
              revenue: 0
            };
          }
          productSales[productName].quantity += item.quantity;
          productSales[productName].revenue += item.quantity * item.unit_price;
        });
      });

      // Sort and format top products
      const topProducts = Object.entries(productSales)
        .map(([name, data]) => ({
          name,
          ...data
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      setReportData({
        salesByDate: Object.entries(salesByDate).map(([date, amount]) => ({
          date,
          amount
        })),
        topProducts,
        totalRevenue,
        totalSales: salesData.length,
        averageOrderValue: salesData.length ? totalRevenue / salesData.length : 0
      });
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError('Failed to load report data');
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

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: reportType === 'sales' ? 'Sales Over Time' : 'Top Products by Revenue',
      },
    },
  };

  const getSalesChartData = () => ({
    labels: reportData.salesByDate.map(item => item.date),
    datasets: [
      {
        label: 'Sales',
        data: reportData.salesByDate.map(item => item.amount),
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
    ],
  });

  const getProductsChartData = () => ({
    labels: reportData.topProducts.map(product => product.name),
    datasets: [
      {
        label: 'Revenue',
        data: reportData.topProducts.map(product => product.revenue),
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
    ],
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Business Reports</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Total Revenue</h3>
            <p className="text-3xl font-bold text-primary-600">{formatCurrency(reportData.totalRevenue)}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Total Sales</h3>
            <p className="text-3xl font-bold text-primary-600">{reportData.totalSales}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Average Order Value</h3>
            <p className="text-3xl font-bold text-primary-600">{formatCurrency(reportData.averageOrderValue)}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="year">Last Year</option>
          </select>
          
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="sales">Sales Report</option>
            <option value="products">Products Report</option>
          </select>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <Bar 
          options={chartOptions} 
          data={reportType === 'sales' ? getSalesChartData() : getProductsChartData()} 
        />
      </div>

      {reportType === 'products' && (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Units Sold</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.topProducts.map((product, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(product.revenue)}
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

export default Reports;