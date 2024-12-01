import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import supabase from '../lib/supabase';

const Receipt = () => {
  const { id } = useParams();
  const { userProfile } = useAuth();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        const { data, error } = await supabase
          .from('receipts')
          .select(`
            *,
            sale:sale_id (
              *,
              stock:stock_id (
                item_name,
                unit_price
              ),
              recorded_by_user:recorded_by (
                full_name
              )
            ),
            created_by_user:created_by (
              full_name
            )
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        setReceipt(data);
      } catch (error) {
        console.error('Error fetching receipt:', error);
        alert('Failed to fetch receipt. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchReceipt();
    }
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-red-700">Receipt not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Print-only header */}
        <div className="print:block hidden">
          <div className="text-center p-6 border-b">
            <h1 className="text-2xl font-bold">Sales Receipt</h1>
            <p className="text-gray-600">Thank you for your business!</p>
          </div>
        </div>

        {/* Receipt content */}
        <div className="p-6 space-y-6">
          {/* Receipt header */}
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold">Receipt #{receipt.receipt_number}</h2>
              <p className="text-gray-600">
                Date: {new Date(receipt.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-600">Recorded by:</p>
              <p className="font-medium">{receipt.sale.recorded_by_user.full_name}</p>
            </div>
          </div>

          {/* Sale details */}
          <div className="border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {receipt.sale.stock.item_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {receipt.sale.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${receipt.sale.stock.unit_price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${receipt.sale.amount_paid.toFixed(2)}
                  </td>
                </tr>
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan="3" className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                    Total Amount:
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${receipt.total_amount.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Payment info */}
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-700">Payment Method</p>
              <p className="text-lg capitalize">{receipt.sale.payment_type}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-700">Total Paid</p>
              <p className="text-lg font-semibold">${receipt.total_amount.toFixed(2)}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-gray-600 text-sm">
            <p>Thank you for your business!</p>
            <p>Please keep this receipt for your records.</p>
          </div>
        </div>

        {/* Print button (hidden in print view) */}
        <div className="p-6 border-t print:hidden">
          <button
            onClick={handlePrint}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
};

export default Receipt;
