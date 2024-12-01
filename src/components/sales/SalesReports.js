import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';

const SalesReports = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('daily'); // daily, weekly, monthly
  const navigate = useNavigate();
  const location = useLocation();
  const business = location.state?.business;

  useEffect(() => {
    if (!business) {
      toast.error('No business selected');
      navigate('/dashboard/boss');
      return;
    }
    generateReport();
  }, [business, reportType]);

  const generateReport = async () => {
    try {
      setLoading(true);
      const now = new Date();
      let startDate, endDate;

      // Set date range based on report type
      if (reportType === 'daily') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      } else if (reportType === 'weekly') {
        startDate = startOfWeek(now);
        endDate = endOfWeek(now);
      } else if (reportType === 'monthly') {
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
      }

      // Fetch sales data
      const { data: sales, error } = await supabase
        .from('sales')
        .select('*')
        .eq('business_id', business.id)
        .gte('created_at', startDate.toISOString())
        .lt('created_at', endDate.toISOString());

      if (error) throw error;

      // Calculate report metrics
      const totalSales = sales.length;
      const totalRevenue = sales.reduce((sum, sale) => sum + sale.total_amount, 0);
      const paymentMethods = sales.reduce((acc, sale) => {
        acc[sale.payment_method] = (acc[sale.payment_method] || 0) + 1;
        return acc;
      }, {});

      // Get top selling items
      const itemSales = sales.reduce((acc, sale) => {
        sale.items.forEach(item => {
          acc[item.name] = (acc[item.name] || 0) + item.quantity;
        });
        return acc;
      }, {});

      const topItems = Object.entries(itemSales)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

      setReportData({
        totalSales,
        totalRevenue,
        paymentMethods,
        topItems,
        dateRange: {
          start: startDate,
          end: endDate
        }
      });
    } catch (error) {
      toast.error('Error generating report');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!business) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Sales Reports</h2>
        <button
          onClick={() => navigate('/sales', { state: { business } })}
          className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg shadow transition-colors duration-200"
        >
          Back to Sales
        </button>
      </div>

      {/* Report Type Selector */}
      <div className="mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setReportType('daily')}
            className={\`px-4 py-2 rounded-lg \${
              reportType === 'daily'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }\`}
          >
            Daily Report
          </button>
          <button
            onClick={() => setReportType('weekly')}
            className={\`px-4 py-2 rounded-lg \${
              reportType === 'weekly'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }\`}
          >
            Weekly Report
          </button>
          <button
            onClick={() => setReportType('monthly')}
            className={\`px-4 py-2 rounded-lg \${
              reportType === 'monthly'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }\`}
          >
            Monthly Report
          </button>
        </div>
      </div>

      {/* Report Content */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Generating report...</p>
        </div>
      ) : reportData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Summary Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Summary</h3>
            <p className="text-sm text-gray-600 mb-4">
              {format(reportData.dateRange.start, 'MMM d, yyyy')} -{' '}
              {format(reportData.dateRange.end, 'MMM d, yyyy')}
            </p>
            <div className="space-y-4">
              <div>
                <p className="text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold">{reportData.totalSales}</p>
              </div>
              <div>
                <p className="text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">KES {reportData.totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Payment Methods Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Payment Methods</h3>
            <div className="space-y-4">
              {Object.entries(reportData.paymentMethods).map(([method, count]) => (
                <div key={method} className="flex justify-between items-center">
                  <span className="text-gray-600 capitalize">{method}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Selling Items */}
          <div className="bg-white rounded-lg shadow-md p-6 md:col-span-2">
            <h3 className="text-lg font-semibold mb-4">Top Selling Items</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reportData.topItems.map(([item, quantity]) => (
                <div key={item} className="bg-gray-50 rounded-lg p-4">
                  <p className="font-medium">{item}</p>
                  <p className="text-gray-600">Quantity: {quantity}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">No data available</div>
      )}
    </div>
  );
};

export default SalesReports;
