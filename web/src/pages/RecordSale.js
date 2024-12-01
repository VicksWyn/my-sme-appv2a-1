import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function RecordSale() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
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
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('business_id')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      const { data, error: stockError } = await supabase
        .from('stock_items')
        .select('*')
        .eq('business_id', profileData.business_id)
        .gt('quantity', 0)
        .order('name');

      if (stockError) throw stockError;
      setStockItems(data || []);
    } catch (error) {
      console.error('Error fetching stock items:', error);
      toast.error('Failed to load stock items');
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
        toast.error(`Cannot add more ${item.name}. Maximum available quantity is ${item.quantity}`);
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
      toast.error(`Cannot set quantity above ${item.quantity} for ${item.name}`);
      return;
    }

    setSelectedItems(selectedItems.map(selected =>
      selected.id === itemId
        ? { ...selected, quantity: Math.max(1, parseInt(newQuantity)) }
        : selected
    ));
  };

  const calculateTotal = () => {
    return selectedItems.reduce((total, item) => total + (item.unit_price * item.quantity), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedItems.length === 0) {
      toast.error('Please add at least one item to the sale');
      return;
    }

    try {
      setLoading(true);

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('business_id')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Create the sale record
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          business_id: profileData.business_id,
          created_by: user.id,
          customer_name: customerName || null,
          payment_method: paymentMethod,
          total_amount: calculateTotal()
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // Create sale items
      const saleItems = selectedItems.map(item => ({
        sale_id: sale.id,
        stock_item_id: item.id,
        quantity: item.quantity,
        unit_price: item.unit_price
      }));

      const { error: itemsError } = await supabase
        .from('sales_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      toast.success('Sale recorded successfully!');
      navigate('/sales');
    } catch (error) {
      console.error('Error recording sale:', error);
      toast.error('Failed to record sale');
    } finally {
      setLoading(false);
    }
  };

  const filteredStockItems = stockItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Record Sale</h1>
            <p className="mt-2 text-sm text-gray-600">
              Add items to the sale and record customer information
            </p>
          </div>
          <button
            onClick={() => navigate('/sales')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Back to Sales
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Stock Items Selection */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="mb-4">
              <label htmlFor="search" className="sr-only">Search items</label>
              <input
                type="search"
                id="search"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {loading ? (
                <div className="col-span-2 flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                </div>
              ) : filteredStockItems.length === 0 ? (
                <div className="col-span-2 text-center py-4">
                  <p className="text-gray-500">No items found</p>
                </div>
              ) : (
                filteredStockItems.map((item) => (
                  <div
                    key={item.id}
                    className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                  >
                    <div className="flex-1 min-w-0">
                      <button
                        type="button"
                        className="focus:outline-none w-full text-left"
                        onClick={() => handleAddItem(item)}
                      >
                        <span className="absolute inset-0" aria-hidden="true" />
                        <p className="text-sm font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500 truncate">
                          {item.quantity} {item.unit_of_measure} available
                        </p>
                        <p className="text-sm font-medium text-indigo-600">
                          {formatCurrency(item.unit_price)}
                        </p>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sale Details */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <label htmlFor="customerName" className="block text-sm font-medium text-gray-700">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    id="customerName"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">
                    Payment Method
                  </label>
                  <select
                    id="paymentMethod"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="CASH">Cash</option>
                    <option value="MPESA">M-PESA</option>
                    <option value="BANK">Bank Transfer</option>
                  </select>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900">Selected Items</h3>
                  {selectedItems.length === 0 ? (
                    <p className="mt-2 text-sm text-gray-500">No items selected</p>
                  ) : (
                    <div className="mt-2 space-y-4">
                      {selectedItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{item.name}</p>
                            <div className="mt-1 flex items-center">
                              <input
                                type="number"
                                min="1"
                                max={item.quantity}
                                className="block w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                value={item.quantity}
                                onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                              />
                              <span className="ml-2 text-sm text-gray-500">
                                × {formatCurrency(item.unit_price)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <button
                              type="button"
                              className="text-red-600 hover:text-red-900"
                              onClick={() => handleRemoveItem(item.id)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                      <div className="pt-4 border-t border-gray-200">
                        <div className="flex justify-between">
                          <span className="text-base font-medium text-gray-900">Total</span>
                          <span className="text-base font-medium text-gray-900">
                            {formatCurrency(calculateTotal())}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading || selectedItems.length === 0}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Recording Sale...' : 'Record Sale'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
