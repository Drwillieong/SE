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

const DayBookingsModal = ({
  dayBookingsModalIsOpen,
  setDayBookingsModalIsOpen,
  selectedDayBookings,
  dayBookingsSortBy,
  setDayBookingsSortBy,
  setSelectedBooking,
  mainServices,
  dryCleaningServices
}) => {
  const sortedDayBookings = [...selectedDayBookings].sort((a, b) => {
    if (dayBookingsSortBy === 'pickupDate') {
      return new Date(a.pickupDate + ' ' + a.pickupTime) - new Date(b.pickupDate + ' ' + b.pickupTime);
    } else if (dayBookingsSortBy === 'address') {
      return a.address.localeCompare(b.address);
    }
    return 0;
  });

  return (
    <Modal
      isOpen={dayBookingsModalIsOpen}
      onRequestClose={() => setDayBookingsModalIsOpen(false)}
      style={customStyles}
      contentLabel="Day Bookings"
    >
      <div className="p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl sm:text-2xl font-semibold">
            Bookings for {selectedDayBookings.length > 0 ? new Date(selectedDayBookings[0].pickupDate).toLocaleDateString() : ''}
          </h2>
          <button
            onClick={() => setDayBookingsModalIsOpen(false)}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Sorting Options */}
        <div className="mb-4 flex gap-2">
          <label className="text-sm font-medium text-gray-700">Sort by:</label>
          <select
            value={dayBookingsSortBy}
            onChange={(e) => setDayBookingsSortBy(e.target.value)}
            className="text-sm border rounded px-2 py-1"
          >
            <option value="pickupDate">Pickup Date & Time</option>
            <option value="address">Address</option>
          </select>
        </div>

        {/* Bookings List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {sortedDayBookings.map((booking) => (
            <div key={booking.id} className="border p-3 rounded-lg bg-gray-50">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{booking.name}</h3>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Main Service:</span> {mainServices.find((s) => s.value === booking.mainService)?.label || booking.mainService}
                  </p>
                  {booking.dryCleaningServices && booking.dryCleaningServices.length > 0 && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Dry Cleaning Services:</span> {booking.dryCleaningServices.map(id => dryCleaningServices.find(s => s.id === id)?.name).filter(Boolean).join(', ')}
                    </p>
                  )}
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Time:</span> {booking.pickupTime}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Address:</span> {booking.address}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Loads:</span> {booking.loadCount} (₱{booking.totalPrice})
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedBooking(booking);
                    setDayBookingsModalIsOpen(false);
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={() => setDayBookingsModalIsOpen(false)}
            className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DayBookingsModal;

