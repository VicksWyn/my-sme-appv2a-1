import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import BulkStockAdd from './BulkStockAdd';
import RecordSale from './RecordSale';

const StockItem = ({ item, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [quantity, setQuantity] = useState(item.quantity);
  const [unitPrice, setUnitPrice] = useState(item.unit_price);
  const [unitOfMeasure, setUnitOfMeasure] = useState(item.unit_of_measure);
  const [description, setDescription] = useState(item.description);
  const [costPrice, setCostPrice] = useState(item.cost_price);
  const { user } = useAuth();

  const handleUpdate = async () => {
    try {
      const { data, error } = await supabase
        .from('stock_items')
        .update({
          quantity: parseInt(quantity),
          unit_price: parseFloat(unitPrice),
          unit_of_measure: unitOfMeasure,
          description: description,
          cost_price: parseFloat(costPrice),
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id);

      if (error) throw error;
      setIsEditing(false);
      if (onUpdate) onUpdate();
      toast.success('Stock updated successfully');
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('Failed to update stock');
    }
  };

  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {item.name}
      </td>
      <td className="px-6 py-4 whitespace-pre-line text-sm text-gray-500">
        {isEditing ? (
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-2 py-1 border rounded"
          />
        ) : (
          item.description
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {isEditing ? (
          <input
            type="number"
            min="0"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-20 px-2 py-1 border rounded"
          />
        ) : (
          `${quantity} ${item.unit_of_measure}`
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {isEditing ? (
          <select
            value={unitOfMeasure}
            onChange={(e) => setUnitOfMeasure(e.target.value)}
            className="w-24 px-2 py-1 border rounded"
          >
            <option value="piece">Piece</option>
            <option value="kg">Kilogram</option>
            <option value="g">Gram</option>
            <option value="l">Liter</option>
            <option value="ml">Milliliter</option>
            <option value="m">Meter</option>
            <option value="cm">Centimeter</option>
            <option value="box">Box</option>
            <option value="pack">Pack</option>
          </select>
        ) : (
          item.unit_of_measure
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {isEditing ? (
          <input
            type="number"
            min="0"
            step="0.01"
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
            className="w-24 px-2 py-1 border rounded"
          />
        ) : (
          `KSh ${parseFloat(unitPrice).toFixed(2)}`
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {isEditing ? (
          <input
            type="number"
            min="0"
            step="0.01"
            value={costPrice}
            onChange={(e) => setCostPrice(e.target.value)}
            className="w-24 px-2 py-1 border rounded"
          />
        ) : (
          `KSh ${parseFloat(costPrice).toFixed(2)}`
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {item.reorder_level}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        {user && (
          isEditing ? (
            <div className="space-x-2">
              <button
                onClick={handleUpdate}
                className="text-green-600 hover:text-green-900"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setQuantity(item.quantity);
                  setUnitPrice(item.unit_price);
                  setUnitOfMeasure(item.unit_of_measure);
                  setDescription(item.description);
                  setCostPrice(item.cost_price);
                  setIsEditing(false);
                }}
                className="text-red-600 hover:text-red-900"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="text-blue-600 hover:text-blue-900"
            >
              Edit
            </button>
          )
        )}
      </td>
    </tr>
  );
};

const AddStockForm = ({ onAdd, onCancel }) => {
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [reorderLevel, setReorderLevel] = useState('10');
  const [description, setDescription] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [unitOfMeasure, setUnitOfMeasure] = useState('piece');
  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!user?.id) {
        toast.error('You must be logged in');
        return;
      }

      if (!unitOfMeasure) {
        toast.error('Please select a unit of measure');
        return;
      }

      // Get the profile with business ID
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          id,
          role,
          business_id
        `)
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

      const { data, error } = await supabase
        .from('stock_items')
        .insert({
          name: itemName,
          description: description || '',
          quantity: parseInt(quantity) || 0,
          unit_price: parseFloat(unitPrice) || 0,
          cost_price: parseFloat(costPrice) || 0,
          reorder_level: parseInt(reorderLevel) || 10,
          unit_of_measure: unitOfMeasure || 'piece',
          business_id: profileData.business_id,
          created_by: user.id
        })
        .select();

      if (error) throw error;
      toast.success('Stock item added successfully');
      onAdd();
      onCancel();
    } catch (error) {
      console.error('Error adding stock:', error);
      toast.error('Failed to add stock item');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
      <div>
        <label className="block text-sm font-medium text-gray-700">Item Name</label>
        <input
          type="text"
          required
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
          placeholder="Enter item name"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
          placeholder="Enter item description"
          rows="3"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Quantity</label>
          <input
            type="number"
            required
            min="0"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
            placeholder="Enter quantity"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Unit of Measure</label>
          <select
            required
            value={unitOfMeasure}
            onChange={(e) => setUnitOfMeasure(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
          >
            <option value="piece">Piece</option>
            <option value="kg">Kilogram</option>
            <option value="g">Gram</option>
            <option value="l">Liter</option>
            <option value="ml">Milliliter</option>
            <option value="m">Meter</option>
            <option value="cm">Centimeter</option>
            <option value="box">Box</option>
            <option value="pack">Pack</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Unit Price (KSh)</label>
          <input
            type="number"
            required
            min="0"
            step="0.01"
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
            placeholder="Enter unit price"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Cost Price (KSh)</label>
          <input
            type="number"
            required
            min="0"
            step="0.01"
            value={costPrice}
            onChange={(e) => setCostPrice(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
            placeholder="Enter cost price"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Reorder Level</label>
        <input
          type="number"
          required
          min="0"
          value={reorderLevel}
          onChange={(e) => setReorderLevel(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
          placeholder="Enter reorder level"
        />
      </div>
      <div className="flex justify-end space-x-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Add Item
        </button>
      </div>
    </form>
  );
};

const Stock = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stockItems, setStockItems] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [showSaleForm, setShowSaleForm] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const loadStockItems = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) {
        navigate('/login');
        return;
      }

      // First get the user's profile with business_id
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, role, business_id')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        setError('Failed to fetch user profile');
        return;
      }

      if (!profileData.business_id) {
        setError('No associated business found. Please complete your business setup.');
        return;
      }

      // Get stock items for the business
      const { data: stockData, error: stockError } = await supabase
        .from('stock_items')
        .select('*')
        .eq('business_id', profileData.business_id)
        .order('created_at', { ascending: false });

      if (stockError) throw stockError;

      setStockItems(stockData || []);
    } catch (err) {
      console.error('Error loading stock items:', err);
      setError(err.message);
      toast.error('Failed to load stock items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadStockItems();
    }
  }, [user]);

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 max-w-2xl">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading stock items</h3>
              <p className="mt-2 text-sm text-red-700">{error}</p>
              <button
                onClick={loadStockItems}
                className="mt-4 bg-red-100 px-4 py-2 rounded-md text-red-800 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Stock Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your inventory, track stock levels, and update prices.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <div className="space-x-3">
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
            >
              Add Single Item
            </button>
            <button
              onClick={() => setShowBulkAdd(true)}
              className="bg-green-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:w-auto"
            >
              Bulk Add Items
            </button>
            <button
              onClick={() => setShowSaleForm(true)}
              className="bg-purple-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 sm:w-auto"
            >
              Record Sale
            </button>
          </div>
        </div>
      </div>

      {showAddForm && (
        <div className="mt-8">
          <AddStockForm
            onAdd={loadStockItems}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {showBulkAdd && (
        <BulkStockAdd
          onClose={() => {
            setShowBulkAdd(false);
            loadStockItems();
          }}
        />
      )}

      {showSaleForm && (
        <RecordSale
          onClose={() => setShowSaleForm(false)}
          onSaleComplete={() => {
            setShowSaleForm(false);
            loadStockItems();
          }}
        />
      )}

      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Price (KSh)
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cost Price (KSh)
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reorder Level
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stockItems.map((item) => (
                    <StockItem
                      key={item.id}
                      item={item}
                      onUpdate={loadStockItems}
                    />
                  ))}
                  {stockItems.length === 0 && (
                    <tr>
                      <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                        No stock items found. Click "Add New Item" to add some inventory.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stock;
