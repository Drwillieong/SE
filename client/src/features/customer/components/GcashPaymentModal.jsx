import React, { useState } from "react";

const GcashPaymentModal = ({ isOpen, onClose, amount, onSubmit }) => {
  const [referenceNumber, setReferenceNumber] = useState("");
  const [proof, setProof] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!referenceNumber || !proof) {
      alert("Please fill in all fields.");
      return;
    }

    const paymentData = {
      referenceNumber,
      proof,
      amount,
    };

    onSubmit(paymentData);
    onClose();
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
            src="/gcash-logo.png"
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
            src="/gcash-qr.png"
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
            <span className="font-semibold">Juan Dela Cruz</span>
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
              required
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

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Submit Payment
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
