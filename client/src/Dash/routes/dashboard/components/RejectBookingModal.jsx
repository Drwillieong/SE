import React from "react";
import Modal from "react-modal";

const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    padding: 0,
    border: 'none',
    borderRadius: '0.5rem',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 50,
  },
};

const RejectBookingModal = ({
  rejectModalIsOpen,
  closeRejectModal,
  bookingToReject,
  rejectionReason,
  setRejectionReason,
  confirmRejectBooking
}) => {
  return (
    <Modal
      isOpen={rejectModalIsOpen}
      onRequestClose={closeRejectModal}
      style={customStyles}
      contentLabel="Reject Booking"
    >
      <div className="p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl sm:text-2xl font-semibold">Reject Booking</h2>
          <button
            onClick={closeRejectModal}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ✕
          </button>
        </div>
        {bookingToReject && (
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to reject the booking for <strong>{bookingToReject.name}</strong>?
            </p>
          </div>
        )}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rejection Reason *
          </label>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            rows={4}
            placeholder="Please provide a reason for rejecting this booking..."
            required
          />
        </div>
        <div className="flex justify-end space-x-4">
          <button
            onClick={closeRejectModal}
            className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={confirmRejectBooking}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            Reject Booking
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default RejectBookingModal;
