import React, { useState, useEffect } from "react";
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

const OrderDetailsModal = ({ selectedOrder, setSelectedOrder, updateOrderStatus, serviceOptions, onCompleteOrder }) => {
  if (!selectedOrder) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'washing': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'drying': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'folding': return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'ready': return 'bg-green-100 text-green-800 border-green-300';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'washing': return '💧';
      case 'drying': return '🌬️';
      case 'folding': return '👔';
      case 'ready': return '✅';
      case 'completed': return '🏁';
      default: return '📦';
    }
  };

  const getNextStatus = (currentStatus) => {
    const statusFlow = ['pending', 'washing', 'drying', 'folding', 'ready', 'completed'];
    const currentIndex = statusFlow.indexOf(currentStatus);
    return currentIndex < statusFlow.length - 1 ? statusFlow[currentIndex + 1] : null;
  };

  const handleStatusUpdate = async (newStatus) => {
    if (window.confirm(`Are you sure you want to change the status to "${newStatus}"?`)) {
      await updateOrderStatus(selectedOrder.order_id, newStatus);
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

  const renderStatusButtons = () => {
    const currentStatus = selectedOrder.status;
    const nextStatus = getNextStatus(currentStatus);

    return (
      <div className="flex flex-wrap gap-2">
        {nextStatus && (
          <button
            onClick={() => handleStatusUpdate(nextStatus)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors"
          >
            Mark as {nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}
          </button>
        )}

        {/* Quick status buttons for common transitions */}
        {currentStatus === 'pending' && (
          <button
            onClick={() => handleStatusUpdate('washing')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors"
          >
            Start Washing
          </button>
        )}

        {currentStatus === 'washing' && (
          <button
            onClick={() => handleStatusUpdate('drying')}
            className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm transition-colors"
          >
            Start Drying
          </button>
        )}

        {currentStatus === 'drying' && (
          <button
            onClick={() => handleStatusUpdate('folding')}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1 rounded text-sm transition-colors"
          >
            Start Folding
          </button>
        )}

        {currentStatus === 'folding' && (
          <button
            onClick={() => handleStatusUpdate('ready')}
            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors"
          >
            Mark Ready
          </button>
        )}

        {currentStatus === 'ready' && (
          <button
            onClick={() => handleStatusUpdate('completed')}
            className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
          >
            Complete Order
          </button>
        )}

        {/* Complete Order Button - available for any status except completed */}
        {currentStatus !== 'completed' && onCompleteOrder && (
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to complete this order? This will move it to history.')) {
                onCompleteOrder(selectedOrder.order_id);
              }
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors font-medium"
          >
            Complete Order
          </button>
        )}
      </div>
    );
  };

  return (
    <Modal
      key={selectedOrder?.order_id || 'no-order'}
      isOpen={!!selectedOrder}
      onRequestClose={() => setSelectedOrder(null)}
      style={customStyles}
      contentLabel="Order Details"
    >
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Order Details</h2>
          <button
            onClick={() => setSelectedOrder(null)}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Order Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Order #{selectedOrder.order_id}</h3>
              <p className="text-sm text-gray-600">Created: {formatDate(selectedOrder.createdAt)}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                ₱{selectedOrder.totalPrice?.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Price</div>
            </div>
          </div>

          {/* Current Status */}
          <div className="flex items-center justify-between">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedOrder.status)}`}>
              <span className="mr-2">{getStatusIcon(selectedOrder.status)}</span>
              {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
            </div>
            <div className="text-sm text-gray-600">
              Pickup: {selectedOrder.pickupDate} at {selectedOrder.pickupTime}
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
                <p className="text-gray-900">{selectedOrder.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact</label>
                <p className="text-gray-900">{selectedOrder.contact}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="text-gray-900">{selectedOrder.email || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <p className="text-gray-900">{selectedOrder.address}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                <p className="text-gray-900">
                  {selectedOrder.paymentMethod === 'cash' ? 'Cash on pickup' :
                   selectedOrder.paymentMethod === 'gcash' ? 'GCash' :
                   selectedOrder.paymentMethod === 'card' ? 'Credit/Debit Card' : 'Not specified'}
                </p>
              </div>
            </div>
          </div>

          {/* Service Information */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Service Information</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Service Type</label>
                <p className="text-gray-900">
                  {serviceOptions.find(s => s.value === selectedOrder.serviceType)?.label || selectedOrder.serviceType}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Load Count</label>
                <p className="text-gray-900">{selectedOrder.loadCount}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Instructions</label>
                <p className="text-gray-900">{selectedOrder.instructions || 'No special instructions'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Laundry Details */}
        {selectedOrder.estimatedClothes || selectedOrder.kilos || selectedOrder.pants || selectedOrder.shorts || selectedOrder.tshirts || selectedOrder.bedsheets ? (
          <div className="bg-white border border-gray-200 rounded-lg p-4 mt-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Laundry Details</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {selectedOrder.estimatedClothes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estimated Clothes</label>
                  <p className="text-gray-900">{selectedOrder.estimatedClothes} items</p>
                </div>
              )}
              {selectedOrder.kilos && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Weight</label>
                  <p className="text-gray-900">{selectedOrder.kilos} kg</p>
                </div>
              )}
              {selectedOrder.pants && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Pants</label>
                  <p className="text-gray-900">{selectedOrder.pants}</p>
                </div>
              )}
              {selectedOrder.shorts && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Shorts</label>
                  <p className="text-gray-900">{selectedOrder.shorts}</p>
                </div>
              )}
              {selectedOrder.tshirts && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">T-Shirts</label>
                  <p className="text-gray-900">{selectedOrder.tshirts}</p>
                </div>
              )}
              {selectedOrder.bedsheets && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bedsheets</label>
                  <p className="text-gray-900">{selectedOrder.bedsheets}</p>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* Photos */}
        {selectedOrder.photos && selectedOrder.photos.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 mt-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Item Photos</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {selectedOrder.photos.map((photo, index) => (
                <div key={index} className="relative">
                  <img
                    src={photo}
                    alt={`Item ${index + 1}`}
                    className="w-full h-24 object-cover rounded border"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Laundry Photos */}
        {selectedOrder.laundryPhoto && selectedOrder.laundryPhoto.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 mt-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Laundry Photos</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {selectedOrder.laundryPhoto.map((photo, index) => (
                <div key={index} className="relative">
                  <img
                    src={photo}
                    alt={`Laundry ${index + 1}`}
                    className="w-full h-24 object-cover rounded border"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Management */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mt-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Status Management</h4>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Status</label>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedOrder.status)}`}>
                <span className="mr-2">{getStatusIcon(selectedOrder.status)}</span>
                {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
              </div>
            </div>

            {selectedOrder.status !== 'completed' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quick Actions</label>
                {renderStatusButtons()}
              </div>
            )}

            {/* Status Progress Indicator */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Progress</label>
              <div className="flex items-center space-x-2">
                {['pending', 'washing', 'drying', 'folding', 'ready', 'completed'].map((status, index) => (
                  <React.Fragment key={status}>
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium ${
                      ['pending', 'washing', 'drying', 'folding', 'ready', 'completed'].indexOf(selectedOrder.status) >= index
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {getStatusIcon(status)}
                    </div>
                    {index < 5 && (
                      <div className={`h-0.5 w-8 ${
                        ['pending', 'washing', 'drying', 'folding', 'ready', 'completed'].indexOf(selectedOrder.status) > index
                          ? 'bg-blue-500'
                          : 'bg-gray-200'
                      }`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => setSelectedOrder(null)}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default OrderDetailsModal;
