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
      const response = await apiClient.get('/api/admin/bookings?sortBy=id');
      console.log('Response received, status:', response.status);

      // With axios, a non-2xx status will throw an error and be caught in the catch block.
      // So we can assume the response is successful here.
      if (response.status >= 200 && response.status < 300) {
        const orders = response.data.bookings;
        console.log('Orders received:', orders.length);
        const pendingData = orders.filter((order) => order.status === 'pending_booking' && order.status !== 'approved');
        const approvedData = orders.filter((order) => order.status === 'approved' && order.status !== 'pending_booking');
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

        setPendingBookings(pendingData.map((order) => formatBookingData(order.service_orders_id, order)));
        setError(null); // Clear any previous errors

        // Sort approved bookings based on sortBy
        const formattedApproved = sortedApproved.map((order) => formatBookingData(order.service_orders_id, order));
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

    // Parse dry_cleaning_services from JSON string to array if it's a string
    let dryCleaningServicesData = [];
    if (data.dry_cleaning_services) {
      if (typeof data.dry_cleaning_services === 'string') {
        try {
          dryCleaningServicesData = JSON.parse(data.dry_cleaning_services);
        } catch (e) {
          dryCleaningServicesData = [];
        }
      } else if (Array.isArray(data.dry_cleaning_services)) {
        dryCleaningServicesData = data.dry_cleaning_services;
      }
    }

    // Calculate delivery fee if not provided
    let deliveryFee = data.delivery_fee || 0;
    if (!deliveryFee && data.address && data.load_count) {
      // Extract barangay from address for delivery fee calculation
      const addressParts = data.address.split(',').map(part => part.trim());
      const barangay = addressParts.find(part =>
        part.toLowerCase().includes('brgy') ||
        part.toLowerCase().includes('barangay') ||
        addressParts.indexOf(part) === addressParts.length - 2
      ) || '';
      deliveryFee = calculateDeliveryFee(barangay, parseInt(data.load_count) || 1);
    }

    // Calculate total price including delivery fee
    const mainServicePrice = (mainServices.find(s => s.value === (data.service_type || "washDryFold"))?.price || 0) * (data.load_count || 1);
    const dryCleaningPrice = (dryCleaningServicesData || []).reduce((sum, serviceId) => {
      const service = dryCleaningServices.find(s => s.id === serviceId);
      return sum + (service ? service.price : 0);
    }, 0);
    const calculatedTotalPrice = mainServicePrice + dryCleaningPrice + (data.service_option !== 'pickupOnly' ? deliveryFee : 0);

    return {
      id,
      name: data.name || "No Name",
      contact: data.contact || "No Contact",
      email: data.email || "No Email",
      address: data.address || "No Address",
      pickupDate: data.pickup_date,
      pickupTime: data.pickup_time,
      loadCount: data.load_count || 1,
      instructions: data.instructions || "No Instructions",
      mainService: data.service_type || "washDryFold",
      dryCleaningServices: dryCleaningServicesData || [],
      status: data.status,
      createdAt: data.created_at,
      paymentMethod: data.payment_method || "cash",
      photos: photos,
      serviceOption: data.service_option || "pickupAndDelivery",
      deliveryFee: deliveryFee,
      totalPrice: parseFloat(data.total_price) || calculatedTotalPrice
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
        // Ensure the 'Ready for Pickup' button is shown for the newly approved booking
        setPickupSuccess(prev => {
          const newSuccess = { ...prev };
          delete newSuccess[bookingId];
          localStorage.setItem('pickupSuccess', JSON.stringify(newSuccess)); // Update localStorage
          return newSuccess;
        });
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
        // Also remove the pickup success state for this booking to reset the button
        setPickupSuccess(prev => {
          const newSuccess = { ...prev };
          delete newSuccess[bookingId];
          localStorage.setItem('pickupSuccess', JSON.stringify(newSuccess)); // Update localStorage
          return newSuccess;
        });
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
      const totalPrice = mainServicePrice + dryCleaningPrice + (editBooking.serviceOption !== 'pickupOnly' ? (editBooking.deliveryFee || 0) : 0);

      const updateData = {
        service_type: editBooking.mainService,
        dry_cleaning_services: JSON.stringify(editBooking.dryCleaningServices || []),
        pickup_date: editBooking.pickupDate,
        pickup_time: editBooking.pickupTime,
        load_count: editBooking.loadCount,
        instructions: editBooking.instructions || '',
        status: editBooking.status || 'approved',
        payment_method: editBooking.paymentMethod || 'cash',
        name: editBooking.name,
        contact: editBooking.contact,
        email: editBooking.email || '',
        address: editBooking.address,
        service_option: editBooking.serviceOption || 'pickupAndDelivery',
        delivery_fee: editBooking.deliveryFee || 0,
        total_price: totalPrice,
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

  const handleCreateBooking = async (e, bookingDetails) => {
    e.preventDefault();
    const bookingToCreate = bookingDetails || newBooking;

    // Check booking count before creating
    try {
      const countResponse = await apiClient.post('/api/bookings/counts', { dates: [bookingToCreate.pickupDate] });

      if (countResponse.status >= 200 && countResponse.status < 300) {
        const countData = countResponse.data;
        const currentCount = countData[bookingToCreate.pickupDate] || 0;
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
      const selectedMainService = mainServices.find(s => s.value === bookingToCreate.mainService);
      const selectedDryCleaningServices = dryCleaningServices.filter(s => bookingToCreate.dryCleaningServices.includes(s.id));
      
      const mainServicePrice = selectedMainService.price * bookingToCreate.loadCount;
      const dryCleaningPrice = selectedDryCleaningServices.reduce((sum, s) => sum + s.price, 0);
      // Use deliveryFee from the modal
      const totalPrice = mainServicePrice + dryCleaningPrice + (bookingToCreate.serviceOption !== 'pickupOnly' ? bookingToCreate.deliveryFee : 0);

      const bookingData = {
        service_type: bookingToCreate.mainService,
        dry_cleaning_services: bookingToCreate.dryCleaningServices || [],
        name: bookingToCreate.name,
        contact: bookingToCreate.contact,
        email: bookingToCreate.email || '',
        address: bookingToCreate.address,
        pickup_date: bookingToCreate.pickupDate,
        pickup_time: bookingToCreate.pickupTime,
        load_count: bookingToCreate.loadCount,
        instructions: bookingToCreate.instructions || '',
        status: bookingToCreate.status || 'approved',
        payment_method: bookingToCreate.paymentMethod || 'cash',
        service_option: bookingToCreate.serviceOption || 'pickupAndDelivery',
        delivery_fee: bookingToCreate.deliveryFee || 0,
        total_price: totalPrice,
        photos: [],
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
      const response = await apiClient.post(`/api/admin/bookings/${bookingId}/pickup-notification`);

      if (response.status >= 200 && response.status < 300) {
        setPickupSuccess(prev => ({ ...prev, [bookingId]: true }));
        alert(response.data.message || 'Pickup notification sent successfully.');
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

      const updatePayload = {
        status: 'pending',
        estimated_clothes: parseInt(orderFormData.estimatedClothes) || 1,
        kilos: parseFloat(orderFormData.kilos) || 1.0,
        total_price: totalPrice,
        laundry_photos: orderFormData.laundryPhoto ? [orderFormData.laundryPhoto] : []
      };

      console.log('Update payload being sent:', updatePayload);

      const response = await apiClient.put(`/api/admin/orders/${selectedBookingForOrder.id}`, updatePayload);

      console.log('Order update response status:', response.status);

      if (response.status >= 200 && response.status < 300) {
        const responseData = response.data;
        console.log('Order updated successfully:', responseData);
        console.log('Booking ID being converted to order:', selectedBookingForOrder.id);

        alert('Order updated successfully.');

        // Close modal and reset form
        setCheckOrderModalIsOpen(false);
        setSelectedBookingForOrder(null);

        // Reset form data
        setOrderFormData({
          estimatedClothes: '',
          kilos: '',
          additionalPrice: '',
          laundryPhoto: null
        });
        setLaundryPhotoFile(null);
        setLaundryPhotoPreview(null);

        // Refresh from server to update UI
        await fetchBookings();

        // Navigate to Order Management to see the updated order
        console.log('Order updated successfully, navigating to order management...');
        navigate('/dashboard/order');
      } else {
        const data = response.data;
        console.error('Order update failed:', data);
        alert(data.message || 'Failed to update order.');
      }
    } catch (error) {
      console.error('Error updating order:', error);
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
                  key={booking.id} onClick={() => setSelectedBooking(booking)}
                  className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <h3 className="font-bold text-lg">{booking.name}</h3>
                  <p><span className="font-semibold">Service:</span> {
                    mainServices.find((s) => s.value === booking.mainService)?.label || booking.mainService
                  } (₱{booking.totalPrice})</p>
                  {booking.dryCleaningServices && booking.dryCleaningServices.length > 0 && (
                    <p><span className="font-semibold">Dry Cleaning:</span> {
                      booking.dryCleaningServices.map(id => dryCleaningServices.find(s => s.id === id)?.name).filter(Boolean).join(', ')
                    }</p>
                  )}
                  <p><span className="font-semibold">Pickup:</span> {booking.pickupDate} at {booking.pickupTime}</p>
                  <div className="flex flex-wrap justify-end gap-2 mt-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEditBooking(booking); }}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm transition-colors shadow-sm hover:shadow-md"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteBooking(booking.id); }}
                      disabled={deletingBooking}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors shadow-sm hover:shadow-md disabled:opacity-50"
                    >
                      {deletingBooking ? 'Deleting...' : 'Delete'}
                    </button>
                    {pickupSuccess[booking.id] ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
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
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors shadow-sm hover:shadow-md"
                      >
                        Check Order
                      </button>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); handlePickupNow(booking.id); }}
                        disabled={pickupLoading}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors shadow-sm hover:shadow-md"
                      >
                        {pickupLoading ? 'Sending...' : 'Ready for Pickup'}
                      </button>
                    )}
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
                  <div key={booking.id}
                    onClick={() => setSelectedBooking(booking)}
                    className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
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
                    <div className="flex flex-wrap justify-end gap-2 mt-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleApproveBooking(booking.id); }}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors shadow-sm hover:shadow-md"
                      >
                        Approve
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRejectBooking(booking); }}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors shadow-sm hover:shadow-md"
                      >
                        Reject
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteBooking(booking.id); }}
                        disabled={deletingBooking}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors shadow-sm hover:shadow-md disabled:opacity-50"
                      >
                        {deletingBooking ? 'Deleting...' : 'Delete'}
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
