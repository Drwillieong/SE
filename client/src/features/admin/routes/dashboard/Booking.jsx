import React, { useState, useEffect } from "react";
import apiClient from '../../../../utils/axios';
import { useNavigate } from "react-router-dom";
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import BookingDetailsModal from '../../../../shared/components/BookingDetailsModal';
import CreateBookingModal from '../../components/CreateBookingModal';
import EditBookingModal from '../../components/EditBookingModal';
import DayBookingsModal from '../../components/DayBookingsModal';
import CheckOrderModal from '../../components/CheckOrderModal';

import RejectBookingModal from '../../components/RejectBookingModal';
import { calculateDeliveryFee } from '../../../../utils/deliveryFeeCalculator';

// Initialize calendar localizer
const localizer = momentLocalizer(moment);

// Main service options - matches backend schema
const mainServices = [
  { value: "fullService", label: "Full Service (Wash, Dry & Fold)", price: 199 },
  { value: "washDryFold", label: "Wash, Dry & Fold", price: 179 }
];

// Dry cleaning service options
const dryCleaningServices = [
  { id: 'dryCleanBarong', name: 'Dry Cleaning - Barong', price: 350 },
  { id: 'dryCleanCoat', name: 'Dry Cleaning - Coat', price: 400 },
  { id: 'dryCleanGown', name: 'Dry Cleaning - Gown', price: 650 },
  { id: 'dryCleanWeddingGown', name: 'Dry Cleaning - Wedding Gown', price: 1500 }
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
    mainService: "washDryFold",
    dryCleaningServices: [],
    pickupDate: "",
    pickupTime: "7am-10am",
    loadCount: 1,
    instructions: "",
    status: "approved",
    paymentMethod: "cash",
    name: "",
    contact: "",
    email: "",
    address: "",
    serviceOption: "pickupAndDelivery",
    deliveryFee: 0
  });
  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [pickupLoading, setPickupLoading] = useState(false);
  const [pickupError, setPickupError] = useState(null);
  const [pickupSuccess, setPickupSuccess] = useState({});
  const [checkOrderModalIsOpen, setCheckOrderModalIsOpen] = useState(false);
  const [selectedBookingForOrder, setSelectedBookingForOrder] = useState(null);
  const [orderFormData, setOrderFormData] = useState({
    estimatedClothes: '',
    kilos: '',
    additionalPrice: '',
    laundryPhoto: null
  });
  const [laundryPhotoFile, setLaundryPhotoFile] = useState(null);
  const [laundryPhotoPreview, setLaundryPhotoPreview] = useState(null);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [editModalIsOpen, setEditModalIsOpen] = useState(false);
  const [bookingToEdit, setBookingToEdit] = useState(null);
  const [editBooking, setEditBooking] = useState({
    mainService: "washDryFold",
    dryCleaningServices: [],
    pickupDate: "",
    pickupTime: "7am-10am",
    loadCount: 1,
    instructions: "",
    status: "approved",
    paymentMethod: "cash",
    name: "",
    contact: "",
    email: "",
    address: "",
    serviceOption: "pickupAndDelivery",
    deliveryFee: 0
  });
  const [editPhotoFiles, setEditPhotoFiles] = useState([]);
  const [editPhotoPreviews, setEditPhotoPreviews] = useState([]);
  const [updatingBooking, setUpdatingBooking] = useState(false);
  const [deletingBooking, setDeletingBooking] = useState(false);

  // Helper function to format date for database (YYYY-MM-DD)
  const formatDateForDB = (dateString) => {
    if (!dateString) return '';
    // If it's already in YYYY-MM-DD format, return as is
    if (dateString.length === 10 && dateString.includes('-')) {
      return dateString;
    }
    // Extract date part from ISO string (YYYY-MM-DD) using local date
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Test function to create a sample order
  const createTestOrder = async () => {
    if (!selectedBookingForOrder) {
      alert('Please select a booking first');
      return;
    }

    setCreatingOrder(true);
    try {
      const token = localStorage.getItem('token');
      const testOrderPayload = {
        serviceType: 'washFold',
        pickupDate: formatDateForDB(selectedBookingForOrder.pickupDate),
        pickupTime: selectedBookingForOrder.pickupTime,
        loadCount: selectedBookingForOrder.loadCount || 1,
        instructions: selectedBookingForOrder.instructions || 'Test order',
        status: 'pending',
        paymentMethod: selectedBookingForOrder.paymentMethod || 'cash',
        name: selectedBookingForOrder.name,
        contact: selectedBookingForOrder.contact,
        email: selectedBookingForOrder.email || '',
        address: selectedBookingForOrder.address,
        photos: selectedBookingForOrder.photos || [],
        totalPrice: selectedBookingForOrder.totalPrice || 199,
        user_id: selectedBookingForOrder.userId || null,
        booking_id: selectedBookingForOrder.id,
        estimatedClothes: 10,
        kilos: 5.0,
        laundryPhoto: []
      };

      console.log('Creating test order with payload:', testOrderPayload);
      const response = await apiClient.post('/api/admin/orders/admin/create-from-pickup', testOrderPayload);

      console.log('Test order creation response status:', response.status); // apiClient uses axios, so response.status is correct

      // With axios, a non-2xx status will throw an error and be caught in the catch block
      if (response.status >= 200 && response.status < 300) {
        const responseData = response.data;
        console.log('Test order created successfully:', responseData);
        alert('Test order created successfully!');
        setCheckOrderModalIsOpen(false);
        setSelectedBookingForOrder(null);

        // Refresh from server to update UI
        fetchBookings();

        navigate('/dashboard/order');
      } else {
        // This block might not be reached with axios, but good for safety
        const errorData = response.data || { message: 'Unknown error' };
        console.error('Test order creation failed:', errorData);
        alert('Test order creation failed: ' + (errorData.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Test order creation error:', error);
      alert('Test order creation error: ' + error.message);
    } finally {
      setCreatingOrder(false);
    }
  };

  useEffect(() => {
    fetchBookings();

    // Set up periodic refresh every 30 seconds
    const intervalId = setInterval(() => {
      fetchBookings();
    }, 30000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
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

  // Save pickup success state to localStorage whenever it changes
  useEffect(() => {
    if (Object.keys(pickupSuccess).length > 0) {
      localStorage.setItem('pickupSuccess', JSON.stringify(pickupSuccess));
    }
  }, [pickupSuccess]);

  // Load pickup success state from localStorage on initial mount
  useEffect(() => {
    const savedPickupSuccess = localStorage.getItem('pickupSuccess');
    if (savedPickupSuccess) {
      setPickupSuccess(JSON.parse(savedPickupSuccess));
    }
  }, []);



  const fetchBookings = async () => {
    console.log('Starting fetchBookings...');
    try {
      // Token is now handled by the apiClient interceptor

      console.log('Making fetch request to /api/admin/bookings');
      const response = await apiClient.get('/api/admin/bookings');
      console.log('Response received, status:', response.status);

      // With axios, a non-2xx status will throw an error and be caught in the catch block.
      // So we can assume the response is successful here.
      if (response.status >= 200 && response.status < 300) {
        const orders = response.data;
        console.log('Orders received:', orders.length);
        const pendingData = orders.filter((order) => order.status === 'pending');
        const approvedData = orders.filter((order) => order.status === 'approved');
        const completedData = orders.filter((order) => order.status === 'completed');

        // Separate today's bookings and others
        const todayStr = new Date().toISOString().split('T')[0];
        const todaysBookings = approvedData.filter(order => order.pickupDate === todayStr);
        const otherBookings = approvedData.filter(order => order.pickupDate !== todayStr);

        // Sort today's bookings to top
        const sortedApproved = [...todaysBookings, ...otherBookings];

        console.log('Pending bookings:', pendingData.length, 'Approved bookings:', sortedApproved.length);
        console.log('Completed bookings found:', completedData.length);
        console.log('All bookings statuses:', orders.map(o => ({ id: o.id, status: o.status })));

        setPendingBookings(pendingData.map((order) => formatBookingData(order.id, order)));
        setApprovedBookings(sortedApproved.map((order) => formatBookingData(order.id, order)));
        setError(null); // Clear any previous errors

        // Sort approved bookings based on sortBy
        const formattedApproved = sortedApproved.map((order) => formatBookingData(order.id, order));
        sortApprovedBookings(formattedApproved);
      } else {
        console.error('Failed to fetch bookings, status:', response.status);
        if (response.status === 403) { // This part is less likely to be hit with axios interceptors
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
      if (error.response) {
        if (error.response.status === 403) {
          setError('Admin access required. Please log in as an administrator.');
        } else if (error.response.status === 401) {
          setError('Session expired. Please log in again.');
        }
        navigate('/login');
      } else if (error.name === 'AbortError') {
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

    // Calculate delivery fee if not provided
    let deliveryFee = data.deliveryFee || 0;
    if (!deliveryFee && data.address && data.loadCount) {
      // Extract barangay from address for delivery fee calculation
      const addressParts = data.address.split(',').map(part => part.trim());
      const barangay = addressParts.find(part =>
        part.toLowerCase().includes('brgy') ||
        part.toLowerCase().includes('barangay') ||
        addressParts.indexOf(part) === addressParts.length - 2
      ) || '';
      deliveryFee = calculateDeliveryFee(barangay, parseInt(data.loadCount) || 1);
    }

    // Calculate total price including delivery fee
    const mainServicePrice = (mainServices.find(s => s.value === (data.mainService || "washDryFold"))?.price || 0) * (data.loadCount || 1);
    const dryCleaningPrice = (data.dryCleaningServices || []).reduce((sum, serviceId) => {
      const service = dryCleaningServices.find(s => s.id === serviceId);
      return sum + (service ? service.price : 0);
    }, 0);
    const calculatedTotalPrice = mainServicePrice + dryCleaningPrice + (data.serviceOption !== 'pickupOnly' ? deliveryFee : 0);

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
      mainService: data.mainService || "washDryFold",
      dryCleaningServices: data.dryCleaningServices || [],
      status: data.status,
      createdAt: data.createdAt,
      paymentMethod: data.paymentMethod || "cash",
      photos: photos,
      serviceOption: data.serviceOption || "pickupAndDelivery",
      deliveryFee: deliveryFee,
      totalPrice: parseFloat(data.totalPrice) || calculatedTotalPrice
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
      const response = await apiClient.put(`/api/admin/bookings/${bookingId}`, { status: "approved" });

      if (response.status >= 200 && response.status < 300) {
        alert("Booking approved successfully!");
        fetchBookings(); // Refresh the bookings
      } else {
        const errorData = response.data || {};
        alert("Failed to approve booking: " + (errorData.message || 'Unknown error'));
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
      const response = await apiClient.put(`/api/admin/bookings/${bookingToReject.id}`, { status: "rejected", rejectionReason: rejectionReason.trim() });

      if (response.status >= 200 && response.status < 300) {
        alert("Booking rejected successfully!");
        fetchBookings(); // Refresh the bookings
        closeRejectModal();
      } else {
        const errorData = response.data || {};
        alert("Failed to reject booking: " + (errorData.message || 'Unknown error'));
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

  // Delete booking function
  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to delete this booking? This action cannot be undone.')) {
      return;
    }

    setDeletingBooking(true);
    try {
      const response = await apiClient.delete(`/api/admin/bookings/${bookingId}`);

      if (response.status >= 200 && response.status < 300) {
        alert('Booking deleted successfully!');
        fetchBookings(); // Refresh the bookings
      } else {
        alert('Failed to delete booking: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('Failed to delete booking: ' + error.message);
    } finally {
      setDeletingBooking(false);
    }
  };

  // Edit booking functions
  const handleEditBooking = (booking) => {
    setBookingToEdit(booking);
    setEditBooking({
      mainService: booking.mainService || "washDryFold",
      dryCleaningServices: booking.dryCleaningServices || [],
      pickupDate: booking.pickupDate || "",
      pickupTime: booking.pickupTime || "7am-10am",
      loadCount: booking.loadCount || 1,
      instructions: booking.instructions || "",
      status: booking.status || "approved",
      paymentMethod: booking.paymentMethod || "cash",
      name: booking.name || "",
      contact: booking.contact || "",
      email: booking.email || "",
      address: booking.address || "",
      serviceOption: booking.serviceOption || "pickupAndDelivery",
      deliveryFee: booking.deliveryFee || 0
    });
    setEditPhotoFiles([]);
    setEditPhotoPreviews(booking.photos || []);
    setEditModalIsOpen(true);
  };

  const handleEditBookingChange = (e) => {
    const { name, value } = e.target;
    setEditBooking(prev => ({ ...prev, [name]: value }));
  };

  const handleEditPhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + editPhotoFiles.length > 5) {
      alert('You can upload a maximum of 5 photos');
      return;
    }

    setEditPhotoFiles([...editPhotoFiles, ...files]);

    // Create previews
    const newPreviews = [];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push(e.target.result);
        if (newPreviews.length === files.length) {
          setEditPhotoPreviews([...editPhotoPreviews, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeEditPhoto = (index) => {
    const newFiles = [...editPhotoFiles];
    const newPreviews = [...editPhotoPreviews];
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    setEditPhotoFiles(newFiles);
    setEditPhotoPreviews(newPreviews);
  };

  const handleUpdateBooking = async (e) => {
    e.preventDefault();
    if (!bookingToEdit) return;

    setUpdatingBooking(true);
    try {
      const selectedMainService = mainServices.find(s => s.value === editBooking.mainService);
      const selectedDryCleaningServices = dryCleaningServices.filter(s => editBooking.dryCleaningServices.includes(s.id));

      const mainServicePrice = selectedMainService.price * editBooking.loadCount;
      const dryCleaningPrice = selectedDryCleaningServices.reduce((sum, s) => sum + s.price, 0);
      // Use editBooking.deliveryFee directly, which is updated by the modal
      const totalPrice = mainServicePrice + dryCleaningPrice + (editBooking.serviceOption !== 'pickupOnly' ? editBooking.deliveryFee : 0);

      const updateData = {
        ...editBooking,
        // editBooking.deliveryFee is already updated by EditBookingModal's handleEditBookingChange
        totalPrice,
      };

      const response = await apiClient.put(`/api/admin/bookings/${bookingToEdit.id}`, updateData);

      if (response.status >= 200 && response.status < 300) {
        alert('Booking updated successfully!');
        closeEditModal();
        fetchBookings(); // Refresh the bookings
      } else {
        const errorData = response.data;
        throw new Error(errorData.message || 'Failed to update booking');
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      alert(error.message || 'Error updating booking');
    } finally {
      setUpdatingBooking(false);
    }
  };

  const closeEditModal = () => {
    setEditModalIsOpen(false);
    setBookingToEdit(null);
    setEditBooking({
      mainService: "washDryFold",
      dryCleaningServices: [],
      pickupDate: "",
      pickupTime: "7am-10am",
      loadCount: 1,
      instructions: "",
      status: "approved",
      paymentMethod: "cash",
      name: "",
      contact: "",
      email: "",
      address: "",
      serviceOption: "pickupAndDelivery",
      deliveryFee: 0
    });
    setEditPhotoFiles([]);
    setEditPhotoPreviews([]);
  };

  const handleNewBookingChange = (e) => {
    const { name, value } = e.target;
    setNewBooking(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();

    // Check booking count before creating
    try {
      const countResponse = await apiClient.post('/api/bookings/counts', { dates: [newBooking.pickupDate] });

      if (countResponse.status >= 200 && countResponse.status < 300) {
        const countData = countResponse.data;
        const currentCount = countData[newBooking.pickupDate] || 0;
        if (currentCount >= 3) {
          alert('This day is fully booked. Maximum 3 bookings per day allowed.');
          setLoading(false); // Also set loading false here
          return;
        }
      } else {
        alert('Failed to check booking availability. Please try again.');
        return;
      }
    } catch (error) {
      console.error('Error checking booking count:', error);
      alert('Failed to check booking availability. Please try again.');
      return;
    }

    try {
      setLoading(true);
      const selectedMainService = mainServices.find(s => s.value === newBooking.mainService);
      const selectedDryCleaningServices = dryCleaningServices.filter(s => newBooking.dryCleaningServices.includes(s.id));
      
      const mainServicePrice = selectedMainService.price * newBooking.loadCount;
      const dryCleaningPrice = selectedDryCleaningServices.reduce((sum, s) => sum + s.price, 0);
      // Use newBooking.deliveryFee directly, which is updated by the modal
      const totalPrice = mainServicePrice + dryCleaningPrice + (newBooking.serviceOption !== 'pickupOnly' ? newBooking.deliveryFee : 0);

      const bookingData = {
        ...newBooking,
        totalPrice,
        serviceName: selectedMainService.label,
      };

      const response = await apiClient.post('/api/admin/bookings', bookingData);

      if (response.status >= 200 && response.status < 300) {
        alert("Booking created successfully!");
        fetchBookings(); // Refresh the bookings
      } else {
        const errorData = response.data;
        throw new Error(errorData.message || 'Failed to create booking');
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      alert(error.message || "Error creating booking");
    } finally {
      closeModal();
      resetForm();
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
      mainService: "washDryFold",
      dryCleaningServices: [],
      pickupDate: "",
      pickupTime: "7am-10am",
      loadCount: 1,
      instructions: "",
      status: "approved",
      paymentMethod: "cash",
      name: "",
      contact: "",
      email: "",
      address: "",
      serviceOption: "pickupAndDelivery",
      deliveryFee: 0
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

    const mainServiceLabel = mainServices.find((s) => s.value === booking.mainService)?.label || booking.mainService;
    const dryCleaningLabels = booking.dryCleaningServices?.map(id => dryCleaningServices.find(s => s.id === id)?.name).filter(Boolean).join(', ') || '';
    const title = `${booking.name} - ${mainServiceLabel}${dryCleaningLabels ? ` + ${dryCleaningLabels}` : ''}`;

    const event = {
      title,
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
      const response = await apiClient.post(`/api/admin/bookings/${bookingId}/pickup-email`);

      if (response.status >= 200 && response.status < 300) {
        setPickupSuccess(prev => ({ ...prev, [bookingId]: true }));
        alert('Pickup notification email sent successfully.');
      } else {
        const data = response.data;
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

  // Handle order form input change
  const handleOrderFormChange = (e) => {
    const { name, value } = e.target;
    setOrderFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle laundry photo file change
  const handleLaundryPhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLaundryPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLaundryPhotoPreview(reader.result);
        setOrderFormData(prev => ({ ...prev, laundryPhoto: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };



  // Calculate prices for modal display
  const bookingTotalPrice = selectedBookingForOrder ? parseFloat(selectedBookingForOrder.totalPrice) || 0 : 0;
  const additionalPrice = parseFloat(orderFormData.additionalPrice) || 0;
  const totalPrice = bookingTotalPrice + additionalPrice;

  // Handle order form submit
  const handleOrderFormSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBookingForOrder) return;

    setCreatingOrder(true);
    try {
      const bookingTotalPrice = selectedBookingForOrder.totalPrice || 0;
      const additionalPrice = parseFloat(orderFormData.additionalPrice) || 0;
      const totalPrice = bookingTotalPrice + additionalPrice;

      const orderPayload = {
        serviceType: selectedBookingForOrder.mainService || 'washFold',
        pickupDate: formatDateForDB(selectedBookingForOrder.pickupDate),
        pickupTime: selectedBookingForOrder.pickupTime,
        loadCount: selectedBookingForOrder.loadCount || 1,
        instructions: selectedBookingForOrder.instructions || '',
        status: 'pending',
        paymentMethod: selectedBookingForOrder.paymentMethod || 'cash',
        name: selectedBookingForOrder.name,
        contact: selectedBookingForOrder.contact,
        email: selectedBookingForOrder.email || '',
        address: selectedBookingForOrder.address,
        photos: selectedBookingForOrder.photos || [],
        totalPrice: totalPrice,
        user_id: selectedBookingForOrder.userId || null,
        booking_id: selectedBookingForOrder.id,
        estimatedClothes: parseInt(orderFormData.estimatedClothes) || 1,
        kilos: parseFloat(orderFormData.kilos) || 1.0,
        additionalPrice: additionalPrice,
        laundryPhoto: orderFormData.laundryPhoto ? [orderFormData.laundryPhoto] : []
      };

      console.log('Order payload being sent:', orderPayload);

      console.log('Creating order with payload:', orderPayload);
      const response = await apiClient.post('/api/admin/orders/admin/create-from-pickup', orderPayload);

      console.log('Order creation response status:', response.status);
      console.log('Order creation response headers:', response.headers);

      if (response.status >= 200 && response.status < 300) {
        const responseData = response.data;
        console.log('Order created successfully:', responseData);
        console.log('Booking ID being converted to order:', selectedBookingForOrder.id);
        console.log('Booking details:', selectedBookingForOrder);

        alert('Order created successfully.');

        // Close modal and reset form
        setCheckOrderModalIsOpen(false);
        setSelectedBookingForOrder(null);


        // Reset form data
        setOrderFormData({
          estimatedClothes: '',
          kilos: '',
          laundryPhoto: null
        });
        setLaundryPhotoFile(null);
        setLaundryPhotoPreview(null);

        // Refresh from server to update UI, which will remove the completed booking
        await fetchBookings();

        // Navigate to Order Management to see the newly created order
        console.log('Order created successfully, navigating to order management...');
        navigate('/dashboard/order');
      } else {
        const data = response.data;
        console.error('Order creation failed:', data);
        alert(data.message || 'Failed to create order.');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Network error. Please try again.');
    } finally {
      setCreatingOrder(false);
    }
  };



  if (loading) return (
    <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
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
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 mb-8 shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Laundry Bookings Management
            </h1>
            <p className="text-blue-100 text-sm md:text-base">
              Manage customer bookings, approve requests, and track orders
            </p>
          </div>
          <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0 w-full sm:w-auto">
          <button
            onClick={() => setCalendarView(!calendarView)}
            className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors shadow-md hover:shadow-lg"
          >
            {calendarView ? "List View" : "Calendar View"}
          </button>
            <button
              onClick={openModal}
              className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors shadow-md hover:shadow-lg"
            >
              Create New Booking
            </button>
          </div>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Approved Bookings Section */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-green-600 mb-1">Approved Bookings</h2>
                <p className="text-sm text-gray-500">{approvedBookings.length} bookings ready for processing</p>
              </div>
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
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 text-lg">No approved bookings yet</p>
            <p className="text-gray-400 text-sm">Approved bookings will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {approvedBookings.map((booking) => {
              const isToday = booking.pickupDate === new Date().toISOString().split('T')[0];
              return (
                <div
                  key={booking.id}
                  className={`border-2 p-6 rounded-xl hover:shadow-lg transition-all duration-200 ${
                    isToday
                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 shadow-md'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{booking.name}</h3>
                      <p><span className="font-semibold">Service:</span> {
                        mainServices.find((s) => s.value === booking.mainService)?.label || booking.mainService
                      } (₱{booking.totalPrice})</p>
                      {booking.dryCleaningServices && booking.dryCleaningServices.length > 0 && (
                        <p><span className="font-semibold">Dry Cleaning:</span> {
                          booking.dryCleaningServices.map(id => dryCleaningServices.find(s => s.id === id)?.name).filter(Boolean).join(', ')
                        }</p>
                      )}
                      <p><span className="font-semibold">Service Option:</span> {
                        booking.serviceOption === 'pickupOnly' ? 'Pickup Only' :
                        booking.serviceOption === 'deliveryOnly' ? 'Delivery Only' : 'Pickup & Delivery'
                      }</p>
                      <p><span className="font-semibold">Pickup:</span> {booking.pickupDate} at {booking.pickupTime}</p>
                      <p><span className="font-semibold">Loads:</span> {booking.loadCount}</p>
                      {booking.serviceOption !== 'pickupOnly' && booking.deliveryFee > 0 && (
                        <p><span className="font-semibold">Delivery Fee:</span> ₱{booking.deliveryFee}</p>
                      )}
                      <p><span className="font-semibold">Payment:</span> {
                        booking.paymentMethod === 'cash' ? 'Cash on pickup' :
                        booking.paymentMethod === 'gcash' ? 'GCash' :
                        booking.paymentMethod === 'card' ? 'Credit/Debit Card' : 'Not specified'
                      }</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => setSelectedBooking(booking)}
                        className="text-blue-500 hover:text-blue-700 text-sm self-end sm:self-center px-3 py-1 rounded-md hover:bg-blue-50 transition-colors"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleEditBooking(booking)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm transition-colors self-end sm:self-center shadow-sm hover:shadow-md"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteBooking(booking.id)}
                        disabled={deletingBooking}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors self-end sm:self-center shadow-sm hover:shadow-md disabled:opacity-50"
                      >
                        {deletingBooking ? 'Deleting...' : 'Delete'}
                      </button>
                      {pickupSuccess[booking.id] ? (
                        <button
                          onClick={() => {
                            // When admin clicks "Check Order", open the order form modal
                            setSelectedBookingForOrder(booking);
                            setCheckOrderModalIsOpen(true);
                            setOrderFormData({
                              estimatedClothes: '',
                              kilos: '',
                              pants: '',
                              shorts: '',
                              tshirts: '',
                              bedsheets: '',
                              laundryPhoto: null
                            });
                            setLaundryPhotoFile(null);
                            setLaundryPhotoPreview(null);
                          }}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors self-end sm:self-center shadow-sm hover:shadow-md"
                        >
                          Check Order
                        </button>
                      ) : (
                        <button
                          onClick={() => handlePickupNow(booking.id)}
                          disabled={pickupLoading}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors self-end sm:self-center shadow-sm hover:shadow-md"
                        >
                          {pickupLoading ? 'Sending...' : 'Ready for Pickup'}
                        </button>
                      )}
                      {booking.photos?.length > 0 && (
                        <span className="text-xs text-gray-500 self-end sm:self-center px-2 py-1 bg-gray-100 rounded-full">
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
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <div className="text-center mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-black mb-1">Pending Approval</h2>
              <p className="text-sm text-gray-500">{pendingBookings.length} bookings awaiting review</p>
            </div>
            {pendingBookings.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-lg">No pending bookings</p>
                <p className="text-gray-400 text-sm">New booking requests will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingBookings.map((booking) => (
                  <div key={booking.id} className=" bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                    <h3 className="font-bold text-lg">{booking.name}</h3>
                    <p><span className="font-semibold">Service:</span> {
                      mainServices.find((s) => s.value === booking.mainService)?.label || booking.mainService
                    } (₱{booking.totalPrice})</p>
                    {booking.dryCleaningServices && booking.dryCleaningServices.length > 0 && (
                      <p><span className="font-semibold">Dry Cleaning:</span> {
                        booking.dryCleaningServices.map(id => dryCleaningServices.find(s => s.id === id)?.name).filter(Boolean).join(', ')
                      }</p>
                    )}
                    <p><span className="font-semibold">Service Option:</span> {
                      booking.serviceOption === 'pickupOnly' ? 'Pickup Only' :
                      booking.serviceOption === 'deliveryOnly' ? 'Delivery Only' : 'Pickup & Delivery'
                    }</p>
                    <p><span className="font-semibold">Pickup:</span> {booking.pickupDate} at {booking.pickupTime}</p>
                    {booking.serviceOption !== 'pickupOnly' && booking.deliveryFee > 0 && (
                      <p><span className="font-semibold">Delivery Fee:</span> ₱{booking.deliveryFee}</p>
                    )}
                    <div className="flex flex-wrap justify-end gap-2 mt-2">
                      <button
                        onClick={() => handleApproveBooking(booking.id)}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors shadow-sm hover:shadow-md"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectBooking(booking)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors shadow-sm hover:shadow-md"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleEditBooking(booking)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm transition-colors shadow-sm hover:shadow-md"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteBooking(booking.id)}
                        disabled={deletingBooking}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors shadow-sm hover:shadow-md disabled:opacity-50"
                      >
                        {deletingBooking ? 'Deleting...' : 'Delete'}
                      </button>
                      <button
                        onClick={() => setSelectedBooking(booking)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors shadow-sm hover:shadow-md"
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
        mainServices={mainServices}
        dryCleaningServices={dryCleaningServices}
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
        mainServices={mainServices}
        dryCleaningServices={dryCleaningServices}
      />

      <DayBookingsModal
        dayBookingsModalIsOpen={dayBookingsModalIsOpen}
        setDayBookingsModalIsOpen={setDayBookingsModalIsOpen}
        selectedDayBookings={selectedDayBookings}
        dayBookingsSortBy={dayBookingsSortBy}
        setDayBookingsSortBy={setDayBookingsSortBy}
        setSelectedBooking={setSelectedBooking}
        mainServices={mainServices}
        dryCleaningServices={dryCleaningServices}
      />

      <RejectBookingModal
        rejectModalIsOpen={rejectModalIsOpen}
        closeRejectModal={closeRejectModal}
        bookingToReject={bookingToReject}
        rejectionReason={rejectionReason}
        setRejectionReason={setRejectionReason}
        confirmRejectBooking={confirmRejectBooking}
      />

      <CheckOrderModal
        checkOrderModalIsOpen={checkOrderModalIsOpen}
        setCheckOrderModalIsOpen={setCheckOrderModalIsOpen}
        selectedBookingForOrder={selectedBookingForOrder}
        orderFormData={orderFormData}
        setOrderFormData={setOrderFormData}
        laundryPhotoPreview={laundryPhotoPreview}
        handleOrderFormChange={handleOrderFormChange}
        handleLaundryPhotoChange={handleLaundryPhotoChange}
        createTestOrder={createTestOrder}
        handleOrderFormSubmit={handleOrderFormSubmit}
        creatingOrder={creatingOrder}
        setSelectedBookingForOrder={setSelectedBookingForOrder}
        setLaundryPhotoFile={setLaundryPhotoFile}
        setLaundryPhotoPreview={setLaundryPhotoPreview}
        fetchBookings={fetchBookings}
        navigate={navigate}
        bookingTotalPrice={bookingTotalPrice}
        additionalPrice={additionalPrice}
        totalPrice={totalPrice}
      />

      {/* Edit Booking Modal */}
      <EditBookingModal
        modalIsOpen={editModalIsOpen}
        closeModal={closeEditModal}
        editBooking={editBooking}
        handleEditBookingChange={handleEditBookingChange}
        handleUpdateBooking={handleUpdateBooking}
        updatingBooking={updatingBooking}
        editPhotoFiles={editPhotoFiles}
        editPhotoPreviews={editPhotoPreviews}
        handleEditPhotoUpload={handleEditPhotoUpload}
        removeEditPhoto={removeEditPhoto}
        mainServices={mainServices}
        dryCleaningServices={dryCleaningServices}
      />
    </div>
  );
};

export default Booking;
