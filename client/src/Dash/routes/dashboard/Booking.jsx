import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import Modal from 'react-modal';

// Initialize calendar localizer
const localizer = momentLocalizer(moment);

// Set modal styles
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

Modal.setAppElement('#root');

// Service type options - matches customer side
const serviceTypes = [
  { value: "washFold", label: "Wash & Fold", price: 189 },
  { value: "dryCleaning", label: "Dry Cleaning", price: 250 },
  { value: "hangDry", label: "Hang Dry", price: 220 }
];

const Booking = () => {
  const navigate = useNavigate();
  const [pendingBookings, setPendingBookings] = useState([]);
  const [approvedBookings, setApprovedBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [calendarView, setCalendarView] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rejectModalIsOpen, setRejectModalIsOpen] = useState(false);
  const [bookingToReject, setBookingToReject] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedDayBookings, setSelectedDayBookings] = useState([]);
  const [dayBookingsModalIsOpen, setDayBookingsModalIsOpen] = useState(false);
  const [dayBookingsSortBy, setDayBookingsSortBy] = useState('pickupDate');
  const [newBooking, setNewBooking] = useState({
    serviceType: "washFold",
    pickupDate: "",
    pickupTime: "7am-10am",
    loadCount: 1,
    instructions: "",
    status: "approved",
    paymentMethod: "cash",
    name: "",
    contact: "",
    email: "",
    address: ""
  });
  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    console.log('Starting fetchBookings...');
    try {
      const token = localStorage.getItem('token');
      console.log('Token present:', !!token);
      if (!token) {
        console.log('No token, navigating to login');
        setError('No authentication token found. Please log in again.');
        navigate('/login');
        return;
      }

      console.log('Making fetch request to /api/admin/bookings');
      const response = await fetch('http://localhost:8800/api/admin/bookings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('Response received, status:', response.status);

      if (response.ok) {
        const orders = await response.json();
        console.log('Orders received:', orders.length);
        const pendingData = orders.filter((order) => order.status === 'pending');
        const approvedData = orders.filter((order) => order.status === 'approved');

        console.log('Pending bookings:', pendingData.length, 'Approved bookings:', approvedData.length);
        setPendingBookings(pendingData.map((order) => formatBookingData(order.id, order)));
        setApprovedBookings(approvedData.map((order) => formatBookingData(order.id, order)));
        setError(null); // Clear any previous errors
      } else {
        console.error('Failed to fetch bookings, status:', response.status);
        if (response.status === 403) {
          setError('Admin access required. Please log in as an administrator.');
          navigate('/login');
        } else if (response.status === 401) {
          setError('Session expired. Please log in again.');
          navigate('/login');
        } else {
          setError('Failed to load bookings. Please try again later.');
        }
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      if (error.name === 'AbortError') {
        setError('Request timed out. Please check if the server is running and try again.');
      } else {
        setError('Network error. Please check your connection and try again.');
      }
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  const formatBookingData = (id, data) => {
    // Parse photos from JSON string to array if it's a string
    let photos = [];
    if (data.photos) {
      if (typeof data.photos === 'string') {
        try {
          photos = JSON.parse(data.photos);
        } catch (e) {
          photos = [];
        }
      } else if (Array.isArray(data.photos)) {
        photos = data.photos;
      }
    }

    return {
      id,
      name: data.name || "No Name",
      contact: data.contact || "No Contact",
      email: data.email || "No Email",
      address: data.address || "No Address",
      pickupDate: data.pickupDate,
      pickupTime: data.pickupTime,
      loadCount: data.loadCount || 1,
      instructions: data.instructions || "No Instructions",
      serviceType: data.serviceType || "washFold",
      status: data.status,
      createdAt: data.createdAt,
      paymentMethod: data.paymentMethod || "cash",
      photos: photos,
      totalPrice: data.totalPrice || (serviceTypes.find(s => s.value === (data.serviceType || "washFold"))?.price || 0) * (data.loadCount || 1)
    };
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + photoFiles.length > 5) {
      alert('You can upload a maximum of 5 photos');
      return;
    }
    
    setPhotoFiles([...photoFiles, ...files]);
    
    // Create previews
    const newPreviews = [];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push(e.target.result);
        if (newPreviews.length === files.length) {
          setPhotoPreviews([...photoPreviews, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index) => {
    const newFiles = [...photoFiles];
    const newPreviews = [...photoPreviews];
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    setPhotoFiles(newFiles);
    setPhotoPreviews(newPreviews);
  };

  const handleApproveBooking = async (bookingId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8800/api/admin/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: "approved" }),
      });

      if (response.ok) {
        alert("Booking approved successfully!");
        fetchBookings(); // Refresh the bookings
      } else {
        alert("Failed to approve booking");
      }
    } catch (error) {
      console.error("Error approving booking:", error);
      alert("Failed to approve booking");
    }
  };

  const handleRejectBooking = (booking) => {
    setBookingToReject(booking);
    setRejectModalIsOpen(true);
  };

  const confirmRejectBooking = async () => {
    if (!bookingToReject || !rejectionReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8800/api/admin/bookings/${bookingToReject.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: "rejected", rejectionReason: rejectionReason.trim() }),
      });

      if (response.ok) {
        alert("Booking rejected successfully!");
        fetchBookings(); // Refresh the bookings
        closeRejectModal();
      } else {
        alert("Failed to reject booking");
      }
    } catch (error) {
      console.error("Error rejecting booking:", error);
      alert("Failed to reject booking");
    }
  };

  const closeRejectModal = () => {
    setRejectModalIsOpen(false);
    setBookingToReject(null);
    setRejectionReason('');
  };

  const handleNewBookingChange = (e) => {
    const { name, value } = e.target;
    setNewBooking(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const selectedService = serviceTypes.find(s => s.value === newBooking.serviceType);
      const totalPrice = selectedService.price * newBooking.loadCount;

      const bookingData = {
        ...newBooking,
        totalPrice,
        serviceName: selectedService.label,
        paymentDetails: newBooking.paymentMethod === 'cash' ? null : {
          method: newBooking.paymentMethod,
          status: 'pending'
        }
      };

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8800/api/admin/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookingData),
      });

      if (response.ok) {
        alert("Booking created successfully!");
        closeModal();
        resetForm();
        fetchBookings(); // Refresh the bookings
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create booking');
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      alert(error.message || "Error creating booking");
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
  };

  const resetForm = () => {
    setNewBooking({
      serviceType: "washFold",
      pickupDate: "",
      pickupTime: "7am-10am",
      loadCount: 1,
      instructions: "",
      status: "approved",
      paymentMethod: "cash",
      name: "",
      contact: "",
      email: "",
      address: ""
    });
    setPhotoFiles([]);
    setPhotoPreviews([]);
    setUploadingPhotos(false);
  };

  // Convert bookings to calendar events
  const calendarEvents = approvedBookings.map((booking) => {
    console.log('Creating calendar event for booking:', booking.id, booking.pickupDate, booking.pickupTime);
    const [startHour, endHour] = booking.pickupTime.includes('am') ?
      booking.pickupTime.replace('am', '').split('-').map((t) => parseInt(t)) :
      booking.pickupTime.replace('pm', '').split('-').map((t) => parseInt(t) + 12);

    const startDate = new Date(booking.pickupDate);
    startDate.setHours(startHour);

    const endDate = new Date(booking.pickupDate);
    endDate.setHours(endHour);

    const event = {
      title: `${booking.name} - ${serviceTypes.find((s) => s.value === booking.serviceType)?.label || booking.serviceType}`,
      start: startDate,
      end: endDate,
      allDay: false,
      resource: booking
    };
    console.log('Created event:', event);
    return event;
  });
  console.log('Total calendar events created:', calendarEvents.length);

  // Handle day click in calendar
  const handleSelectSlot = (slotInfo) => {
    console.log('handleSelectSlot called with:', slotInfo);
    const clickedDate = slotInfo.start;
    console.log('Clicked date:', clickedDate);
    const dayString = clickedDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    console.log('Day string:', dayString);

    // Get all bookings for the clicked day
    // Handle both ISO string format and YYYY-MM-DD format
    const dayBookings = approvedBookings.filter(booking => {
      const bookingDate = booking.pickupDate.includes('T') ?
        booking.pickupDate.split('T')[0] : booking.pickupDate;
      return bookingDate === dayString;
    });
    console.log('Day bookings found:', dayBookings.length, dayBookings);

    if (dayBookings.length > 0) {
      console.log('Opening day bookings modal with', dayBookings.length, 'bookings');
      setSelectedDayBookings(dayBookings);
      setDayBookingsModalIsOpen(true);
    } else {
      console.log('No bookings for selected day');
    }
  };

  // Sort day bookings
  const sortedDayBookings = [...selectedDayBookings].sort((a, b) => {
    if (dayBookingsSortBy === 'pickupDate') {
      return new Date(a.pickupDate + ' ' + a.pickupTime) - new Date(b.pickupDate + ' ' + b.pickupTime);
    } else if (dayBookingsSortBy === 'address') {
      return a.address.localeCompare(b.address);
    }
    return 0;
  });

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full text-pink-600"></div>
        <p className="mt-2">Loading bookings...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center text-red-600">
        <p className="text-lg font-semibold mb-4">Error loading bookings</p>
        <p>{error}</p>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Laundry Bookings Management
        </h1>
        <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0 w-full sm:w-auto">
          <button
            onClick={() => setCalendarView(!calendarView)}
            className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            {calendarView ? "List View" : "Calendar View"}
          </button>
          <button
            onClick={openModal}
            className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            Create New Booking
          </button>
        </div>
      </div>

      {calendarView ? (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md h-[70vh]">
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            onSelectEvent={(event) => setSelectedBooking(event.resource)}
            onSelectSlot={handleSelectSlot}
            selectable
            views={['month', 'week', 'day']}
            defaultView="month"
          />
      </div>
    ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Approved Bookings Section */}
          <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-lg shadow-md">
            <h2 className="text-xl sm:text-2xl font-semibold text-center text-green-500 mb-4 sm:mb-6">Approved Bookings</h2>
            {approvedBookings.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No approved bookings yet</p>
            ) : (
              <div className="space-y-4">
                {approvedBookings.map((booking) => (
                  <div key={booking.id} className="border p-4 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{booking.name}</h3>
                        <p><span className="font-semibold">Service:</span> {
                          serviceTypes.find((s) => s.value === booking.serviceType)?.label || booking.serviceType
                        } (₱{booking.totalPrice})</p>
                        <p><span className="font-semibold">Pickup:</span> {booking.pickupDate} at {booking.pickupTime}</p>
                        <p><span className="font-semibold">Loads:</span> {booking.loadCount}</p>
                        <p><span className="font-semibold">Payment:</span> {
                          booking.paymentMethod === 'cash' ? 'Cash on pickup' :
                          booking.paymentMethod === 'gcash' ? 'GCash' :
                          booking.paymentMethod === 'card' ? 'Credit/Debit Card' : 'Not specified'
                        }</p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => setSelectedBooking(booking)}
                          className="text-blue-500 hover:text-blue-700 text-sm self-end sm:self-center"
                        >
                          View Details
                        </button>
                        {booking.photos?.length > 0 && (
                          <span className="text-xs text-gray-500 self-end sm:self-center">
                            {booking.photos.length} photo{booking.photos.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Bookings Section */}
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
            <h2 className="text-xl sm:text-2xl font-semibold text-center text-yellow-500 mb-4 sm:mb-6">Pending Approval</h2>
            {pendingBookings.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No pending bookings</p>
            ) : (
              <div className="space-y-4 ">
                {pendingBookings.map((booking) => (
                  <div key={booking.id} className="border p-4 rounded-lg  hover:bg-gray-50 transition-colors">
                    <h3 className="font-bold text-lg">{booking.name}</h3>
                    <p><span className="font-semibold">Service:</span> {
                      serviceTypes.find((s) => s.value === booking.serviceType)?.label || booking.serviceType
                    } (₱{booking.totalPrice})</p>
                    <p><span className="font-semibold">Pickup:</span> {booking.pickupDate} at {booking.pickupTime}</p>
                    <div className="flex flex-wrap justify-end gap-2 mt-2">
                      <button
                        onClick={() => handleApproveBooking(booking.id)}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectBooking(booking)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => setSelectedBooking(booking)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Booking Details Modal */}
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

      {/* Create Booking Modal */}
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
                disabled={uploadingPhotos || loading}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50"
              >
                {uploadingPhotos ? 'Uploading...' : loading ? 'Creating...' : 'Create Booking'}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Day Bookings Modal */}
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
                      <span className="font-medium">Service:</span> {serviceTypes.find((s) => s.value === booking.serviceType)?.label || booking.serviceType}
                    </p>
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

      {/* Reject Booking Modal */}
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
    </div>
  );
};

export default Booking;
