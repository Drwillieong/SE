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

const BookingDetailsModal = ({ selectedBooking, setSelectedBooking, mainServices, dryCleaningServices }) => {
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
          {/* Total Price Section - Prominent Display */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-bold text-gray-800">Total Price</h3>
              <div className="text-2xl font-bold text-blue-600">
                ₱{selectedBooking.totalPrice?.toLocaleString() || '0'}
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Main Service:</span>
                <span className="font-medium">
                  {mainServices.find((s) => s.value === selectedBooking.mainService)?.label || selectedBooking.mainService}
                  (₱{(mainServices.find((s) => s.value === selectedBooking.mainService)?.price || 0) * (selectedBooking.loadCount || 1)})
                </span>
              </div>

              {selectedBooking.dryCleaningServices && selectedBooking.dryCleaningServices.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Dry Cleaning:</span>
                  <span className="font-medium">
                    {selectedBooking.dryCleaningServices.map(id => dryCleaningServices.find(s => s.id === id)?.name).filter(Boolean).join(', ')}
                    (₱{selectedBooking.dryCleaningServices.reduce((sum, serviceId) => {
                      const service = dryCleaningServices.find(s => s.id === serviceId);
                      return sum + (service ? service.price : 0);
                    }, 0)})
                  </span>
                </div>
              )}

              {selectedBooking.serviceOption !== 'pickupOnly' && selectedBooking.deliveryFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Fee:</span>
                  <span className="font-medium">₱{selectedBooking.deliveryFee}</span>
                </div>
              )}

              <div className="border-t border-blue-300 pt-1 mt-2">
                <div className="flex justify-between font-semibold">
                  <span>Service Option:</span>
                  <span>
                    {selectedBooking.serviceOption === 'pickupOnly' ? 'Pickup Only' :
                     selectedBooking.serviceOption === 'deliveryOnly' ? 'Delivery Only' : 'Pickup & Delivery'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p><span className="font-semibold">Customer:</span> {selectedBooking.name}</p>
            <p><span className="font-semibold">Contact:</span> {selectedBooking.contact}</p>
            <p><span className="font-semibold">Email:</span> {selectedBooking.email || "Not provided"}</p>
            <p><span className="font-semibold">Main Service:</span> {
              mainServices.find((s) => s.value === selectedBooking.mainService)?.label || selectedBooking.mainService
            } (₱{selectedBooking.totalPrice})</p>
            {selectedBooking.dryCleaningServices && selectedBooking.dryCleaningServices.length > 0 && (
              <p><span className="font-semibold">Dry Cleaning Services:</span> {
                selectedBooking.dryCleaningServices.map(id => dryCleaningServices.find(s => s.id === id)?.name).filter(Boolean).join(', ')
              }</p>
            )}
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
