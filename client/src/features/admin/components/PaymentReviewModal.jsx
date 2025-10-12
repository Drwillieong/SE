import React, { useState } from "react";

const PaymentReviewModal = ({ isOpen, onClose, payment, onDecision }) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !payment) return null;

  const handleDecision = (status) => {
    setLoading(true);
    onDecision(status, payment.id);
    setTimeout(() => {
      setLoading(false);
      onClose();
    }, 1000);
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
            src={payment.payment_proof}
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
            {payment.customer_name}
          </p>
          <p className="text-gray-700 text-sm">
            <span className="font-medium">Amount:</span>{" "}
            <span className="text-green-600 font-semibold">
              ₱{payment.amount}
            </span>
          </p>
        </div>

        {/* Decision Buttons */}
        <div className="flex justify-between gap-4">
          <button
            onClick={() => handleDecision("Rejected")}
            disabled={loading}
            className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-60"
          >
            Reject
          </button>
          <button
            onClick={() => handleDecision("Paid")}
            disabled={loading}
            className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-60"
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentReviewModal;
