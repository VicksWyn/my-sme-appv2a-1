import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

const SaleForm = ({ onSaleComplete }) => {
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([{ stockItemId: '', quantity: '', price: '' }]);
  const [loading, setLoading] = useState(false);
  const { userProfile } = useAuth();

  useEffect(() => {
    const fetchStockItems = async () => {
      try {
        const { data, error } = await supabase
          .from('stock_items')
          .select('*')
          .eq('business_id', userProfile.business_id)
          .gt('quantity', 0)
          .order('name');

        if (error) throw error;
        setItems(data || []);
      } catch (error) {
        console.error('Error fetching stock items:', error);
        toast.error('Failed to fetch stock items');
      }
    };

    if (userProfile?.business_id) {
      fetchStockItems();
    }
  }, [userProfile]);

  const handleAddItem = () => {
    setSelectedItems([...selectedItems, { stockItemId: '', quantity: '', price: '' }]);
  };

  const handleRemoveItem = (index) => {
    const newItems = [...selectedItems];
    newItems.splice(index, 1);
    setSelectedItems(newItems);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...selectedItems];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'stockItemId' && value) {
      const stockItem = items.find(item => item.id === value);
      if (stockItem) {
        newItems[index].price = stockItem.price.toString();
      }
    }
    
    setSelectedItems(newItems);
  };

  const calculateTotal = () => {
    return selectedItems.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.price) || 0;
      return sum + (quantity * price);
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      // Validate quantities
      for (const item of selectedItems) {
        const stockItem = items.find(i => i.id === item.stockItemId);
        if (!stockItem) continue;
        
        if (parseInt(item.quantity) > stockItem.quantity) {
          throw new Error(`Not enough stock for ${stockItem.name}. Available: ${stockItem.quantity}`);
        }
      }

      // Create sale record
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          business_id: userProfile.business_id,
          seller_id: userProfile.id,
          total_amount: calculateTotal()
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // Create sale items and update stock
      const saleItems = selectedItems.map(item => ({
        sale_id: sale.id,
        stock_item_id: item.stockItemId,
        quantity: parseInt(item.quantity),
        price_at_sale: parseFloat(item.price)
      }));

      const { error: saleItemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (saleItemsError) throw saleItemsError;

      // Update stock quantities
      for (const item of selectedItems) {
        const { error: stockError } = await supabase
          .from('stock_items')
          .update({
            quantity: supabase.raw(`quantity - ${parseInt(item.quantity)}`)
          })
          .eq('id', item.stockItemId);

        if (stockError) throw stockError;
      }

      toast.success('Sale recorded successfully!');
      onSaleComplete();
    } catch (error) {
      console.error('Error recording sale:', error);
      toast.error(error.message || 'Failed to record sale');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {selectedItems.map((item, index) => (
        <div key={index} className="bg-white p-6 rounded-lg shadow space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Item {index + 1}</h3>
            {index > 0 && (
              <button
                type="button"
                onClick={() => handleRemoveItem(index)}
                className="text-red-600 hover:text-red-900"
              >
                Remove
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Item</label>
              <select
                required
                value={item.stockItemId}
                onChange={(e) => handleItemChange(index, 'stockItemId', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select an item</option>
                {items.map((stockItem) => (
                  <option key={stockItem.id} value={stockItem.id}>
                    {stockItem.name} (Available: {stockItem.quantity}) - ${stockItem.price}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Quantity</label>
              <input
                type="number"
                required
                min="1"
                value={item.quantity}
                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Price ($)</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={item.price}
                readOnly
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm"
              />
            </div>
          </div>
        </div>
      ))}

      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={handleAddItem}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Add Another Item
        </button>

        <div className="text-xl font-bold">
          Total: ${calculateTotal().toFixed(2)}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Recording Sale...' : 'Complete Sale'}
        </button>
      </div>
    </form>
  );
};

const SalesList = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userProfile } = useAuth();

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const { data, error } = await supabase
          .from('sales')
          .select(`
            *,
            seller:seller_id (
              full_name
            ),
            items:sale_items (
              quantity,
              price_at_sale,
              stock_item:stock_item_id (
                name
              )
            )
          `)
          .eq('business_id', userProfile.business_id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setSales(data || []);
      } catch (error) {
        console.error('Error fetching sales:', error);
        toast.error('Failed to fetch sales');
      } finally {
        setLoading(false);
      }
    };

    if (userProfile?.business_id) {
      fetchSales();
    }
  }, [userProfile]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sales.map((sale) => (
        <div key={sale.id} className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Sale #{sale.id.slice(0, 8)}
              </h3>
              <p className="text-sm text-gray-500">
                Sold by: {sale.seller.full_name}
              </p>
              <p className="text-sm text-gray-500">
                Date: {new Date(sale.created_at).toLocaleString()}
              </p>
            </div>
            <p className="text-xl font-bold text-gray-900">
              ${parseFloat(sale.total_amount).toFixed(2)}
            </p>
          </div>

          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-900">Items</h4>
            <div className="mt-2 divide-y divide-gray-200">
              {sale.items.map((item, index) => (
                <div key={index} className="py-2 flex justify-between">
                  <div className="text-sm text-gray-500">
                    {item.stock_item.name} x {item.quantity}
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    ${(item.quantity * item.price_at_sale).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const Sales = () => {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Sales</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {showForm ? 'View Sales' : 'New Sale'}
        </button>
      </div>

      {showForm ? (
        <SaleForm onSaleComplete={() => setShowForm(false)} />
      ) : (
        <SalesList />
      )}
    </div>
  );
};

export default Sales;
