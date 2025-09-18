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

const BookingDetailsModal = ({ selectedBooking, setSelectedBooking, serviceTypes }) => {
  return (
    <Modal
      isOpen={!!selectedBooking}
      onRequestClose={() => setSelectedBooking(null)}
      style={customStyles}
      contentLabel="Booking Details"
    >
      {selectedBooking && (
        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl sm:text-2xl font-semibold">Booking Details</h2>
            <button
              onClick={() => setSelectedBooking(null)}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ✕
            </button>
          </div>
          <div className="space-y-3">
            <p><span className="font-semibold">Customer:</span> {selectedBooking.name}</p>
            <p><span className="font-semibold">Contact:</span> {selectedBooking.contact}</p>
            <p><span className="font-semibold">Email:</span> {selectedBooking.email || "Not provided"}</p>
            <p><span className="font-semibold">Service Type:</span> {
              serviceTypes.find((s) => s.value === selectedBooking.serviceType)?.label || selectedBooking.serviceType
            } (₱{selectedBooking.totalPrice})</p>
            <p><span className="font-semibold">Pickup Date:</span> {selectedBooking.pickupDate}</p>
            <p><span className="font-semibold">Pickup Time:</span> {selectedBooking.pickupTime}</p>
            <p><span className="font-semibold">Address:</span> {selectedBooking.address}</p>
            <p><span className="font-semibold">Load Count:</span> {selectedBooking.loadCount}</p>
            <p><span className="font-semibold">Payment Method:</span> {
              selectedBooking.paymentMethod === 'cash' ? 'Cash on pickup' :
              selectedBooking.paymentMethod === 'gcash' ? 'GCash' :
              selectedBooking.paymentMethod === 'card' ? 'Credit/Debit Card' : 'Not specified'
            }</p>

            {selectedBooking.instructions && (
              <p><span className="font-semibold">Instructions:</span> {selectedBooking.instructions}</p>
            )}
            {selectedBooking.photos && selectedBooking.photos.length > 0 && (
              <div>
                <p className="font-semibold">Item Photos:</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedBooking.photos.map((photo, index) => (
                    <a
                      key={index}
                      href={photo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img
                        src={photo}
                        alt={`Laundry item ${index + 1}`}
                        className="h-16 w-16 object-cover rounded border"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}
            <p>
              <span className="font-semibold">Status:</span>
              <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                selectedBooking.status === 'pending' ? 'bg-yellow-200 text-yellow-800' :
                selectedBooking.status === 'approved' ? 'bg-green-200 text-green-800' :
                'bg-red-200 text-red-800'
              }`}>
                {selectedBooking.status}
              </span>
            </p>
            {selectedBooking.status === 'rejected' && selectedBooking.rejectionReason && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="font-semibold text-red-800">Rejection Reason:</p>
                <p className="text-red-700 mt-1">{selectedBooking.rejectionReason}</p>
              </div>
            )}
            <p><span className="font-semibold">Created At:</span> {
              selectedBooking.createdAt?.toLocaleString() || 'N/A'
            }</p>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setSelectedBooking(null)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default BookingDetailsModal;
