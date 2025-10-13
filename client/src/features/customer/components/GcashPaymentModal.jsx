import React, { useState } from "react";
import QR from "../../../assets/ExampleQR.jpg";
const GcashPaymentModal = ({ isOpen, onClose, amount, orderId, onSubmit }) => {
  const [referenceNumber, setReferenceNumber] = useState("");
  const [proof, setProof] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!referenceNumber || !proof) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please log in again.');
        return;
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('referenceId', referenceNumber);
      formData.append('paymentProof', proof);

      const response = await fetch(`http://localhost:8800/api/orders/${orderId}/gcash-payment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        onSubmit(result);
        onClose();
        // Reset form
        setReferenceNumber("");
        setProof(null);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to submit payment proof');
      }
    } catch (error) {
      console.error('Error submitting payment:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>

        {/* Header */}
        <div className="text-center mb-4">
          <img
          
            alt="GCash"
            className="w-24 mx-auto mb-2"
          />
          <h2 className="text-xl font-semibold text-gray-800">
            Pay with GCash
          </h2>
          <p className="text-sm text-gray-500">
            Scan the QR code below to send your payment.
          </p>
        </div>

        {/* QR Code Section */}
        <div className="flex justify-center mb-4">
          <img
             src={QR}
            alt="GCash QR"
            className="w-48 h-48 border rounded-lg"
          />
        </div>

        {/* Account Info */}
        <div className="text-center mb-4">
          <p className="text-gray-700">
            <span className="font-medium">GCash Number:</span>{" "}
            <span className="text-blue-600 font-semibold">
              0917 123 4567
            </span>
          </p>
          <p className="text-gray-700">
            <span className="font-medium">Account Name:</span>{" "}
            <span className="font-semibold">Kayleen Jackie P. Bolado</span>
          </p>
          <p className="text-gray-700 mt-2">
            <span className="font-medium">Amount:</span>{" "}
            <span className="font-semibold text-green-600">
              ₱{amount}
            </span>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Reference Number */}
          <div>
            <label
              htmlFor="reference"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Enter GCash Reference Number
            </label>
            <input
              type="text"
              id="reference"
              className="w-full border rounded-lg px-3 py-2 focus:ring focus:ring-blue-200"
              placeholder="e.g., 123456789012"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
             
            />
          </div>

          {/* Upload Proof */}
          <div>
            <label
              htmlFor="proof"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Upload Proof of Payment
            </label>
            <input
              type="file"
              id="proof"
              accept="image/*"
              className="w-full text-sm text-gray-600"
              onChange={(e) => setProof(e.target.files[0])}
              required
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-red-600 text-sm text-center mb-2">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Submit Payment'}
          </button>
        </form>

        <p className="text-xs text-center text-gray-500 mt-3">
          Please make sure your reference number or screenshot is clear.
        </p>
      </div>
    </div>
  );
};

export default GcashPaymentModal;
