import React, { useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { PhoneIcon } from '@heroicons/react/24/outline';

const Receipt = ({ sale, onClose }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const supabase = useSupabaseClient();

  const formatReceiptData = () => {
    return {
      businessName: sale.sme_details.business_name,
      receiptNumber: sale.id,
      date: new Date(sale.created_at).toLocaleDateString(),
      total: sale.total_amount,
      items: sale.items.map(item => ({
        name: item.stock.name,
        quantity: item.quantity,
        price: item.price
      })),
      receiptUrl: `${window.location.origin}/receipts/${sale.id}`
    };
  };

  const handleSendSMS = async (e) => {
    e.preventDefault();
    setSending(true);
    setError(null);

    try {
      const { data: { publicUrl }, error: urlError } = await supabase
        .storage
        .from('receipts')
        .getPublicUrl(`receipt-${sale.id}.pdf`);

      if (urlError) throw urlError;

      const receiptData = {
        ...formatReceiptData(),
        receiptUrl: publicUrl
      };

      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: { phoneNumber, receiptData }
      });

      if (error) throw error;
      
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (error) {
      setError(error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Share Receipt</h2>
          
          <form onSubmit={handleSendSMS}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Phone Number
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <PhoneIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="+1234567890"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md text-sm">
                Receipt sent successfully!
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sending}
                className={`px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 ${
                  sending ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {sending ? 'Sending...' : 'Send Receipt'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Receipt;
