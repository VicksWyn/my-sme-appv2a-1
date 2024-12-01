import React, { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const Stock = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState({ name: '', quantity: '', price: '' });
  const supabase = useSupabaseClient();
  const { userProfile } = useAuth();

  useEffect(() => {
    fetchItems();
  }, [userProfile]);

  const fetchItems = async () => {
    try {
      if (!userProfile?.business?.id) return;

      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('business_id', userProfile.business.id)
        .order('name');

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      toast.error('Error fetching items: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      if (!userProfile?.business?.id) {
        toast.error('Business context not found');
        return;
      }

      const { data, error } = await supabase
        .from('items')
        .insert([
          {
            name: newItem.name,
            quantity: parseInt(newItem.quantity),
            price: parseFloat(newItem.price),
            business_id: userProfile.business.id
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setItems([...items, data]);
      setNewItem({ name: '', quantity: '', price: '' });
      toast.success('Item added successfully!');
    } catch (error) {
      toast.error('Error adding item: ' + error.message);
    }
  };

  const handleUpdateItem = async (id, field, value) => {
    try {
      const { error } = await supabase
        .from('items')
        .update({ [field]: value })
        .eq('id', id)
        .eq('business_id', userProfile.business.id);

      if (error) throw error;

      setItems(items.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      ));
      toast.success('Item updated successfully!');
    } catch (error) {
      toast.error('Error updating item: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold mb-6">Add New Item</h2>
        <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Item Name"
            value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            className="border rounded-lg px-4 py-2"
            required
          />
          <input
            type="number"
            placeholder="Quantity"
            value={newItem.quantity}
            onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
            className="border rounded-lg px-4 py-2"
            required
          />
          <input
            type="number"
            placeholder="Price"
            value={newItem.price}
            onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
            className="border rounded-lg px-4 py-2"
            required
            step="0.01"
          />
          <button
            type="submit"
            className="md:col-span-3 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Add Item
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Current Stock</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                      className="border-b border-transparent hover:border-gray-300 focus:border-indigo-500 focus:outline-none"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleUpdateItem(item.id, 'quantity', parseInt(e.target.value))}
                      className="border-b border-transparent hover:border-gray-300 focus:border-indigo-500 focus:outline-none w-20"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => handleUpdateItem(item.id, 'price', parseFloat(e.target.value))}
                      className="border-b border-transparent hover:border-gray-300 focus:border-indigo-500 focus:outline-none w-24"
                      step="0.01"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {(item.quantity * item.price).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Stock;
