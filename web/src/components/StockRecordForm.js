import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import supabase from '../lib/supabase';
import { stockService } from '../services/stockService';

const StockRecordForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quantity: '',
    unit_price: '',
    cost_price: '',
    reorder_level: '10',
    unit_of_measure: 'piece',
    custom_unit: ''
  });

  const unitOptions = [
    'piece', 'kg', 'g', 'mg', 'l', 'm', 'cm', 'mm',
    'sqm', 'cbm', 'dozen', 'box', 'pack', 'other'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    // Handle numeric inputs
    if (['quantity', 'reorder_level'].includes(name)) {
      processedValue = value.replace(/\D/g, '');
    } else if (['unit_price', 'cost_price'].includes(name)) {
      processedValue = value.replace(/[^\d.]/g, '');
      if (processedValue.split('.').length > 2) return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Get user's SME ID
      const { data: smeDetails, error: smeError } = await supabase
        .from('sme_details')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (smeError) throw smeError;

      // Validate custom unit
      if (formData.unit_of_measure === 'other' && !formData.custom_unit.trim()) {
        throw new Error('Custom unit is required when selecting "other" as unit of measure');
      }

      // Prepare stock item data
      const stockItem = {
        sme_id: smeDetails.id,
        name: formData.name.trim(),
        description: formData.description.trim(),
        quantity: parseInt(formData.quantity, 10),
        unit_price: parseFloat(formData.unit_price),
        cost_price: parseFloat(formData.cost_price),
        reorder_level: parseInt(formData.reorder_level, 10),
        unit_of_measure: formData.unit_of_measure,
        custom_unit: formData.unit_of_measure === 'other' ? formData.custom_unit.trim() : null
      };

      // Validate the data
      if (!stockItem.name) throw new Error('Item name is required');
      if (isNaN(stockItem.quantity) || stockItem.quantity < 0) 
        throw new Error('Quantity must be a valid positive number');
      if (isNaN(stockItem.unit_price) || stockItem.unit_price <= 0) 
        throw new Error('Unit price must be a valid positive number');
      if (isNaN(stockItem.cost_price) || stockItem.cost_price <= 0) 
        throw new Error('Cost price must be a valid positive number');
      if (isNaN(stockItem.reorder_level) || stockItem.reorder_level < 0) 
        throw new Error('Reorder level must be a valid positive number');

      // Check for existing item
      const existingItem = await stockService.checkExistingStock(smeDetails.id, stockItem.name);

      if (existingItem) {
        // Update existing item
        await stockService.updateStock(existingItem.id, smeDetails.id, {
          quantity: stockItem.quantity,
          unitPrice: stockItem.unit_price,
          costPrice: stockItem.cost_price
        });
      } else {
        // Create new item
        await stockService.createStockItem(stockItem);
      }

      setSuccess(true);
      setFormData({
        name: '',
        description: '',
        quantity: '',
        unit_price: '',
        cost_price: '',
        reorder_level: '10',
        unit_of_measure: 'piece',
        custom_unit: ''
      });

      // Redirect to stock list after short delay
      setTimeout(() => {
        navigate('/stock/view');
      }, 1500);

    } catch (error) {
      console.error('Error recording stock:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Record New Stock</h2>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
          <p className="text-green-700">Stock recorded successfully!</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Item Name *
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Description
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Quantity *
              <input
                type="text"
                name="quantity"
                required
                value={formData.quantity}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Unit of Measure *
              <select
                name="unit_of_measure"
                required
                value={formData.unit_of_measure}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                {unitOptions.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </label>
          </div>

          {formData.unit_of_measure === 'other' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Custom Unit *
                <input
                  type="text"
                  name="custom_unit"
                  required
                  value={formData.custom_unit}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </label>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Unit Price (KES) *
              <input
                type="text"
                name="unit_price"
                required
                value={formData.unit_price}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Cost Price (KES) *
              <input
                type="text"
                name="cost_price"
                required
                value={formData.cost_price}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Reorder Level
              <input
                type="text"
                name="reorder_level"
                value={formData.reorder_level}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/stock/view')}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Stock Item'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StockRecordForm;
