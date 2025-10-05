import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import { calculateDeliveryFee } from "../../../../../utils/deliveryFeeCalculator";

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
    borderRadius: '0.75rem',
    width: '90%',
    maxWidth: '700px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 50,
  },
};

const EditBookingModal = ({
  modalIsOpen,
  closeModal,
  editBooking,
  handleEditBookingChange,
  handleUpdateBooking,
  updatingBooking,
  editPhotoFiles,
  editPhotoPreviews,
  handleEditPhotoUpload,
  removeEditPhoto,
  mainServices,
  dryCleaningServices
}) => {
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [serviceOption, setServiceOption] = useState('pickupAndDelivery');

  // Calculate delivery fee when address or load count changes
  useEffect(() => {
    if (editBooking.address && editBooking.loadCount) {
      const addressParts = editBooking.address.split(',').map(part => part.trim());
      const barangay = addressParts.find(part =>
        part.toLowerCase().includes('brgy') ||
        part.toLowerCase().includes('barangay') ||
        addressParts.indexOf(part) === addressParts.length - 2
      ) || '';

      const fee = calculateDeliveryFee(barangay, parseInt(editBooking.loadCount) || 1);
      setDeliveryFee(fee);
    }
  }, [editBooking.address, editBooking.loadCount]);

  // Set service option from editBooking
  useEffect(() => {
    if (editBooking.serviceOption) {
      setServiceOption(editBooking.serviceOption);
    }
  }, [editBooking.serviceOption]);

  const handleServiceOptionChange = (option) => {
    setServiceOption(option);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Add service option and delivery fee to the booking data
    const bookingWithServiceOption = {
      ...editBooking,
      serviceOption: serviceOption,
      deliveryFee: serviceOption === 'pickupOnly' ? 0 : deliveryFee
    };

    handleUpdateBooking(e, bookingWithServiceOption);
  };

  return (
    <Modal
      isOpen={modalIsOpen}
      onRequestClose={closeModal}
      style={customStyles}
      contentLabel="Edit Booking"
    >
      <div className="p-4 sm:p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Edit Booking</h2>
          <button
            onClick={closeModal}
            className="text-gray-500 hover:text-gray-700 text-xl transition-colors"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
              <input
                type="text"
                name="name"
                value={editBooking.name}
                onChange={handleEditBookingChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number *</label>
              <input
                type="tel"
                name="contact"
                value={editBooking.contact}
                onChange={handleEditBookingChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={editBooking.email}
                onChange={handleEditBookingChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Main Service *</label>
              <select
                name="mainService"
                value={editBooking.mainService}
                onChange={handleEditBookingChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
              >
                {mainServices.map(service => (
                  <option key={service.value} value={service.value}>
                    {service.label} (₱{service.price}/load)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dry Cleaning Services (Optional)</label>
              <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
                {dryCleaningServices.map(service => (
                  <div key={service.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={service.id}
                      checked={editBooking.dryCleaningServices.includes(service.id)}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        const updatedServices = isChecked
                          ? [...editBooking.dryCleaningServices, service.id]
                          : editBooking.dryCleaningServices.filter(id => id !== service.id);
                        handleEditBookingChange({
                          target: { name: 'dryCleaningServices', value: updatedServices }
                        });
                      }}
                      className="mr-2 text-blue-600"
                    />
                    <label htmlFor={service.id} className="text-sm">
                      {service.name} (₱{service.price})
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date *</label>
              <input
                type="date"
                name="pickupDate"
                value={editBooking.pickupDate}
                onChange={handleEditBookingChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Time *</label>
              <select
                name="pickupTime"
                value={editBooking.pickupTime}
                onChange={handleEditBookingChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
              >
                <option value="7am-10am">Morning (7am-10am)</option>
                <option value="5pm-7pm">Afternoon (5pm-7pm)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Number of Loads *</label>
              <input
                type="number"
                name="loadCount"
                value={editBooking.loadCount}
                onChange={handleEditBookingChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
                min="1"
                max="5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
              <select
                name="paymentMethod"
                value={editBooking.paymentMethod}
                onChange={handleEditBookingChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
              >
                <option value="cash">Cash on Pickup</option>
                <option value="gcash">GCash</option>
                <option value="card">Credit/Debit Card</option>
              </select>
            </div>
          </div>

          {/* Service Option Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Service Option *</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleServiceOptionChange('pickupOnly')}
                className={`p-4 border-2 rounded-lg text-center transition-all ${
                  serviceOption === 'pickupOnly'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <h3 className="font-medium">Pickup Only</h3>
                <p className="text-sm text-gray-600">We'll pick up your laundry and you'll collect it at our location</p>
              </button>

              <button
                type="button"
                onClick={() => handleServiceOptionChange('pickupAndDelivery')}
                className={`p-4 border-2 rounded-lg text-center transition-all ${
                  serviceOption === 'pickupAndDelivery'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <h3 className="font-medium">Pickup & Delivery</h3>
                <p className="text-sm text-gray-600">We'll pick up your laundry and deliver it back to you</p>
              </button>
            </div>
          </div>

          {/* Photo Upload Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Photos (Optional)</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleEditPhotoUpload}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            {editPhotoPreviews.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-3">
                {editPhotoPreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Laundry preview ${index + 1}`}
                      className="h-20 w-20 object-cover rounded-lg border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeEditPhoto(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
            <textarea
              name="instructions"
              value={editBooking.instructions}
              onChange={handleEditBookingChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={closeModal}
              className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-lg transition-colors shadow-md hover:shadow-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updatingBooking}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updatingBooking ? 'Updating...' : 'Update Booking'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default EditBookingModal;
