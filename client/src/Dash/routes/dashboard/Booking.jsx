import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import Modal from 'react-modal';
import BookingDetailsModal from './components/BookingDetailsModal';
import CreateBookingModal from './components/CreateBookingModal';
import DayBookingsModal from './components/DayBookingsModal';
import RejectBookingModal from './components/RejectBookingModal';

// Initialize calendar localizer
const localizer = momentLocalizer(moment);


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
  const [sortBy, setSortBy] = useState('dueToday'); // 'dueToday' or 'new'
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
  const [pickupLoading, setPickupLoading] = useState(false);
  const [pickupError, setPickupError] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  // Function to sort approved bookings
  const sortApprovedBookings = (bookings) => {
    let sorted = [...bookings];
    if (sortBy === 'new') {
      sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'dueToday') {
      const todayStr = new Date().toISOString().split('T')[0];
      const todays = sorted.filter(b => b.pickupDate === todayStr);
      const others = sorted.filter(b => b.pickupDate !== todayStr).sort((a, b) => new Date(a.pickupDate) - new Date(b.pickupDate));
      sorted = [...todays, ...others];
    }
    setApprovedBookings(sorted);
  };

  // Re-sort when sortBy changes
  useEffect(() => {
    if (approvedBookings.length > 0) {
      sortApprovedBookings(approvedBookings);
    }
  }, [sortBy]);

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

        // Separate today's bookings and others
        const todayStr = new Date().toISOString().split('T')[0];
        const todaysBookings = approvedData.filter(order => order.pickupDate === todayStr);
        const otherBookings = approvedData.filter(order => order.pickupDate !== todayStr);

        // Sort today's bookings to top
        const sortedApproved = [...todaysBookings, ...otherBookings];

        console.log('Pending bookings:', pendingData.length, 'Approved bookings:', sortedApproved.length);
        setPendingBookings(pendingData.map((order) => formatBookingData(order.id, order)));
        setApprovedBookings(sortedApproved.map((order) => formatBookingData(order.id, order)));
        setError(null); // Clear any previous errors

        // Sort approved bookings based on sortBy
        const formattedApproved = sortedApproved.map((order) => formatBookingData(order.id, order));
        sortApprovedBookings(formattedApproved);
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

  // Handle pickup now button click
  const handlePickupNow = async (bookingId) => {
    setPickupLoading(true);
    setPickupError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8800/api/admin/bookings/${bookingId}/pickup-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        alert('Pickup notification email sent successfully.');
      } else {
        const data = await response.json();
        setPickupError(data.message || 'Failed to send pickup notification email.');
      }
    } catch (error) {
      setPickupError('Network error. Please try again.');
    } finally {
      setPickupLoading(false);
    }
  };

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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-green-500">Approved Bookings</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setSortBy('new')}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    sortBy === 'new' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  New Bookings
                </button>
                <button
                  onClick={() => setSortBy('dueToday')}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    sortBy === 'dueToday' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Due Today
                </button>
              </div>
            </div>
        {approvedBookings.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No approved bookings yet</p>
        ) : (
          <div className="space-y-4">
            {approvedBookings.map((booking) => {
              const isToday = booking.pickupDate === new Date().toISOString().split('T')[0];
              return (
                <div
                  key={booking.id}
                  className={`border p-4 rounded-lg hover:bg-gray-50 transition-colors ${
                    isToday ? 'bg-green-300 border-green-500' : ''
                  }`}
                >
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
                      <button
                        onClick={() => handlePickupNow(booking.id)}
                        disabled={pickupLoading}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors self-end sm:self-center"
                      >
                        {pickupLoading ? 'Sending...' : 'Pick Up Now'}
                      </button>
                      {booking.photos?.length > 0 && (
                        <span className="text-xs text-gray-500 self-end sm:self-center">
                          {booking.photos.length} photo{booking.photos.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
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

      <BookingDetailsModal
        selectedBooking={selectedBooking}
        setSelectedBooking={setSelectedBooking}
        serviceTypes={serviceTypes}
      />

      <CreateBookingModal
        modalIsOpen={modalIsOpen}
        closeModal={closeModal}
        newBooking={newBooking}
        handleNewBookingChange={handleNewBookingChange}
        handleCreateBooking={handleCreateBooking}
        loading={loading}
        photoFiles={photoFiles}
        photoPreviews={photoPreviews}
        handlePhotoUpload={handlePhotoUpload}
        removePhoto={removePhoto}
        serviceTypes={serviceTypes}
      />

      <DayBookingsModal
        dayBookingsModalIsOpen={dayBookingsModalIsOpen}
        setDayBookingsModalIsOpen={setDayBookingsModalIsOpen}
        selectedDayBookings={selectedDayBookings}
        dayBookingsSortBy={dayBookingsSortBy}
        setDayBookingsSortBy={setDayBookingsSortBy}
        setSelectedBooking={setSelectedBooking}
        serviceTypes={serviceTypes}
      />

      <RejectBookingModal
        rejectModalIsOpen={rejectModalIsOpen}
        closeRejectModal={closeRejectModal}
        bookingToReject={bookingToReject}
        rejectionReason={rejectionReason}
        setRejectionReason={setRejectionReason}
        confirmRejectBooking={confirmRejectBooking}
      />
    </div>
  );
};

export default Booking;
