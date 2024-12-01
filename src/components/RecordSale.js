import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'mpesa', label: 'M-Pesa' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'credit', label: 'Credit' }
];

const RecordSale = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const business = location.state?.business;

  // Redirect if no business data
  useEffect(() => {
    if (!business) {
      toast.error('No business selected');
      navigate('/dashboard/boss');
    }
  }, [business, navigate]);

  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    stock_item_id: '',
    quantity: '',
    unit_price: '',
    customer_name: '',
    payment_method: 'cash',
    notes: ''
  });

  useEffect(() => {
    if (business) {
      fetchStockItems();
    }
  }, [business]);

  const fetchStockItems = async () => {
    try {
      const { data, error } = await supabase
        .from('stock_items')
        .select('id, name, description, quantity, unit_price')
        .eq('business_id', business.id)
        .gt('quantity', 0)
        .order('name');

      if (error) throw error;
      setStockItems(data);
    } catch (error) {
      toast.error('Error fetching stock items: ' + error.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Auto-calculate total if we have both quantity and unit price
      if ((name === 'quantity' || name === 'unit_price') && newData.quantity && newData.unit_price) {
        const total = parseFloat(newData.quantity) * parseFloat(newData.unit_price);
        newData.total_amount = total.toFixed(2);
      }

      // If stock item changed, update unit price
      if (name === 'stock_item_id') {
        const selectedItem = stockItems.find(item => item.id === value);
        if (selectedItem) {
          newData.unit_price = selectedItem.unit_price;
          if (newData.quantity) {
            newData.total_amount = (selectedItem.unit_price * parseFloat(newData.quantity)).toFixed(2);
          }
        }
      }

      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate quantity
      const selectedItem = stockItems.find(item => item.id === formData.stock_item_id);
      if (!selectedItem) {
        throw new Error('Please select a stock item');
      }
      if (parseFloat(formData.quantity) > selectedItem.quantity) {
        throw new Error('Insufficient stock quantity');
      }

      const saleData = {
        stock_item_id: formData.stock_item_id,
        quantity: parseFloat(formData.quantity),
        unit_price: parseFloat(formData.unit_price),
        total_amount: parseFloat(formData.quantity) * parseFloat(formData.unit_price),
        customer_name: formData.customer_name,
        payment_method: formData.payment_method,
        notes: formData.notes,
        created_by: user.id,
        sale_date: new Date().toISOString()
      };

      const { error } = await supabase
        .from('sales')
        .insert([saleData]);

      if (error) throw error;

      toast.success('Sale recorded successfully');
      
      // Reset form
      setFormData({
        stock_item_id: '',
        quantity: '',
        unit_price: '',
        customer_name: '',
        payment_method: 'cash',
        notes: ''
      });

      // Refresh stock items
      fetchStockItems();
    } catch (error) {
      toast.error('Error recording sale: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Record Sale</h2>
        <button
          onClick={() => navigate('/dashboard/boss', { state: { business } })}
          className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg shadow transition-colors duration-200"
        >
          Back to Dashboard
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="max-w-lg">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Stock Item *
          </label>
          <select
            name="stock_item_id"
            value={formData.stock_item_id}
            onChange={handleInputChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          >
            <option value="">Select an item</option>
            {stockItems.map(item => (
              <option key={item.id} value={item.id}>
                {item.name} - {item.description} (Available: {item.quantity})
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Quantity *
          </label>
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleInputChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
            min="0.01"
            step="0.01"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Unit Price *
          </label>
          <input
            type="number"
            name="unit_price"
            value={formData.unit_price}
            onChange={handleInputChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
            min="0.01"
            step="0.01"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Total Amount
          </label>
          <input
            type="number"
            value={formData.total_amount || ''}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-100"
            disabled
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Customer Name
          </label>
          <input
            type="text"
            name="customer_name"
            value={formData.customer_name}
            onChange={handleInputChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Payment Method *
          </label>
          <select
            name="payment_method"
            value={formData.payment_method}
            onChange={handleInputChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          >
            {PAYMENT_METHODS.map(method => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            rows="3"
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={loading}
            className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Recording Sale...' : 'Record Sale'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RecordSale;
