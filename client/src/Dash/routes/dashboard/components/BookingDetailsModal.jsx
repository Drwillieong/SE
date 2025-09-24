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

const BookingDetailsModal = ({ selectedItem, setSelectedItem, onRestore, onDelete, loading, mainServices, dryCleaningServices }) => {
  if (!selectedItem) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'deleted':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'order':
        return '📦';
      case 'booking':
        return '📅';
      default:
        return '📋';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined) return 'N/A';
    return `₱${Number(price).toLocaleString()}`;
  };

  return (
    <Modal
      isOpen={!!selectedItem}
      onRequestClose={() => setSelectedItem(null)}
      style={customStyles}
      contentLabel="History Item Details"
    >
      <div className="p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
            <span>{getTypeIcon(selectedItem.type)}</span>
            {selectedItem.type === 'order' ? 'Order' : 'Booking'} Details
          </h2>
          <button
            onClick={() => setSelectedItem(null)}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ✕
          </button>
        </div>

        {/* History Status Banner */}
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-800">History Item</h3>
              <p className="text-sm text-gray-600">
                Moved to history on: {formatDate(selectedItem.moved_to_history_at || selectedItem.deleted_at)}
              </p>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedItem.status)}`}>
              {selectedItem.status?.charAt(0).toUpperCase() + selectedItem.status?.slice(1) || 'Unknown'}
            </span>
          </div>
        </div>

        {/* Price Section */}
        {selectedItem.totalPrice && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-bold text-gray-800">Total Price</h3>
              <div className="text-2xl font-bold text-blue-600">
                {formatPrice(selectedItem.totalPrice)}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <p><span className="font-semibold">Customer:</span> {selectedItem.name || 'N/A'}</p>
          {selectedItem.contact && (
            <p><span className="font-semibold">Contact:</span> {selectedItem.contact}</p>
          )}
          {selectedItem.email && (
            <p><span className="font-semibold">Email:</span> {selectedItem.email}</p>
          )}

          <p><span className="font-semibold">Service:</span> {
            mainServices?.find((s) => s.value === selectedItem.mainService)?.label ||
            selectedItem.mainService ||
            selectedItem.serviceType ||
            'N/A'
          }</p>

          {selectedItem.loadCount && (
            <p><span className="font-semibold">Load Count:</span> {selectedItem.loadCount}</p>
          )}

          {selectedItem.pickupDate && (
            <p><span className="font-semibold">Pickup Date:</span> {selectedItem.pickupDate}</p>
          )}

          {selectedItem.pickupTime && (
            <p><span className="font-semibold">Pickup Time:</span> {selectedItem.pickupTime}</p>
          )}

          {selectedItem.address && (
            <p><span className="font-semibold">Address:</span> {selectedItem.address}</p>
          )}

          {selectedItem.paymentMethod && (
            <p><span className="font-semibold">Payment Method:</span> {
              selectedItem.paymentMethod === 'cash' ? 'Cash on pickup' :
              selectedItem.paymentMethod === 'gcash' ? 'GCash' :
              selectedItem.paymentMethod === 'card' ? 'Credit/Debit Card' : selectedItem.paymentMethod
            }</p>
          )}

          {selectedItem.instructions && (
            <p><span className="font-semibold">Instructions:</span> {selectedItem.instructions}</p>
          )}

          {selectedItem.rejectionReason && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="font-semibold text-red-800">Rejection Reason:</p>
              <p className="text-red-700 mt-1">{selectedItem.rejectionReason}</p>
            </div>
          )}

          <p><span className="font-semibold">Created At:</span> {formatDate(selectedItem.createdAt)}</p>

          {selectedItem.photos && selectedItem.photos.length > 0 && (
            <div>
              <p className="font-semibold">Item Photos:</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedItem.photos.map((photo, index) => (
                  <a
                    key={index}
                    href={photo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <img
                      src={photo}
                      alt={`Item ${index + 1}`}
                      className="h-16 w-16 object-cover rounded border"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-between gap-3">
          <div className="flex gap-2">
            <button
              onClick={() => onRestore && onRestore(selectedItem.id, selectedItem.type)}
              disabled={loading}
              className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-4 py-2 rounded-md transition-colors"
            >
              {loading ? 'Restoring...' : 'Restore'}
            </button>
            <button
              onClick={() => onDelete && onDelete(selectedItem.id, selectedItem.type)}
              disabled={loading}
              className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white px-4 py-2 rounded-md transition-colors"
            >
              {loading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
          <button
            onClick={() => setSelectedItem(null)}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default BookingDetailsModal;
