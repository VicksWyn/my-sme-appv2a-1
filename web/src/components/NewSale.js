import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import supabase from '../lib/supabase';

const NewSale = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stockItems, setStockItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStockItems();
  }, []);

  const fetchStockItems = async () => {
    try {
      setLoading(true);
      
      // Get user's SME details
      const { data: smeDetails, error: smeError } = await supabase
        .from('sme_details')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (smeError) throw smeError;

      if (!smeDetails) {
        throw new Error('SME details not found');
      }

      const { data, error: stockError } = await supabase
        .from('stock_items')
        .select('*')
        .eq('sme_id', smeDetails.id)
        .gt('quantity', 0)
        .order('name');

      if (stockError) throw stockError;

      setStockItems(data || []);
    } catch (err) {
      console.error('Error fetching stock items:', err);
      setError('Failed to load stock items');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = (item) => {
    const existingItem = selectedItems.find(selected => selected.id === item.id);
    
    if (existingItem) {
      if (existingItem.quantity < item.quantity) {
        setSelectedItems(selectedItems.map(selected =>
          selected.id === item.id
            ? { ...selected, quantity: selected.quantity + 1 }
            : selected
        ));
      } else {
        setError(`Cannot add more ${item.name}. Maximum available quantity is ${item.quantity}`);
      }
    } else {
      setSelectedItems([...selectedItems, { ...item, quantity: 1 }]);
    }
  };

  const handleRemoveItem = (itemId) => {
    setSelectedItems(selectedItems.filter(item => item.id !== itemId));
  };

  const handleQuantityChange = (itemId, newQuantity) => {
    const item = stockItems.find(item => item.id === itemId);
    if (newQuantity > item.quantity) {
      setError(`Cannot set quantity above ${item.quantity} for ${item.name}`);
      return;
    }

    setSelectedItems(selectedItems.map(selected =>
      selected.id === itemId
        ? { ...selected, quantity: Math.max(1, newQuantity) }
        : selected
    ));
  };

  const calculateTotal = () => {
    return selectedItems.reduce((total, item) => total + (item.unit_price * item.quantity), 0);
  };

  const handleCompleteSale = async () => {
    if (selectedItems.length === 0) {
      setError('Please add at least one item to the sale');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get user's SME details
      const { data: smeDetails, error: smeError } = await supabase
        .from('sme_details')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (smeError) {
        console.error('SME error:', smeError);
        throw new Error('Failed to fetch SME details');
      }

      if (!smeDetails) {
        throw new Error('SME details not found');
      }

      // Start a transaction by using RLS policies
      // 1. Create the sale record
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          sme_id: smeDetails.id,
          recorded_by: user.id,
          customer_name: customerName || null,
          payment_method: paymentMethod,
          total_amount: calculateTotal()
        })
        .select()
        .single();

      if (saleError) {
        console.error('Sale error:', saleError);
        throw new Error('Failed to create sale record: ' + saleError.message);
      }

      if (!sale) {
        throw new Error('Sale record was not created');
      }

      // 2. Insert sale items
      const saleItems = selectedItems.map(item => ({
        sales_id: sale.id,
        stock_item_id: item.id,
        quantity: parseInt(item.quantity),
        price: parseFloat(item.unit_price),
        cost_price: parseFloat(item.cost_price || 0)
      }));

      const { error: itemsError } = await supabase
        .from('sales_items')
        .insert(saleItems);

      if (itemsError) {
        console.error('Items error:', itemsError);
        throw new Error('Failed to record sale items: ' + itemsError.message);
      }

      // 3. Update stock quantities
      for (const item of selectedItems) {
        const { data: currentStock, error: stockError } = await supabase
          .from('stock_items')
          .select('quantity')
          .eq('id', item.id)
          .eq('sme_id', smeDetails.id)
          .single();

        if (stockError) {
          console.error('Stock fetch error:', stockError);
          throw new Error(`Failed to fetch stock for ${item.name}`);
        }

        if (!currentStock) {
          throw new Error(`Stock item ${item.name} not found`);
        }

        const newQuantity = currentStock.quantity - parseInt(item.quantity);
        if (newQuantity < 0) {
          throw new Error(`Insufficient stock for ${item.name}`);
        }

        const { error: updateError } = await supabase
          .from('stock_items')
          .update({ quantity: newQuantity })
          .match({ id: item.id, sme_id: smeDetails.id });

        if (updateError) {
          console.error('Update error:', updateError);
          throw new Error(`Failed to update stock for ${item.name}`);
        }
      }

      // Success - navigate to receipt
      navigate(`/receipt/${sale.id}`);
    } catch (err) {
      console.error('Error recording sale:', err);
      setError(err.message || 'Failed to record sale');
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

  const filteredItems = stockItems.filter(item => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      item.name.toLowerCase().includes(searchLower) ||
      item.description?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">New Sale</h2>
        <button
          onClick={() => navigate('/sales')}
          className="text-primary-600 hover:text-primary-900"
        >
          &larr; Back to Sales
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column - Available Items */}
        <div>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="max-h-[500px] overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleAddItem(item)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          Add
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column - Selected Items & Sale Details */}
        <div>
          <div className="bg-white shadow-md rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Sale Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name (Optional)
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Walk-in Customer"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="TRANSFER">Transfer</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {selectedItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value))}
                        className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(item.unit_price * item.quantity)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan="2" className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                    Total:
                  </td>
                  <td colSpan="2" className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                    {formatCurrency(calculateTotal())}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleCompleteSale}
              disabled={selectedItems.length === 0 || loading}
              className={`px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700
                ${(selectedItems.length === 0 || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Processing...' : 'Complete Sale'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewSale;
