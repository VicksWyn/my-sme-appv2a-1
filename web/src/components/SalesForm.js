import React, { useState, useEffect } from 'react';
import supabase from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

const SalesForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stockItems, setStockItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');

  // Fetch stock items on component mount
  useEffect(() => {
    fetchStockItems();
  }, []);

  const fetchStockItems = async () => {
    try {
      const { data, error } = await supabase
        .from('stock_items')
        .select('*')
        .gt('quantity', 0);

      if (error) throw error;
      setStockItems(data);
    } catch (error) {
      console.error('Error fetching stock items:', error);
      setError('Failed to load stock items');
    }
  };

  const addItemToSale = (stockItem) => {
    setSelectedItems(prev => {
      const existingItem = prev.find(item => item.id === stockItem.id);
      if (existingItem) {
        return prev.map(item =>
          item.id === stockItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...stockItem, quantity: 1 }];
    });
  };

  const updateItemQuantity = (itemId, quantity) => {
    const stockItem = stockItems.find(item => item.id === itemId);
    if (quantity > stockItem.quantity) {
      setError(`Only ${stockItem.quantity} units available`);
      return;
    }
    
    setSelectedItems(prev =>
      prev.map(item =>
        item.id === itemId
          ? { ...item, quantity: parseInt(quantity) }
          : item
      )
    );
  };

  const removeItem = (itemId) => {
    setSelectedItems(prev => prev.filter(item => item.id !== itemId));
  };

  const calculateTotal = () => {
    return selectedItems.reduce((total, item) => 
      total + (item.unit_price * item.quantity), 0
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Get user's SME ID
      const { data: { user } } = await supabase.auth.getUser();
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('sme_id')
        .eq('user_id', user.id)
        .single();

      // Create sale record
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          sme_id: userProfile.sme_id,
          recorded_by: user.id,
          customer_name: customerName,
          total_amount: calculateTotal(),
          payment_method: paymentMethod
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // Create sale items
      const saleItems = selectedItems.map(item => ({
        sale_id: sale.id,
        stock_item_id: item.id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.unit_price * item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('sales_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      // Navigate to receipt page
      navigate(`/receipt/${sale.id}`);
    } catch (error) {
      console.error('Error recording sale:', error);
      setError('Failed to record sale. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Record New Sale</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Customer Name
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Payment Method
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="CASH">Cash</option>
              <option value="MPESA">M-PESA</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
            </select>
          </label>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Available Items</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stockItems.map(item => (
              <div
                key={item.id}
                className="border rounded p-3 cursor-pointer hover:bg-gray-50"
                onClick={() => addItemToSale(item)}
              >
                <h4 className="font-medium">{item.name}</h4>
                <p className="text-sm text-gray-500">
                  Price: KES {item.unit_price.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">
                  Available: {item.quantity}
                </p>
              </div>
            ))}
          </div>
        </div>

        {selectedItems.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-2">Selected Items</h3>
            <div className="space-y-4">
              {selectedItems.map(item => (
                <div key={item.id} className="flex items-center space-x-4">
                  <span className="flex-grow">{item.name}</span>
                  <input
                    type="number"
                    min="1"
                    max={stockItems.find(si => si.id === item.id)?.quantity}
                    value={item.quantity}
                    onChange={(e) => updateItemQuantity(item.id, e.target.value)}
                    className="w-20 rounded-md border-gray-300"
                  />
                  <span className="w-32">
                    KES {(item.unit_price * item.quantity).toFixed(2)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <div className="text-xl font-bold text-right">
                Total: KES {calculateTotal().toFixed(2)}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || selectedItems.length === 0}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
          >
            {loading ? 'Recording Sale...' : 'Complete Sale'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SalesForm;
