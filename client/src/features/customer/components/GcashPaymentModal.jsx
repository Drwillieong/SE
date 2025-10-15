import React, { useState } from "react";
import QR from "../../../assets/ExampleQR.jpg";

const GcashPaymentModal = ({ isOpen, onClose, amount, orderId, onSubmit }) => {
  const [loading, setLoading] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [proof, setProof] = useState(null);

  const toBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!referenceNumber && !proof) {
      alert('Please provide either a reference number or a payment proof.');
      return;
    }

    setLoading(true);

    try {
      const proofBase64 = proof ? await toBase64(proof) : null;
      const paymentData = {
        referenceNumber,
        proof: proofBase64,
      };

      await onSubmit(paymentData, orderId);
      onClose();
      alert('Payment submitted successfully! Please wait for admin approval.');
    } catch (error) {
      console.error('Error submitting payment:', error);
      alert('Failed to submit payment. Please try again.');
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reference Number
            </label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter GCash reference number"
            />
          </div>

          {/* Payment Proof */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Proof (Screenshot)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setProof(e.target.files[0])}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Please provide either a Reference Number or a Payment Proof.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Send Payment Notification'}
          </button>
        </form>

        <p className="text-xs text-center text-gray-500 mt-3">
          Click to notify admin that payment has been sent.
        </p>
      </div>
    </div>
  );
};

export default GcashPaymentModal;
