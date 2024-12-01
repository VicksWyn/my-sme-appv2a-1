import React, { useState } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const BulkStockAdd = ({ onClose }) => {
  const [items, setItems] = useState([{
    name: '',
    description: '',
    quantity: '',
    unit_price: '',
    cost_price: '',
    reorder_level: '10',
    unit_of_measure: 'piece'
  }]);
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const unitOptions = [
    'piece', 'kg', 'g', 'l', 'ml', 'm', 'cm', 'box', 'pack'
  ];

  const addNewRow = () => {
    setItems([...items, {
      name: '',
      description: '',
      quantity: '',
      unit_price: '',
      cost_price: '',
      reorder_level: '10',
      unit_of_measure: 'piece'
    }]);
  };

  const removeRow = (index) => {
    const newItems = items.filter((_, idx) => idx !== index);
    setItems(newItems);
  };

  const handleChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      [field]: value
    };
    setItems(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!user?.id) {
        toast.error('You must be logged in');
        return;
      }

      // Get the profile with business ID
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, role, business_id')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        toast.error('Failed to fetch user profile');
        return;
      }

      if (!profileData?.business_id) {
        toast.error('Business profile not found');
        return;
      }

      // Prepare items for insertion
      const itemsToInsert = items.map(item => ({
        ...item,
        quantity: parseInt(item.quantity) || 0,
        unit_price: parseFloat(item.unit_price) || 0,
        cost_price: parseFloat(item.cost_price) || 0,
        reorder_level: parseInt(item.reorder_level) || 10,
        business_id: profileData.business_id,
        created_by: user.id
      }));

      // Insert all items
      const { error: insertError } = await supabase
        .from('stock_items')
        .insert(itemsToInsert);

      if (insertError) throw insertError;

      toast.success(`Successfully added ${items.length} items`);
      onClose();
    } catch (error) {
      console.error('Error adding stock items:', error);
      toast.error('Failed to add stock items');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-7xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Bulk Add Stock Items</h3>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 text-xl font-bold"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">Name*</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8">Quantity*</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8">Unit</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8">Unit Price (KSh)*</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8">Cost Price (KSh)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8">Reorder Level</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        required
                        value={item.name}
                        onChange={(e) => handleChange(index, 'name', e.target.value)}
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Item name"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <textarea
                        value={item.description}
                        onChange={(e) => handleChange(index, 'description', e.target.value)}
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Description"
                        rows="2"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        required
                        min="0"
                        value={item.quantity}
                        onChange={(e) => handleChange(index, 'quantity', e.target.value)}
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Qty"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <select
                        value={item.unit_of_measure}
                        onChange={(e) => handleChange(index, 'unit_of_measure', e.target.value)}
                        className="block w-full min-w-[120px] border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {unitOptions.map(unit => (
                          <option key={unit} value={unit}>
                            {unit.charAt(0).toUpperCase() + unit.slice(1)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => handleChange(index, 'unit_price', e.target.value)}
                        className="block w-full min-w-[150px] border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Unit price"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.cost_price}
                        onChange={(e) => handleChange(index, 'cost_price', e.target.value)}
                        className="block w-full min-w-[150px] border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Cost"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min="0"
                        value={item.reorder_level}
                        onChange={(e) => handleChange(index, 'reorder_level', e.target.value)}
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Reorder"
                      />
                    </td>
                    <td className="px-4 py-2">
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRow(index)}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center mt-6 pt-4 border-t">
            <button
              type="button"
              onClick={addNewRow}
              className="bg-green-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Add Another Item
            </button>
            <div className="space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isSubmitting ? 'Adding Items...' : 'Add All Items'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkStockAdd;
