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
    maxWidth: '800px',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 50,
  },
};

const BookingDetailsModal = ({ selectedBooking, setSelectedBooking }) => {
  if (!selectedBooking) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'approved': return 'bg-green-100 text-green-800 border-green-300';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-300';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'approved': return '✅';
      case 'rejected': return '❌';
      case 'completed': return '🏁';
      case 'cancelled': return '🚫';
      default: return '📦';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPickupDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Define service options for display
  const serviceOptions = [
    { value: 'washDryFold', label: 'Wash, Dry & Fold' },
    { value: 'fullService', label: 'Full Service (Wash, Dry & Fold)' },
    { value: 'dryCleanBarong', label: 'Dry Cleaning - Barong' },
    { value: 'dryCleanCoat', label: 'Dry Cleaning - Coat' },
    { value: 'dryCleanGown', label: 'Dry Cleaning - Gown' },
    { value: 'dryCleanWeddingGown', label: 'Dry Cleaning - Wedding Gown' },
  ];

  const mainServices = [
    {
      id: 'fullService',
      name: 'Full Service (Wash, Dry & Fold)',
      price: 199,
      priceText: '₱199/load (Detergent, Fabcon, Colorsafe Bleach INCLUDED)'
    },
    {
      id: 'washDryFold',
      name: 'Wash, Dry & Fold',
      price: 179,
      priceText: '₱179/load (Bring your own detergent and fabcon)'
    }
  ];

  const dryCleaningServices = [
    {
      id: 'dryCleanBarong',
      name: 'Dry Cleaning - Barong',
      price: 350,
      priceText: '₱350 per item'
    },
    {
      id: 'dryCleanCoat',
      name: 'Dry Cleaning - Coat',
      price: 400,
      priceText: '₱400 per item'
    },
    {
      id: 'dryCleanGown',
      name: 'Dry Cleaning - Gown',
      price: 650,
      priceText: '₱650 per item'
    },
    {
      id: 'dryCleanWeddingGown',
      name: 'Dry Cleaning - Wedding Gown',
      price: 1500,
      priceText: '₱1,500 per item'
    },
  ];

  // Calculate service breakdown
  const getServiceBreakdown = () => {
    const breakdown = [];

    // Main service
    if (selectedBooking.mainService) {
      const mainService = mainServices.find(s => s.id === selectedBooking.mainService);
      if (mainService) {
        breakdown.push({
          name: mainService.name,
          quantity: selectedBooking.loadCount || 1,
          price: mainService.price,
          total: mainService.price * (selectedBooking.loadCount || 1)
        });
      }
    }

    // Dry cleaning services
    if (selectedBooking.dryCleaningServices && selectedBooking.dryCleaningServices.length > 0) {
      selectedBooking.dryCleaningServices.forEach(serviceId => {
        const service = dryCleaningServices.find(s => s.id === serviceId);
        if (service) {
          breakdown.push({
            name: service.name,
            quantity: 1,
            price: service.price,
            total: service.price
          });
        }
      });
    }

    return breakdown;
  };

  const serviceBreakdown = getServiceBreakdown();
  const deliveryFee = selectedBooking.serviceOption === 'pickupOnly' ? 0 : (selectedBooking.deliveryFee || 0);

  return (
    <Modal
      isOpen={!!selectedBooking}
      onRequestClose={() => setSelectedBooking(null)}
      style={customStyles}
      contentLabel="Booking Details"
    >
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Booking Details</h2>
          <button
            onClick={() => setSelectedBooking(null)}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Booking Header */}
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-lg font-bold text-gray-800">
                Booking #{selectedBooking.booking_id || selectedBooking.id}
              </h3>
              <p className="text-sm text-gray-600">
                Created: {formatDate(selectedBooking.createdAt || selectedBooking.created_at)}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-pink-600">
                ₱{selectedBooking.totalPrice?.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Price</div>
            </div>
          </div>

          {/* Current Status */}
          <div className="flex items-center justify-between">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedBooking.status)}`}>
              <span className="mr-2">{getStatusIcon(selectedBooking.status)}</span>
              {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
            </div>
            <div className="text-sm text-gray-600">
              Pickup: {formatPickupDate(selectedBooking.pickupDate)} at {selectedBooking.pickupTime}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Information */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Customer Information</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="text-gray-900">{selectedBooking.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact</label>
                <p className="text-gray-900">{selectedBooking.contact}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="text-gray-900">{selectedBooking.email || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <p className="text-gray-900">{selectedBooking.address}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                <p className="text-gray-900">
                  {selectedBooking.paymentMethod === 'cash' ? 'Cash on pickup' :
                   selectedBooking.paymentMethod === 'gcash' ? 'GCash' :
                   selectedBooking.paymentMethod === 'card' ? 'Credit/Debit Card' : 'Not specified'}
                </p>
              </div>
            </div>
          </div>

          {/* Service Information */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Service Information</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Service Option</label>
                <p className="text-gray-900">
                  {selectedBooking.serviceOption === 'pickupOnly' ? 'Pickup Only' :
                   selectedBooking.serviceOption === 'deliveryOnly' ? 'Delivery Only' :
                   'Pickup & Delivery'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Load Count</label>
                <p className="text-gray-900">{selectedBooking.loadCount || 1}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Instructions</label>
                <p className="text-gray-900">{selectedBooking.instructions || 'No special instructions'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Service Breakdown */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mt-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Service Breakdown</h4>
          <div className="space-y-3">
            {serviceBreakdown.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">₱{item.total.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">₱{item.price} each</p>
                </div>
              </div>
            ))}

            {/* Delivery Fee */}
            {deliveryFee > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">Delivery Fee</p>
                  <p className="text-sm text-gray-600">Based on your location</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">₱{deliveryFee}</p>
                </div>
              </div>
            )}

            {/* Total */}
            <div className="flex justify-between items-center py-3 border-t-2 border-gray-300">
              <p className="text-lg font-bold text-gray-900">Total Amount</p>
              <p className="text-lg font-bold text-pink-600">₱{selectedBooking.totalPrice?.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Rejection Reason */}
        {selectedBooking.status === 'rejected' && selectedBooking.rejectionReason && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6">
            <h4 className="text-lg font-semibold text-red-800 mb-2">Rejection Reason</h4>
            <p className="text-red-700">{selectedBooking.rejectionReason}</p>
          </div>
        )}

        {/* Status Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <h4 className="text-lg font-semibold text-blue-800 mb-2">Status Information</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <p><strong>Pending:</strong> Your booking is being reviewed by our team.</p>
            <p><strong>Approved:</strong> Your booking has been confirmed and is scheduled.</p>
            <p><strong>Rejected:</strong> Your booking was not approved. Check the rejection reason above.</p>
            <p><strong>Completed:</strong> Your laundry service has been completed.</p>
            <p><strong>Cancelled:</strong> Your booking has been cancelled.</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => setSelectedBooking(null)}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default BookingDetailsModal;
