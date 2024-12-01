import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
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
      navigate('/sales');
      return;
    }
    fetchStockItems();
  }, [business, navigate]);

  if (!business) {
    return null;
  }

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

      // Prepare sale data
      const saleData = {
        stock_item_id: formData.stock_item_id,
        business_id: business.id,
        quantity: parseFloat(formData.quantity),
        unit_price: parseFloat(formData.unit_price),
        total_amount: parseFloat(formData.total_amount),
        customer_name: formData.customer_name,
        payment_method: formData.payment_method,
        notes: formData.notes,
        created_by: user.id
      };

      // Insert sale record
      const { error: saleError } = await supabase
        .from('sales')
        .insert([saleData]);

      if (saleError) throw saleError;

      // Update stock quantity
      const newQuantity = selectedItem.quantity - parseFloat(formData.quantity);
      const { error: stockError } = await supabase
        .from('stock_items')
        .update({ quantity: newQuantity })
        .eq('id', formData.stock_item_id);

      if (stockError) throw stockError;

      // Success
      toast.success('Sale recorded successfully');
      navigate('/sales', { state: { business } });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Record Sale</h2>
        <button
          onClick={() => navigate('/sales', { state: { business } })}
          className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg shadow transition-colors duration-200"
        >
          Back to Sales
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="max-w-lg">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="stock_item_id">
            Stock Item
          </label>
          <select
            id="stock_item_id"
            name="stock_item_id"
            value={formData.stock_item_id}
            onChange={handleInputChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          >
            <option value="">Select a stock item</option>
            {stockItems.map(item => (
              <option key={item.id} value={item.id}>
                {item.name} - Available: {item.quantity}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="quantity">
            Quantity
          </label>
          <input
            type="number"
            id="quantity"
            name="quantity"
            value={formData.quantity}
            onChange={handleInputChange}
            min="1"
            step="1"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="unit_price">
            Unit Price
          </label>
          <input
            type="number"
            id="unit_price"
            name="unit_price"
            value={formData.unit_price}
            onChange={handleInputChange}
            min="0"
            step="0.01"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="total_amount">
            Total Amount
          </label>
          <input
            type="number"
            id="total_amount"
            value={formData.total_amount || ''}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-100"
            readOnly
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="customer_name">
            Customer Name
          </label>
          <input
            type="text"
            id="customer_name"
            name="customer_name"
            value={formData.customer_name}
            onChange={handleInputChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="payment_method">
            Payment Method
          </label>
          <select
            id="payment_method"
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

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="notes">
            Notes
          </label>
          <textarea
            id="notes"
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
            className={`bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow transition-colors duration-200 ${
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
