import React, { useState, useEffect } from 'react';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Breadcrumb from './Breadcrumb';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { supabase } from '../supabaseClient';
import * as XLSX from 'xlsx';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const SalesAnalytics = () => {
  const navigate = useNavigate();
  const { user, isBoss } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [salesData, setSalesData] = useState([]);
  const [timeRange, setTimeRange] = useState('7');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [drilldownData, setDrilldownData] = useState(null);
  const [inventoryData, setInventoryData] = useState([]);
  const [profitData, setProfitData] = useState([]);

  // Check user role access
  useEffect(() => {
    const checkAccess = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const isBossUser = await isBoss().catch(error => {
          console.error('Boss check failed:', error);
          throw new Error('Failed to verify boss access: ' + error.message);
        });

        if (!isBossUser) {
          console.error('Access denied: User is not a boss');
          setError('Access denied: Only boss users can view analytics');
          navigate('/dashboard');
          return;
        }

        console.log('Boss access verified, proceeding with analytics');
        setHasAccess(true);
        setError(null);
      } catch (error) {
        console.error('Access check error:', error);
        setError(error.message || 'Failed to verify access');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [isBoss, navigate]);

  // Fetch sales and inventory data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const startDate = startOfDay(subDays(new Date(), parseInt(timeRange)));
        const endDate = endOfDay(new Date());

        // First, fetch basic sales data
        const { data: salesData, error: salesError } = await supabase
          .from('sales')
          .select('id, created_at, total_amount, payment_method')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
          .order('created_at', { ascending: true });

        if (salesError) {
          console.error('Sales fetch error:', salesError);
          throw new Error('Failed to fetch sales data');
        }

        // Then fetch sales items with their related stock items
        const { data: salesItemsData, error: salesItemsError } = await supabase
          .from('sales_items')
          .select(`
            id,
            quantity,
            price,
            cost_price,
            sales_id,
            stock_items (
              id,
              name,
              quantity,
              reorder_level
            )
          `)
          .in('sales_id', salesData.map(sale => sale.id));

        if (salesItemsError) {
          console.error('Sales items fetch error:', salesItemsError);
          throw new Error('Failed to fetch sales items data');
        }

        // Combine the data
        const combinedSalesData = salesData.map(sale => ({
          ...sale,
          sales_items: salesItemsData.filter(item => item.sales_id === sale.id)
        }));

        setSalesData(combinedSalesData);

        // Fetch inventory data
        const { data: inventory, error: inventoryError } = await supabase
          .from('stock_items')
          .select('id, name, quantity, reorder_level');

        if (inventoryError) {
          console.error('Inventory fetch error:', inventoryError);
          throw new Error('Failed to fetch inventory data');
        }

        setInventoryData(inventory);

        // Calculate profit data
        const profitByItem = calculateProfitByItem(combinedSalesData);
        setProfitData(profitByItem);

        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  // Calculate profit by item
  const calculateProfitByItem = (sales) => {
    const profitMap = {};
    sales.forEach(sale => {
      sale.sales_items.forEach(item => {
        const profit = (item.price - item.cost_price) * item.quantity;
        const itemName = item.stock_items.name;
        profitMap[itemName] = (profitMap[itemName] || 0) + profit;
      });
    });
    return profitMap;
  };

  // Calculate inventory turnover
  const getInventoryTurnoverData = () => {
    const turnoverData = {};
    inventoryData.forEach(item => {
      const soldQuantity = salesData.reduce((total, sale) => {
        const saleItem = sale.sales_items.find(si => si.stock_items.name === item.name);
        return total + (saleItem ? saleItem.quantity : 0);
      }, 0);
      const turnover = soldQuantity / (item.quantity || 1);
      turnoverData[item.name] = turnover;
    });

    return {
      labels: Object.keys(turnoverData),
      datasets: [{
        label: 'Inventory Turnover Ratio',
        data: Object.values(turnoverData),
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      }]
    };
  };

  // Get profit margin data
  const getProfitMarginData = () => {
    return {
      labels: Object.keys(profitData),
      datasets: [{
        label: 'Profit Margin (KES)',
        data: Object.values(profitData),
        backgroundColor: 'rgba(153, 102, 255, 0.5)',
      }]
    };
  };

  // Get low stock alerts
  const getLowStockData = () => {
    const lowStockItems = inventoryData.filter(item => 
      item.quantity <= item.reorder_level
    );

    return {
      labels: lowStockItems.map(item => item.name),
      datasets: [{
        data: lowStockItems.map(item => item.quantity),
        backgroundColor: lowStockItems.map(item => 
          item.quantity === 0 ? 'rgba(255, 99, 132, 0.5)' : 'rgba(255, 206, 86, 0.5)'
        ),
      }]
    };
  };

  // Export data to Excel
  const exportToExcel = () => {
    // Prepare data for export
    const exportData = salesData.map(sale => ({
      'Date': format(new Date(sale.created_at), 'yyyy-MM-dd'),
      'Total Amount': sale.total_amount,
      'Payment Method': sale.payment_method,
      'Items': sale.sales_items.map(item => 
        `${item.stock_items.name} (${item.quantity})`
      ).join(', '),
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales Data');

    // Save file
    XLSX.writeFile(wb, `sales_report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  // Handle item click for drill-down
  const handleItemClick = async (itemName) => {
    if (!itemName) return;

    try {
      const startDate = startOfDay(subDays(new Date(), parseInt(timeRange)));
      const { data, error } = await supabase
        .from('sales_items')
        .select(`
          quantity,
          price,
          sales (
            created_at,
            payment_method
          )
        `)
        .eq('stock_items.name', itemName)
        .gte('sales.created_at', startDate.toISOString());

      if (error) throw error;

      setSelectedItem(itemName);
      setDrilldownData(data);
    } catch (err) {
      console.error('Error fetching drill-down data:', err);
    }
  };

  // Prepare data for Sales Timeline Chart
  const getSalesTimelineData = () => {
    const dailySales = {};
    salesData.forEach(sale => {
      const date = format(new Date(sale.created_at), 'yyyy-MM-dd');
      dailySales[date] = (dailySales[date] || 0) + sale.total_amount;
    });

    return {
      labels: Object.keys(dailySales),
      datasets: [{
        label: 'Daily Sales (KES)',
        data: Object.values(dailySales),
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }]
    };
  };

  // Prepare data for Top Items Chart
  const getTopItemsData = () => {
    const itemSales = {};
    salesData.forEach(sale => {
      sale.sales_items.forEach(item => {
        const itemName = item.stock_items.name;
        const itemTotal = item.quantity * item.price;
        itemSales[itemName] = (itemSales[itemName] || 0) + itemTotal;
      });
    });

    return {
      labels: Object.keys(itemSales),
      datasets: [{
        label: 'Item Sales (KES)',
        data: Object.values(itemSales),
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
        ],
      }]
    };
  };

  // Prepare data for Payment Methods Chart
  const getPaymentMethodsData = () => {
    const paymentMethods = {};
    salesData.forEach(sale => {
      paymentMethods[sale.payment_method] = (paymentMethods[sale.payment_method] || 0) + sale.total_amount;
    });

    return {
      labels: Object.keys(paymentMethods),
      datasets: [{
        data: Object.values(paymentMethods),
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
        ],
      }]
    };
  };

  if (!hasAccess) return null;
  if (loading) return <div className="flex justify-center items-center h-64">Loading analytics...</div>;
  if (error) return <div className="text-red-500 text-center">{error}</div>;

  return (
    <div className="p-4 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb />

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="w-full sm:w-auto">
          <label className="block text-sm font-medium text-gray-700 mb-1 sm:hidden">
            Time Range
          </label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="w-full sm:w-auto border rounded p-2"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
          </select>
        </div>

        <button
          onClick={exportToExcel}
          className="w-full sm:w-auto bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export to Excel
        </button>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sales Timeline Chart */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Sales Timeline</h3>
          <div className="h-[300px] sm:h-[400px]">
            <Line
              data={getSalesTimelineData()}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'top' },
                  title: { display: true, text: 'Daily Sales Overview' }
                }
              }}
            />
          </div>
        </div>

        {/* Top Items Chart */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Top Selling Items</h3>
          <div className="h-[300px] sm:h-[400px]">
            <Bar
              data={getTopItemsData()}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'top' },
                  title: { display: true, text: 'Sales by Item' }
                },
                onClick: (_, elements) => {
                  if (elements.length > 0) {
                    const itemName = getTopItemsData().labels[elements[0].index];
                    handleItemClick(itemName);
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Inventory Turnover Chart */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Inventory Turnover</h3>
          <div className="h-[300px] sm:h-[400px]">
            <Bar
              data={getInventoryTurnoverData()}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'top' },
                  title: { display: true, text: 'Inventory Turnover Ratio' }
                }
              }}
            />
          </div>
        </div>

        {/* Profit Margins Chart */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Profit Margins</h3>
          <div className="h-[300px] sm:h-[400px]">
            <Bar
              data={getProfitMarginData()}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'top' },
                  title: { display: true, text: 'Profit Margins by Item' }
                }
              }}
            />
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Low Stock Alert</h3>
          <div className="h-[300px] sm:h-[400px]">
            <Doughnut
              data={getLowStockData()}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'top' },
                  title: { display: true, text: 'Items Needing Restock' }
                }
              }}
            />
          </div>
        </div>

        {/* Payment Methods Chart */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Payment Methods</h3>
          <div className="h-[300px] sm:h-[400px]">
            <Pie
              data={getPaymentMethodsData()}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'top' },
                  title: { display: true, text: 'Payment Distribution' }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Drill-down View */}
      {selectedItem && drilldownData && (
        <div className="bg-white p-4 rounded-lg shadow mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Detailed Analysis: {selectedItem}</h3>
            <button
              onClick={() => setSelectedItem(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded">
              <h4 className="font-medium mb-2">Total Sales</h4>
              <p className="text-xl sm:text-2xl font-bold break-words">
                {drilldownData.reduce((sum, item) => sum + (item.quantity * item.price), 0).toLocaleString('en-KE', {
                  style: 'currency',
                  currency: 'KES'
                })}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded">
              <h4 className="font-medium mb-2">Units Sold</h4>
              <p className="text-xl sm:text-2xl font-bold">
                {drilldownData.reduce((sum, item) => sum + item.quantity, 0)}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded">
              <h4 className="font-medium mb-2">Average Price</h4>
              <p className="text-xl sm:text-2xl font-bold break-words">
                {(drilldownData.reduce((sum, item) => sum + item.price, 0) / drilldownData.length).toLocaleString('en-KE', {
                  style: 'currency',
                  currency: 'KES'
                })}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesAnalytics;
