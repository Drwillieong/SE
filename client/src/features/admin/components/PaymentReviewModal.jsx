import React, { useState } from "react";

const PaymentReviewModal = ({ isOpen, onClose, payment, onDecision }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !payment) return null;

  const handleDecision = async (status) => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8800/api/admin/orders/${payment.order_id}/gcash-payment-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ decision: status })
      });

      if (response.ok) {
        const data = await response.json();
        // Call the parent callback to update local state
        if (onDecision) {
          await onDecision(status, payment.order_id);
        }
        onClose();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update payment status');
      }
    } catch (error) {
      console.error('Error processing payment decision:', error);
      setError(error.message || 'Failed to process decision. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <h2 className="text-xl font-semibold text-gray-800">
            Review GCash Payment
          </h2>
          <p className="text-sm text-gray-500">
            Verify the payment proof and reference number.
          </p>
        </div>

        {/* Payment Proof */}
        <div className="flex flex-col items-center mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Proof of Payment
          </h3>
          <img
            src={`http://localhost:8800${payment.payment_proof}`}
            alt="Proof of payment"
            className="w-60 h-60 object-cover border rounded-lg shadow-sm"
          />
        </div>

        {/* Reference ID */}
        <div className="text-center mb-6">
          <p className="text-gray-700 text-sm">
            <span className="font-medium">Reference ID:</span>{" "}
            <span className="font-semibold text-blue-600">
              {payment.reference_id}
            </span>
          </p>
          <p className="text-gray-700 text-sm mt-2">
            <span className="font-medium">Customer Name:</span>{" "}
            {payment.name}
          </p>
          <p className="text-gray-700 text-sm">
            <span className="font-medium">Amount:</span>{" "}
            <span className="text-green-600 font-semibold">
              ₱{payment.totalPrice}
            </span>
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-red-600 text-sm text-center mb-4">
            {error}
          </div>
        )}

        {/* Decision Buttons */}
        <div className="flex justify-between gap-4">
          <button
            onClick={() => handleDecision("rejected")}
            disabled={loading}
            className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-60"
          >
            {loading ? 'Processing...' : 'Reject'}
          </button>
          <button
            onClick={() => handleDecision("approved")}
            disabled={loading}
            className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-60"
          >
            {loading ? 'Processing...' : 'Approve'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentReviewModal;
