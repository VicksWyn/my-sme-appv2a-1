import React, { useState, useEffect } from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale
} from 'chart.js';
import { supabase } from '../supabaseClient';
import { 
  startOfWeek, endOfWeek, startOfMonth, endOfMonth, 
  startOfQuarter, endOfQuarter, startOfYear, endOfYear, 
  subMonths, format, parse, eachMonthOfInterval 
} from 'date-fns';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale);

const Analytics = () => {
  const [userProfile, setUserProfile] = useState(null);
  const [timeframe, setTimeframe] = useState('weekly');
  const [salesData, setSalesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState('');
  const [availableItems, setAvailableItems] = useState([]);
  const [monthlyItemData, setMonthlyItemData] = useState(null);

  // Generate random colors for chart
  const generateColors = (count) => {
    const colors = [];
    for (let i = 0; i < count; i++) {
      colors.push(`hsl(${(i * 360) / count}, 70%, 50%)`);
    }
    return colors;
  };

  const getDateRange = () => {
    const now = new Date();
    switch (timeframe) {
      case 'weekly':
        return { start: startOfWeek(now), end: endOfWeek(now) };
      case 'monthly':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'quarterly':
        return { start: startOfQuarter(now), end: endOfQuarter(now) };
      case 'semiannual':
        return { start: startOfYear(subMonths(now, 6)), end: now };
      case 'annual':
        return { start: startOfYear(now), end: endOfYear(now) };
      default:
        return { start: startOfWeek(now), end: endOfWeek(now) };
    }
  };

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;
      setUserProfile(profile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError(error.message);
    }
  };

  const fetchAvailableItems = async () => {
    if (!userProfile) return;
    
    try {
      const { data: items, error } = await supabase
        .from('stock_items')
        .select('id, name')
        .eq('sme_id', userProfile.id);

      if (error) throw error;
      setAvailableItems(items);
    } catch (error) {
      console.error('Error fetching items:', error);
      setError(error.message);
    }
  };

  const fetchMonthlyItemData = async () => {
    if (!userProfile || !selectedItem) return;

    try {
      setLoading(true);
      const yearStart = startOfYear(new Date());
      const yearEnd = endOfYear(new Date());

      const { data: salesItems, error: salesError } = await supabase
        .from('sales_items')
        .select(`
          quantity,
          price,
          sales!inner (
            created_at,
            sme_id
          )
        `)
        .eq('sales.sme_id', userProfile.id)
        .eq('stock_item_id', selectedItem)
        .gte('sales.created_at', yearStart.toISOString())
        .lte('sales.created_at', yearEnd.toISOString());

      if (salesError) throw salesError;

      // Get all months in the year
      const months = eachMonthOfInterval({
        start: yearStart,
        end: yearEnd
      });

      // Initialize monthly data
      const monthlyData = months.reduce((acc, month) => {
        const monthName = format(month, 'MMMM');
        acc[monthName] = {
          quantity: 0,
          revenue: 0
        };
        return acc;
      }, {});

      // Aggregate sales data by month
      salesItems.forEach(item => {
        const monthName = format(new Date(item.sales.created_at), 'MMMM');
        monthlyData[monthName].quantity += item.quantity;
        monthlyData[monthName].revenue += item.quantity * item.price;
      });

      const labels = Object.keys(monthlyData);
      const quantities = labels.map(month => monthlyData[month].quantity);
      const revenues = labels.map(month => monthlyData[month].revenue);
      const backgroundColor = generateColors(12);

      setMonthlyItemData({
        quantity: {
          labels,
          datasets: [{
            data: quantities,
            backgroundColor,
            borderWidth: 1
          }]
        },
        revenue: {
          labels,
          datasets: [{
            data: revenues,
            backgroundColor,
            borderWidth: 1
          }]
        }
      });
    } catch (error) {
      console.error('Error fetching monthly item data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      if (!userProfile) return;

      const { start, end } = getDateRange();

      // Fetch sales items with their names and quantities
      const { data: salesItems, error: salesError } = await supabase
        .from('sales_items')
        .select(`
          quantity,
          price,
          stock_items (
            name
          ),
          sales!inner (
            created_at,
            sme_id
          )
        `)
        .eq('sales.sme_id', userProfile.id)
        .gte('sales.created_at', start.toISOString())
        .lte('sales.created_at', end.toISOString());

      if (salesError) throw salesError;

      // Aggregate data by item
      const itemPerformance = salesItems.reduce((acc, item) => {
        const itemName = item.stock_items.name;
        if (!acc[itemName]) {
          acc[itemName] = {
            quantity: 0,
            revenue: 0
          };
        }
        acc[itemName].quantity += item.quantity;
        acc[itemName].revenue += item.quantity * item.price;
        return acc;
      }, {});

      // Prepare chart data
      const labels = Object.keys(itemPerformance);
      const quantities = labels.map(label => itemPerformance[label].quantity);
      const revenues = labels.map(label => itemPerformance[label].revenue);
      const backgroundColor = generateColors(labels.length);

      setSalesData({
        quantity: {
          labels,
          datasets: [{
            data: quantities,
            backgroundColor,
            borderWidth: 1
          }]
        },
        revenue: {
          labels,
          datasets: [{
            data: revenues,
            backgroundColor,
            borderWidth: 1
          }]
        }
      });
    } catch (error) {
      console.error('Error fetching sales data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (userProfile) {
      fetchSalesData();
      fetchAvailableItems();
    }
  }, [userProfile, timeframe]);

  useEffect(() => {
    if (selectedItem) {
      fetchMonthlyItemData();
    }
  }, [selectedItem]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.raw;
            return context.dataset.label === 'Revenue' 
              ? `${label}: $${value.toFixed(2)}`
              : `${label}: ${value}`;
          }
        }
      }
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-4">Sales Analytics</h2>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="w-48 p-2 border border-gray-300 rounded-md"
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="semiannual">Semi-Annual</option>
            <option value="annual">Annual</option>
          </select>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4">Monthly Item Analysis</h2>
          <select
            value={selectedItem}
            onChange={(e) => setSelectedItem(e.target.value)}
            className="w-48 p-2 border border-gray-300 rounded-md"
          >
            <option value="">Select an item</option>
            {availableItems.map(item => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </div>
      </div>

      {salesData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">Items by Quantity</h3>
            <Pie data={salesData.quantity} options={chartOptions} />
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">Items by Revenue</h3>
            <Pie data={salesData.revenue} options={chartOptions} />
          </div>
        </div>
      )}

      {monthlyItemData && selectedItem && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">Monthly Quantity Distribution</h3>
            <Pie data={monthlyItemData.quantity} options={chartOptions} />
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">Monthly Revenue Distribution</h3>
            <Pie data={monthlyItemData.revenue} options={chartOptions} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
