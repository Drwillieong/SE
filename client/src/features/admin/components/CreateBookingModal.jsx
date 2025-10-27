import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import apiClient from "../../../utils/axios";
import { calculateDeliveryFee, getDeliveryFeeInfo } from "../../../utils/deliveryFeeCalculator";

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
    maxWidth: '700px',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 50,
  },
};

// Define free pickup barangays and their fees
const freePickupBarangays = [
  "Brgy. 1", "Brgy. 2", "Brgy. 3", "Brgy. 4", "Brgy. 5", "Brgy. 6", "Brgy. 7",
  "Lecheria (Up to City Cemetery)", "San Juan", "San Jose",
  "Looc (Bukana, Mahogany, Vermont)", "Bañadero (Bukana, Bria Homes)",
  "Palingon", "Lingga", "Sampiruhan", "Parian (Bantayan/Villa Carpio)"
];

const calambaBarangays = [
  "Banlic", "Barandal", "Batino", "Bubuyan", "Bucal", "Bunggo",
  "Burol", "Camaligan", "Canlubang", "Halang", "Hornalan",
  "Kay-Anlog", "La Mesa", "Laguerta", "Lawa", "Lecheria",
  "Lingga", "Looc", "Mabato", "Majada Labas", "Makiling",
  "Mapagong", "Masili", "Maunong", "Mayapa", "Paciano Rizal",
  "Palingon", "Palo-Alto", "Pansol", "Parian", "Prinza",
  "Punta", "Puting Lupa", "Real", "Saimsim", "Sampiruhan",
  "San Cristobal", "San Jose", "San Juan", "Sirang Lupa",
  "Sucol", "Turbina", "Ulango", "Uwisan"
];

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
  mainServices,
  dryCleaningServices
}) => {
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [serviceOption, setServiceOption] = useState('pickupAndDelivery');
  const [showServiceOption, setShowServiceOption] = useState(true);
  const [bookingCount, setBookingCount] = useState(0);
  const [barangay, setBarangay] = useState('');
  const [street, setStreet] = useState('');
  const [blockLot, setBlockLot] = useState('');

  // Calculate delivery fee when address or load count changes
  useEffect(() => {
    if (newBooking.address && newBooking.loadCount) {
      // Extract barangay from address (simple extraction - you might want to improve this)
      const addressParts = newBooking.address.split(',').map(part => part.trim());
      const barangay = addressParts.find(part =>
        part.toLowerCase().includes('brgy') ||
        part.toLowerCase().includes('barangay') ||
        addressParts.indexOf(part) === addressParts.length - 2 // Usually barangay is second to last
      ) || '';

      const fee = calculateDeliveryFee(barangay, parseInt(newBooking.loadCount) || 1);
      setDeliveryFee(fee);
    }
  }, [newBooking.address, newBooking.loadCount]);

  // Fetch booking count when pickup date changes
  useEffect(() => {
    const fetchBookingCount = async () => {
      if (newBooking.pickupDate) {
        try {
          const response = await apiClient.post('/api/bookings/counts', {
            dates: [newBooking.pickupDate]
          });
          setBookingCount(response.data[newBooking.pickupDate] || 0);
        } catch (error) {
          console.error('Error fetching booking count:', error);
          setBookingCount(0);
        }
      }
    };
    fetchBookingCount();
  }, [newBooking.pickupDate]);

  const handleServiceOptionChange = (option) => {
    setServiceOption(option);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Warn if date is full (3 bookings)
    if (bookingCount >= 3) {
      const proceed = window.confirm(`Warning: This date already has ${bookingCount} bookings (limit is 3). Are you sure you want to proceed?`);
      if (!proceed) return;
    }

    handleCreateBooking(e, {
      ...newBooking,
      deliveryFee: serviceOption === 'pickupAndDelivery' ? deliveryFee : 0,
    });
  };

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
        <form onSubmit={handleSubmit} className="space-y-4">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Barangay *</label>
              <select
                name="barangay"
                value={barangay}
                onChange={(e) => {
                  setBarangay(e.target.value);
                  // Update the address in newBooking
                  const address = `${street || ''}${blockLot ? `, Block ${blockLot}` : ''}, ${e.target.value || ''}, Calamba City`;
                  handleNewBookingChange({ target: { name: 'address', value: address } });
                }}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                required
              >
                <option value="">Select Barangay</option>
                {calambaBarangays.map(brgy => (
                  <option key={brgy} value={brgy}>{brgy}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Street *</label>
              <input
                type="text"
                name="street"
                value={street}
                onChange={(e) => {
                  setStreet(e.target.value);
                  // Update the address in newBooking
                  const address = `${e.target.value || ''}${blockLot ? `, Block ${blockLot}` : ''}, ${barangay || ''}, Calamba City`;
                  handleNewBookingChange({ target: { name: 'address', value: address } });
                }}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                placeholder="e.g. Rizal Street"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Block/Lot Number (Optional)</label>
              <input
                type="text"
                name="blockLot"
                value={blockLot}
                onChange={(e) => {
                  setBlockLot(e.target.value);
                  // Update the address in newBooking
                  const address = `${street || ''}${e.target.value ? `, Block ${e.target.value}` : ''}, ${barangay || ''}, Calamba City`;
                  handleNewBookingChange({ target: { name: 'address', value: address } });
                }}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                placeholder="e.g. Block 5 Lot 12"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Main Service *</label>
              <select
                name="mainService"
                value={newBooking.mainService}
                onChange={handleNewBookingChange}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
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
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {dryCleaningServices.map(service => (
                  <div key={service.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={service.id}
                      checked={newBooking.dryCleaningServices.includes(service.id)}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        const updatedServices = isChecked
                          ? [...newBooking.dryCleaningServices, service.id]
                          : newBooking.dryCleaningServices.filter(id => id !== service.id);
                        handleNewBookingChange({
                          target: { name: 'dryCleaningServices', value: updatedServices }
                        });
                      }}
                      className="mr-2"
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
                max="5"
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

          {/* Service Option Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Service Option *</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  handleServiceOptionChange('pickupOnly');
                  handleNewBookingChange({ target: { name: 'serviceOption', value: 'pickupOnly' } });
                }}
                className={`p-4 border rounded-lg text-center ${serviceOption === 'pickupOnly' ? 'border-pink-500 bg-pink-50' : 'border-gray-200'}`}
              >
                <h3 className="font-medium">Pickup Only</h3>
                <p className="text-sm text-gray-600">We'll pick up your laundry and you'll collect it at our location</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleServiceOptionChange('pickupAndDelivery');
                  handleNewBookingChange({ target: { name: 'serviceOption', value: 'pickupAndDelivery' } });
                }}
                className={`p-4 border rounded-lg text-center ${serviceOption === 'pickupAndDelivery' ? 'border-pink-500 bg-pink-50' : 'border-gray-200'}`}
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
              onChange={handlePhotoUpload}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            />
            {photoPreviews.length > 0 && (
              <div className="mt-2 grid grid-cols-3 gap-2">
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
