import React, { useState } from 'react';
import axios from 'axios';

const PaymentModal = ({ isOpen, onClose, order, onPaymentSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !order) {
    return null;
  }

  const handlePayNow = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication error. Please log in again.');
        setIsLoading(false);
        return;
      }

      // The orderId to send is `order.orderId` which comes from `order_id` in the database
      const payload = {
        orderId: order.orderId,
        amount: order.totalPrice,
        description: `Payment for Laundry Order #${order.orderId}`,
      };

      console.log('Creating payment intent with payload:', payload);

      const response = await axios.post(
        'http://localhost:8800/api/payments/create-intent',
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      const { checkoutUrl } = response.data;

      if (checkoutUrl) {
        // Redirect the user to the payment gateway
        window.location.href = checkoutUrl;
      } else {
        setError('Could not retrieve payment URL. Please try again.');
      }
    } catch (err) {
      console.error('Payment initiation failed:', err);
      const errorMessage = err.response?.data?.message || 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-2xl max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Complete Your Payment</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex justify-between">
            <span className="text-gray-600">Order ID:</span>
            <span className="font-semibold text-gray-800">#{order.orderId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Service:</span>
            <span className="font-semibold text-gray-800">{order.serviceType}</span>
          </div>
          <div className="border-t my-4"></div>
          <div className="flex justify-between text-xl font-bold">
            <span className="text-gray-800">Total Amount:</span>
            <span className="text-pink-600">₱{order.totalPrice.toLocaleString()}</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <p className="text-sm text-gray-500 mb-6">
          You will be redirected to a secure payment page to complete your transaction via GCash.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={handlePayNow}
            disabled={isLoading}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Processing...' : 'Proceed to Payment'}
          </button>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;