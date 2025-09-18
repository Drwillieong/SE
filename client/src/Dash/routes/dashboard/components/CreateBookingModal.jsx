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

const CreateBookingModal = ({
  modalIsOpen,
  closeModal,
  newBooking,
  handleNewBookingChange,
  handleCreateBooking,
  loading,
  photoFiles,
  photoPreviews,
  handlePhotoUpload,
  removePhoto,
  serviceTypes
}) => {
  return (
    <Modal
      isOpen={modalIsOpen}
      onRequestClose={closeModal}
      style={customStyles}
      contentLabel="Create New Booking"
    >
      <div className="p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl sm:text-2xl font-semibold">Create New Booking</h2>
          <button
            onClick={closeModal}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleCreateBooking} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
              <input
                type="text"
                name="name"
                value={newBooking.name}
                onChange={handleNewBookingChange}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number *</label>
              <input
                type="tel"
                name="contact"
                value={newBooking.contact}
                onChange={handleNewBookingChange}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={newBooking.email}
                onChange={handleNewBookingChange}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Type *</label>
              <select
                name="serviceType"
                value={newBooking.serviceType}
                onChange={handleNewBookingChange}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                required
              >
                {serviceTypes.map(service => (
                  <option key={service.value} value={service.value}>
                    {service.label} (₱{service.price}/load)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date *</label>
              <input
                type="date"
                name="pickupDate"
                value={newBooking.pickupDate}
                onChange={handleNewBookingChange}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Time *</label>
              <select
                name="pickupTime"
                value={newBooking.pickupTime}
                onChange={handleNewBookingChange}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
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
                value={newBooking.loadCount}
                onChange={handleNewBookingChange}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                required
                min="1"
                max="2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
              <select
                name="paymentMethod"
                value={newBooking.paymentMethod}
                onChange={handleNewBookingChange}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                required
              >
                <option value="cash">Cash on Pickup</option>
                <option value="gcash">GCash</option>
                <option value="card">Credit/Debit Card</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
            <input
              type="text"
              name="address"
              value={newBooking.address}
              onChange={handleNewBookingChange}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              required
            />
          </div>

          {/* Photo Upload Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload Photos of Laundry (Optional)
              <span className="text-xs text-gray-500 ml-1">Max 5 photos</span>
            </label>
            <div className="mt-1 flex items-center">
              <label className="cursor-pointer bg-white rounded-md font-medium text-pink-600 hover:text-pink-500 focus-within:outline-none">
                <span>Select photos</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="sr-only"
                />
              </label>
              <p className="text-xs text-gray-500 ml-2">
                {photoFiles.length} {photoFiles.length === 1 ? 'photo' : 'photos'} selected
              </p>
            </div>

            {/* Photo Previews */}
            {photoPreviews.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {photoPreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <img
                      src={preview}
                      alt={`Laundry preview ${index + 1}`}
                      className="h-20 w-20 object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
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
              value={newBooking.instructions}
              onChange={handleNewBookingChange}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              rows={3}
            />
          </div>
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={closeModal}
              className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Booking'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default CreateBookingModal;
