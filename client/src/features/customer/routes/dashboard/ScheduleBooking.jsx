import React, { useState, useEffect } from 'react';
import apiClient from '../../../../utils/axios';
import { useNavigate } from 'react-router-dom';
import StatusIcon from '../../components/StatusIcon';
import GcashPaymentModal from '../../components/GcashPaymentModal';
import main from "../../../../assets/logo.png";
import io from 'socket.io-client';
import OrderDetailsModal from "../../components/OrderDetailsModal";

// Define free pickup barangays and their fees
const freePickupBarangays = [
  "Lecheria", "San Juan", "San Jose",
  "Looc", "Bañadero",
  "Palingong", "Lingga", "Sampiruhan", "Parian"
];

// Define barangays with special pricing
const barangayPricing = {
  "Mapagong": 30,
  "Bubuyan": 30,
  "Burol": 30,
  "Bucal": 30,
  "Camaligan": 30,
  "La Mesa": 30
};

const ScheduleBooking = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [userDataLoading, setUserDataLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pickup');
  const [orders, setOrders] = useState([]);
  const [editingOrder, setEditingOrder] = useState(null);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showPaymentDetailsModal, setShowPaymentDetailsModal] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [paymentDetails, setPaymentDetails] = useState({
    method: 'cash',
    gcashNumber: '',
    cardNumber: '',
    expiry: '',
    cvv: ''
  });

  // Real-time updates state
  const [realTimeOrders, setRealTimeOrders] = useState([]);

  // Socket connection for real-time updates
  const [socket, setSocket] = useState(null);

  // Establish socket connection for real-time updates
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && userData) {
      const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:8800', {
        auth: { token }
      });

      newSocket.on('connect', () => {
        console.log('Connected to socket server');
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from socket server');
      });

      // Listen for order updates
      newSocket.on('order-update', handleOrderUpdate);
      newSocket.on('new-order', handleNewOrder);
      newSocket.on('booking-to-order', handleBookingToOrder);
      newSocket.on('booking-counts-updated', handleBookingCountsUpdated);

      setSocket(newSocket);

      return () => {
        newSocket.off('order-update', handleOrderUpdate);
        newSocket.off('new-order', handleNewOrder);
        newSocket.off('booking-to-order', handleBookingToOrder);
        newSocket.off('booking-counts-updated', handleBookingCountsUpdated);
        newSocket.disconnect();
      };
    }
  }, [userData]);

  // GCash Payment Modal state
  const [showGcashModal, setShowGcashModal] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null);

  // Handle GCash payment submission
  const handleGcashPaymentSubmit = async (paymentData, orderId) => {
    try {
      const payload = {
        referenceNumber: paymentData.referenceNumber,
        proof: paymentData.proof
      };

      await apiClient.post(`/api/customer/orders/${orderId}/gcash-payment`, payload);

      setShowGcashModal(false); // Close modal on success
    } catch (error) {
      console.error('Error submitting payment:', error);
      alert('Failed to submit payment. Please try again.');
    }
  };

  // Booking form state
  const [formData, setFormData] = useState({
    mainService: 'washDryFold',
    dryCleaningServices: [],
    pickupDate: '',
    pickupTime: '7am-10am',
    loadCount: 1,
    instructions: '',
    status: 'pending',
    paymentMethod: 'cash',
    serviceOption: 'pickupAndDelivery' // New field: 'pickupOnly', 'deliveryOnly', 'pickupAndDelivery'
  });

  // Conflict detection state
  const [hasConflict, setHasConflict] = useState(false);
  const [conflictMessage, setConflictMessage] = useState('');

  // Separate main services and dry cleaning services
  const mainServices = [
    {
      id: 'fullService',
      name: 'Full Service (Wash, Dry & Fold)',
      description: 'Complete laundry service with all supplies included.',
      price: 199,
      priceText: '₱199/load (Detergent, Fabcon, Colorsafe Bleach INCLUDED)'
    },
    {
      id: 'washDryFold',
      name: 'Wash, Dry & Fold',
      description: 'Standard wash, dry, and fold service.',
      price: 179,
      priceText: '₱179/load (Bring your own detergent and fabcon)'
    }
  ];

  const dryCleaningServices = [
    {
      id: 'dryCleanBarong',
      name: 'Dry Cleaning - Barong',
      description: 'Professional dry cleaning for barong. Pricing varies by item - inspection required.',
      price: 0, // Pricing varies, no fixed price
      priceText: 'Starting from ₱350 - Visit shop for inspection'
    },
    {
      id: 'dryCleanCoat',
      name: 'Dry Cleaning - Coat',
      description: 'Professional dry cleaning for coat. Pricing varies by item - inspection required.',
      price: 0, // Pricing varies, no fixed price
      priceText: 'Starting from ₱400 - Visit shop for inspection'
    },
    {
      id: 'dryCleanGown',
      name: 'Dry Cleaning - Gown',
      description: 'Professional dry cleaning for gown. Pricing varies by item - inspection required.',
      price: 0, // Pricing varies, no fixed price
      priceText: 'Starting from ₱650 - Visit shop for inspection'
    },
    {
      id: 'dryCleanWeddingGown',
      name: 'Dry Cleaning - Wedding Gown',
      description: 'Professional dry cleaning for wedding gown. Pricing varies by item - inspection required.',
      price: 0, // Pricing varies, no fixed price
      priceText: 'Starting from ₱1,500 - Visit shop for inspection'
    },
  ];



  // Calculate delivery fee based on barangay and load count
  const calculateDeliveryFee = (barangay, loadCount) => {
    if (!barangay) return 0;

    // Check if barangay is in free pickup list and loadCount >= 2 for free delivery
    const isFree = freePickupBarangays.some(freeBrgy =>
      barangay.toLowerCase().includes(freeBrgy.toLowerCase().split(' ')[0])
    );

    if (isFree && loadCount >= 2) return 0;

    // Check for special pricing
    for (const [brgy, fee] of Object.entries(barangayPricing)) {
      if (barangay.toLowerCase().includes(brgy.toLowerCase())) {
        return fee;
      }
    }

    // Default fee for other areas
    return 30;
  };

  // Helper function to normalize date to YYYY-MM-DD format
  const normalizeDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  };

  // Available pickup dates (next 7 days, plus selected date if editing)
  const getPickupDates = (selectedDate = null) => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);
      const fullDate = normalizeDate(date);
      dates.push({
        date: date.getDate(),
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        fullDate
      });
    }

    // If selectedDate is provided and not already in dates, add it
    if (selectedDate) {
      const normalizedSelected = normalizeDate(selectedDate);
      if (!dates.some(d => d.fullDate === normalizedSelected)) {
        const selDate = new Date(selectedDate);
        dates.push({
          date: selDate.getDate(),
          day: selDate.toLocaleDateString('en-US', { weekday: 'short' }),
          fullDate: normalizedSelected
        });
        // Sort dates by fullDate to maintain order
        dates.sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));
      }
    }

    return dates;
  };

  // State for the pickup dates to be displayed
  const [pickupDates, setPickupDates] = useState(getPickupDates());

  // State for booking counts
  const [bookingCounts, setBookingCounts] = useState({});
  const [countsLoading, setCountsLoading] = useState(false);

  // Fetch booking counts for displayed dates
  const fetchBookingCounts = async () => {
    try {
      setCountsLoading(true);
      const dateStrings = pickupDates.map(date => date.fullDate);
      const response = await apiClient.get('/api/customer/calendar-bookings', {
        params: { dates: dateStrings.join(',') }
      });
      setBookingCounts(response.data || {});
    } catch (error) {
      console.error('Error fetching booking counts:', error);
      // Set empty counts on error to allow booking
      setBookingCounts({});
    } finally {
      setCountsLoading(false);
    }
  };

  // Fetch counts when pickup dates change
  useEffect(() => {
    if (pickupDates.length > 0) {
      fetchBookingCounts();
    }
  }, [pickupDates]);

  // Fetch user data and orders
  useEffect(() => {
      const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        const userRes = await apiClient.get('/auth/me');
        console.log('ScheduleBooking: Fetched user data:', userRes.data);
        setUserData(userRes.data);
        setUser({ id: userRes.data.user_id, name: `${userRes.data.firstName} ${userRes.data.lastName}` });

        // Only proceed if user data is successfully fetched
        if (userRes.data && userRes.data.user_id) {
          if (userRes.data.barangay) {
            setDeliveryFee(calculateDeliveryFee(userRes.data.barangay, formData.loadCount));
          }
        }
      } catch (error) {
        console.error('Error fetching user data or orders:', error);
        navigate('/login');
      } finally {
        console.log('ScheduleBooking: User data loading finished.');
        setUserDataLoading(false);
      }
    };
    fetchUserData();
  }, [navigate]);

  console.log('ScheduleBooking: Current userData state:', userData);
  // Recalculate delivery fee when loadCount changes
  useEffect(() => {
    if (userData && userData.barangay) {
      setDeliveryFee(calculateDeliveryFee(userData.barangay, formData.loadCount));
    }
  }, [formData.loadCount, userData]);

  // Fetch orders and booking counts once userData is available
  useEffect(() => {
    const fetchOrdersAndCounts = async () => {
      console.log('ScheduleBooking: fetchOrdersAndCounts triggered. userData:', userData);
      if (userData && userData.user_id) {
        try {
          // Fetch only historical orders (completed, rejected, cancelled) for the 'My Bookings' tab
          const ordersRes = await apiClient.get('/api/customer/orders?page=1&limit=100');
          const ordersData = ordersRes.data.orders || [];
          console.log('ScheduleBooking: Orders API response data:', ordersRes.data);

      // Transform data to match frontend expectations
      const transformedOrders = ordersData.map(order => ({
        ...order,
        id: order.service_orders_id || order.id,
        order_id: order.service_orders_id || order.id,
        booking_id: order.service_orders_id || order.id, // Unified ID
        mainService: order.service_type,
        dryCleaningServices: order.dry_cleaning_services || [], // Simplified, backend already parses
        pickupDate: order.pickup_date,
        pickupTime: order.pickup_time,
        loadCount: order.load_count || 1,
        instructions: order.instructions || '',
        status: order.status || 'pending_booking',
        paymentMethod: order.payment_method || 'cash',
        paymentStatus: order.payment_status || 'unpaid',
        totalPrice: parseFloat(order.totalPrice) || 0, // Explicit parseFloat
        photos: order.photos || [], // Simplified, backend already parses
        laundryPhoto: order.laundry_photos || [], // Simplified, backend already parses
        createdAt: order.created_at || order.createdAt,
        serviceOption: order.service_option || 'pickupAndDelivery',
        deliveryFee: order.delivery_fee || 0
      }));

      // Filter out completed and paid orders (move to booking history)
      const filteredOrders = transformedOrders.filter(order =>
        !(order.status === 'completed' && order.paymentStatus === 'paid')
      );

      console.log('ScheduleBooking: Transformed orders:', transformedOrders);
      console.log('ScheduleBooking: Filtered orders (excluding completed & paid):', filteredOrders);
      setOrders(filteredOrders);
        } catch (error) {
          console.error('Error fetching orders:', error);
          // If API fails, you might want to show an error message.
          // For now, it will just show an empty list.
        }
      }
    };

    fetchOrdersAndCounts();
  }, [userData]); // This effect now correctly depends on the userData state




  // Update pickup dates when selected date changes
  useEffect(() => {
    setPickupDates(getPickupDates(formData.pickupDate));
  }, [formData.pickupDate]);

  // Function to check for booking conflicts
  const checkForBookingConflict = async (pickupDate, pickupTime) => {
    if (!pickupDate || !pickupTime || !userData?.user_id) {
      return false;
    }

    try {
      const response = await apiClient.get('/api/customer/orders?page=1&limit=100');
      const ordersData = response.data.orders || [];

      // Check if user already has a booking for this date and time
      const conflict = ordersData.some(order =>
        order.pickup_date === pickupDate &&
        order.pickup_time === pickupTime &&
        order.status !== 'completed' &&
        order.status !== 'cancelled' &&
        order.status !== 'rejected'
      );

      return conflict;
    } catch (error) {
      console.error('Error checking for booking conflicts:', error);
      return false; // Allow booking if check fails
    }
  };

  const handleChange = async (e) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };
    setFormData(newFormData);

    // Check for conflicts when date or time changes
    if (name === 'pickupDate' || name === 'pickupTime') {
      const hasConflict = await checkForBookingConflict(
        name === 'pickupDate' ? value : formData.pickupDate,
        name === 'pickupTime' ? value : formData.pickupTime
      );

      setHasConflict(hasConflict);
      if (hasConflict) {
        setConflictMessage('You already have a booking at this date and time.');
      } else {
        setConflictMessage('');
      }
    }
  };


  const handlePaymentMethodChange = (method) => {
    setPaymentDetails(prev => ({ ...prev, method }));
    setFormData(prev => ({ ...prev, paymentMethod: method }));

    if (method === 'gcash' || method === 'card') {
      setShowPaymentDetailsModal(true);
    }
  };

  const handleServiceOptionChange = (option) => {
    setFormData(prev => ({ ...prev, serviceOption: option }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.pickupDate) {
      alert('Please select a pickup date');
      return;
    }

    if (!formData.mainService) {
      alert('Please select a main service');
      return;
    }

    if (!userData || !userData.barangay || !userData.street) {
      alert('Please complete your profile information first');
      navigate('/profile');
      return;
    }

    // Check for booking conflicts before proceeding
    if (hasConflict) {
      alert(conflictMessage);
      return;
    }

    // Show confirmation before final submission
    setShowConfirmation(true);
  };

  const confirmOrder = async () => {
    try {
      setLoading(true);

      const bookingPayload = {
        service_type: formData.mainService,
        // The backend expects a JSON string of IDs, not an array of objects for updates.
        dry_cleaning_services: JSON.stringify(formData.dryCleaningServices || []),
        pickup_date: formData.pickupDate,
        pickup_time: formData.pickupTime,
        load_count: formData.loadCount,
        instructions: formData.instructions,
        status: 'pending_booking', // New initial status for a booking request
        payment_method: formData.paymentMethod,
        firstName: userData.firstName,
        lastName: userData.lastName,
        contact: userData.contact,
        email: userData.email,
        barangay: userData.barangay,
        street: userData.street,
        blockLot: userData.blockLot,
        photos: [],
        service_option: formData.serviceOption,
        delivery_fee: formData.serviceOption === 'pickupOnly' ? 0 : deliveryFee,
        user_id: user.id, // This should be correct as `user` state is set with user_id
      };

      if (editingOrder) {
        // Update existing service order - only send order-specific fields
        const orderUpdatePayload = {
          service_type: formData.mainService,
          dry_cleaning_services: JSON.stringify(formData.dryCleaningServices || []),
          pickup_date: formData.pickupDate,
          pickup_time: formData.pickupTime,
          load_count: formData.loadCount,
          instructions: formData.instructions,
          service_option: formData.serviceOption,
          delivery_fee: formData.serviceOption === 'pickupOnly' ? 0 : deliveryFee,
        };
        await apiClient.put(`/api/customer/orders/${editingOrder.id}`, orderUpdatePayload);
        alert('Order updated successfully!');
      } else {
        // Create new service order (as a booking request)
        await apiClient.post('/api/customer/orders', bookingPayload);
        alert('Booking submitted successfully! Our team will review your request.');
      }

      setShowConfirmation(false);
      setEditingOrder(null);
      resetForm();
      setActiveTab('orders');

      // Refresh booking counts after successful booking
      fetchBookingCounts();

      // Refresh orders
      const ordersRes = await apiClient.get('/api/customer/orders?page=1&limit=100'); // This is for refreshing after booking
      const ordersData = ordersRes.data.orders || []; // Correctly extracts from nested object

      // Transform data to match frontend expectations
      const transformedOrders = ordersData.map(order => { 
        return {
          ...order,
          id: order.service_orders_id || order.id,
          order_id: order.service_orders_id || order.id,
          booking_id: order.service_orders_id || order.id, // Unified ID
          mainService: order.service_type,
          dryCleaningServices: order.dry_cleaning_services || [], // Simplified
          pickupDate: order.pickup_date,
          pickupTime: order.pickup_time,
          loadCount: order.load_count || 1,
          instructions: order.instructions || '',
          status: order.status || 'pending_booking',
          paymentMethod: order.payment_method || 'cash',
          paymentStatus: order.payment_status || 'unpaid',
          totalPrice: parseFloat(order.totalPrice) || 0, // Explicit parseFloat
          photos: order.photos || [], // Simplified
          laundryPhoto: order.laundry_photos || [], // Simplified
          createdAt: order.created_at || order.createdAt,
          serviceOption: order.service_option || 'pickupAndDelivery',
          deliveryFee: order.delivery_fee || 0
        };
      });
      setOrders(transformedOrders);

    } catch (error) {
      console.error('Error saving order:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save order. Please try again.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (order) => {
    setEditingOrder(order); // This will be used to know we are in "edit mode"
    setFormData({
      mainService: order.mainService || 'washDryFold',
      dryCleaningServices: order.dryCleaningServices || [],
      pickupDate: order.pickupDate,
      pickupTime: order.pickupTime,
      loadCount: order.loadCount || 1,
      instructions: order.instructions,
      paymentMethod: order.paymentMethod,
      status: order.status, // This will be 'pending_booking' for an editable order
      serviceOption: order.serviceOption || 'pickupAndDelivery'
    });
    // Also set payment details to show selected payment method
    setPaymentDetails(prev => ({ ...prev, method: order.paymentMethod || 'cash' }));
    setActiveTab('pickup');
  };

  const handleCancel = async (orderId) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      try {
        setLoading(true);
        // To cancel a 'pending_booking', we use the customer-specific endpoint.
        await apiClient.put(`/api/customer/orders/${orderId}/cancel`);
        alert('Order cancelled successfully!');

        // Refresh orders using unified endpoint
        const ordersRes = await apiClient.get('/api/customer/orders?page=1&limit=100');
        const ordersData = Array.isArray(ordersRes.data) ? ordersRes.data : ordersRes.data.orders || [];

        // Transform data to match frontend expectations
        const transformedOrders = ordersData.map(order => ({
          ...order,
          id: order.service_orders_id || order.id,
          order_id: order.service_orders_id || order.id,
          booking_id: order.service_orders_id || order.id, // Unified ID
          mainService: order.service_type,
          dryCleaningServices: order.dry_cleaning_services || [], // Simplified
          pickupDate: order.pickup_date,
          pickupTime: order.pickup_time,
          loadCount: order.load_count || 1,
          instructions: order.instructions || '',
          status: order.status || 'pending_booking',
          paymentMethod: order.payment_method || 'cash',
          paymentStatus: order.payment_status || 'unpaid',
          totalPrice: parseFloat(order.totalPrice) || 0, // Explicit parseFloat
          photos: order.photos || [],
          laundryPhoto: order.laundry_photos || [],
          createdAt: order.created_at || order.createdAt,
          serviceOption: order.service_option || 'pickupAndDelivery',
          deliveryFee: order.delivery_fee || 0
        }));

        setOrders(transformedOrders);
      } catch (error) {
        console.error('Error cancelling order:', error);
        alert('Failed to cancel order. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleArchive = (orderId) => {
    if (window.confirm('Are you sure you want to archive this booking? It will be removed from your bookings list.')) {
      setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
    }
  };

  const resetForm = () => {
    setFormData({
      mainService: 'washDryFold',
      dryCleaningServices: [],
      pickupDate: '',
      pickupTime: '7am-10am',
      loadCount: 1,
      instructions: '',
      status: 'pending_booking',
      paymentMethod: 'cash',
      serviceOption: 'pickupAndDelivery'
    });
    setPaymentDetails({
      method: 'cash',
      gcashNumber: '',
      cardNumber: '',
      expiry: '',
      cvv: ''
    });
    setEditingOrder(null);
  };

  // Real-time update handlers
  const handleOrderUpdate = (type, data) => {
    console.log('Order update received:', type, data);

    switch (type) {
      case 'created':
      case 'updated':
      case 'status_advanced':
      case 'global_status_changed':
        // Update existing order in the list
        setOrders(prevOrders =>
          prevOrders.map(order =>
            (order.id === data.id || order.id === data.orderId || order.booking_id === data.id) ?
              { ...order, ...data, status: data.status || data.newStatus || order.status } :
              order
          )
        );
        break;

      case 'your-order-created':
      case 'your-order-updated':
      case 'your-order-status-advanced':
        // Update specific user's order
        setOrders(prevOrders =>
          prevOrders.map(order =>
            (order.id === data.orderId || order.booking_id === data.orderId) ?
              { ...order, ...data, status: data.newStatus || data.status || order.status } :
              order
          )
        );
        break;

      default:
        console.log('Unhandled order update type:', type);
        break;
    }
  };

  // Handle real-time booking counts updates
  const handleBookingCountsUpdated = (data) => {
    console.log('Booking counts updated:', data);
    // Refresh booking counts for all displayed dates
    fetchBookingCounts();
  };

  const handleNewOrder = (newOrder) => {
    console.log('New order received:', newOrder);
    // Add new order to the beginning of the list
    setOrders(prevOrders => [newOrder, ...prevOrders]);
  };

  const handleBookingToOrder = (bookingData) => {
    console.log('Booking converted to order:', bookingData);
    // Handle when admin converts booking to order - set status to 'pending' as order starts with pending status
    setOrders(prevOrders =>
      prevOrders.map(order => {
        // Match by the original booking ID. The `order.id` on the client is the booking's ID.
        if (Number(order.id) === Number(bookingData.bookingId)) {
          // This is the booking that was converted. Update it to become an order.
          return { ...order, status: 'pending', order_id: bookingData.order_id, paymentStatus: 'unpaid', payment_status: 'pending' };
        }
        return order;
      })
    );
  };

  if (userDataLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (!userData || !userData.barangay || !userData.street) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Profile Incomplete</h2>
          <p className="mb-4">Please complete your profile information before booking.</p>
          <button
            onClick={() => navigate('/customer-dashboard/profile')}
            className="bg-pink-600 text-white px-4 py-2 rounded-md hover:bg-pink-700"
          >
            Complete Profile
          </button>
        </div>
      </div>
    );
  }

  const selectedMainService = mainServices.find(s => s.id === formData.mainService);
  const selectedDryCleaningServices = dryCleaningServices.filter(s => formData.dryCleaningServices.includes(s.id));
  const mainServicePrice = selectedMainService ? selectedMainService.price * formData.loadCount : 0;
  const dryCleaningPrice = selectedDryCleaningServices.reduce((sum, s) => sum + s.price, 0);
  const totalPrice = mainServicePrice + (formData.serviceOption === 'pickupOnly' ? 0 : deliveryFee);

  return (
    <div className="min-h-fit bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-pink-600 mb-8">
          Welcome back, {userData.firstName}! - Laundry Booking
        </h1>

        {/* Hero Banner Image to Attract Customers */}
<div className="mb-8 rounded-lg overflow-hidden shadow-lg relative">
  <img
      src={main}
    alt="Professional Laundry and Dry Cleaning Services"
    className="w-full h-48 object-cover"
  />
  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
  <div className="absolute top-4 left-4 text-white">
    <h2 className="text-xl font-bold mb-1">Welcome, {userData.firstName}!</h2>
    <p className="text-sm opacity-90">Ready for fresh, clean laundry?</p>
  </div>
  <div className="relative p-6 bg-white">
    <h2 className="text-2xl font-bold text-pink-600 mb-2">Fresh, Clean, and Delivered to Your Door</h2>
    <p className="text-gray-600">Book your laundry pickup today and enjoy hassle-free service with a smile!</p>
  </div>
</div>
        {/* Tabs */}
        <div className="flex border-b mb-6">
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'pickup' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('pickup')}
          >
            Schedule a Pickup
          </button>
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'orders' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('orders')}
          >
            My Bookings
          </button>
        </div>

        {/* Main Content Area */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Pickup Form */}
          {activeTab === 'pickup' && !showConfirmation && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-4">Choose Your Service</h2>
                {/* Service Selection Image */}

          {/* Main Services */}
<div className="mb-6">
  <h3 className="text-lg font-semibold mb-3">Laundry Services</h3>
  <div className="space-y-3">
    {mainServices.map(service => (
      <div
        key={service.id}
        className={`p-4 border rounded-lg cursor-pointer ${
          formData.mainService === service.id
            ? 'border-pink-500 bg-pink-50'
            : 'border-gray-200'
        }`}
        onClick={() =>
          setFormData(prev => ({
            ...prev,
            mainService:
              prev.mainService === service.id ? '' : service.id // toggle selection
          }))
        }
      >
        <div className="flex items-start">
          <input
            type="checkbox" // changed to checkbox to allow unchecking
            id={service.id}
            name="mainService"
            checked={formData.mainService === service.id}
            onChange={() =>
              setFormData(prev => ({
                ...prev,
                mainService:
                  prev.mainService === service.id ? '' : service.id // same toggle logic
              }))
            }
            className="mt-1"
          />
          <div className="ml-3">
            <label htmlFor={service.id} className="font-medium">
              {service.name}
            </label>
            <p className="text-sm text-gray-600">{service.description}</p>
            <p className="text-sm text-pink-600 mt-1">{service.priceText}</p>
          </div>
        </div>
      </div>
    ))}
  </div>
</div>


                {/* Dry Cleaning Services */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Dry Cleaning Services (Optional)</h3>
             
                  <div className="space-y-3">
                    {dryCleaningServices.map(service => (
                      <div
                        key={service.id}
                        className={`p-4 border rounded-lg cursor-pointer ${formData.dryCleaningServices.includes(service.id) ? 'border-pink-500 bg-pink-50' : 'border-gray-200'}`}
                        onClick={() => {
                          const isSelected = formData.dryCleaningServices.includes(service.id);
                          setFormData(prev => ({
                            ...prev,
                            dryCleaningServices: isSelected
                              ? prev.dryCleaningServices.filter(id => id !== service.id)
                              : [...prev.dryCleaningServices, service.id]
                          }));
                        }}
                      >
                        <div className="flex items-start">
                          <input
                            type="checkbox"
                            id={service.id}
                            name="dryCleaningServices"
                            checked={formData.dryCleaningServices.includes(service.id)}
                            onChange={() => {}}
                            className="mt-1"
                          />
                          <div className="ml-3">
                            <label htmlFor={service.id} className="font-medium">{service.name}</label>
                            <p className="text-sm text-gray-600">{service.description}</p>
                            <p className="text-sm text-pink-600 mt-1">{service.priceText}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Service Option Selection */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Service Option</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleServiceOptionChange('pickupOnly')}
                    className={`p-4 border rounded-lg text-center ${formData.serviceOption === 'pickupOnly' ? 'border-pink-500 bg-pink-50' : 'border-gray-200'}`}
                  >
                    <h3 className="font-medium">Pickup Only</h3>
                    <p className="text-sm text-gray-600">We'll pick up your laundry and you'll collect it at our location</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleServiceOptionChange('pickupAndDelivery')}
                    className={`p-4 border rounded-lg text-center ${formData.serviceOption === 'pickupAndDelivery' ? 'border-pink-500 bg-pink-50' : 'border-gray-200'}`}
                  >
                    <h3 className="font-medium">Pickup & Delivery</h3>
                    <p className="text-sm text-gray-600">We'll pick up your laundry and deliver it back to you</p>
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Pickup Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date *</label>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                      {pickupDates.map((date) => {
                        const count = bookingCounts[date.fullDate] || 0;
                        const isOverbooked = count >= 3; // Max 3 bookings per date
                        return (
                          <button
                            key={date.fullDate}
                            type="button"
                            onClick={() => !isOverbooked && setFormData(prev => ({ ...prev, pickupDate: date.fullDate }))}
                            disabled={isOverbooked}
                            className={`py-2 text-center rounded relative ${
                              formData.pickupDate === date.fullDate
                                ? 'bg-pink-600 text-white'
                                : isOverbooked
                                ? 'bg-red-500 text-white cursor-not-allowed'
                                : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                          >
                            <div className="text-xs">{date.day}</div>
                            <div className="font-medium">{date.date}</div>
                            <div className={`text-xs mt-1 ${isOverbooked ? 'text-white font-bold' : 'text-gray-600'}`}>
                              {isOverbooked ? 'FULL' : `${count}/3`}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Time *</label>
                    <select
                      name="pickupTime"
                      value={formData.pickupTime}
                      onChange={handleChange}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:border-pink-500 focus:ring-pink-500"
                    >
                      <option value="7am-10am">Morning (7am-10am)</option>
                      <option value="5pm-7pm">Afternoon (5pm-7pm)</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      We'll contact you 30 minutes before arrival
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Load Count *</label>
                    <select
                      name="loadCount"
                      value={formData.loadCount}
                      onChange={handleChange}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:border-pink-500 focus:ring-pink-500"
                    >
                      <option value={1}>1 Load</option>
                      <option value={2}>2 Loads</option>
                      <option value={3}>3 Loads</option>
                      <option value={4}>4 Loads</option>
                      <option value={5}>5 Loads</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Minimum 2 loads for free delivery in selected areas
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Order Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handlePaymentMethodChange('cash')}
                        className={`p-2 text-center text-sm rounded ${paymentDetails.method === 'cash' ? 'bg-pink-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                      >
                        Cash
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePaymentMethodChange('gcash')}
                        className={`p-2 text-center text-sm rounded ${paymentDetails.method === 'gcash' ? 'bg-pink-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                      >
                        GCash
                      </button>
                     
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
                <textarea
                  name="instructions"
                  value={formData.instructions}
                  onChange={handleChange}
                  rows={3}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-pink-500 focus:ring-pink-500"
                  placeholder="Any special instructions for your laundry..."
                ></textarea>
              </div>

              <div className="bg-pink-50 p-4 rounded-lg mb-6">
                <h3 className="font-medium text-pink-800 mb-2">Service Notes:</h3>
                <ul className="list-disc list-inside text-sm text-pink-700 space-y-1">
                  <li>Free pickup and delivery for selected barangays</li>
                  <li>Other areas may have additional fees (see below)</li>
                  <li>Payment upon pickup for cash payments</li>
                  <li>For dry cleaning services, please visit our shop for inspection and final pricing</li>
                  <li>Contact us at 0968-856-3288 for questions</li>
                </ul>

                {/* Delivery Fee Information */}
                <div className="mt-3">
                  <h4 className="font-medium text-pink-800">Delivery Fees:</h4>
                  <ul className="text-sm text-pink-700 space-y-1">
                    <li>✅ Free for: Brgy. 1-7, Lecheria, San Juan, San Jose, Looc, Bañadero, Palingon, Lingga, Sampiruhan, Parian</li>
                    <li>₱65 for: Mapagong, Bubuyan, Burol</li>
                    <li>₱40 for: Bucal, Camaligan, La Mesa</li>
                    <li>₱30 for all other areas</li>
                  </ul>
                  {deliveryFee > 0 && formData.serviceOption !== 'pickupOnly' && (
                    <p className="mt-2 font-medium">
                      Your area ({userData.barangay}) has a delivery fee of ₱{deliveryFee}
                    </p>
                  )}
                </div>
              </div>

              {/* Conflict Alert */}
              {hasConflict && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm font-medium text-red-800">{conflictMessage}</p>
                </div>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !formData.pickupDate || hasConflict}
                className="w-full bg-pink-600 hover:bg-pink-700 text-white font-medium py-3 px-4 rounded-md disabled:opacity-50"
              >
                {loading ? 'Processing...' : editingOrder ? 'Update Order' : 'Review Order'}
              </button>
            </div>
          )}

          {/* Order Confirmation */}
          {activeTab === 'pickup' && showConfirmation && (
            <div className="p-6">
              <h2 className="text-2xl font-bold text-pink-600 mb-6">Review Your Order</h2>

              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="font-bold text-lg mb-3">Service Details</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-gray-600">Main Service:</p>
                    <p className="font-medium">{selectedMainService?.name || 'None selected'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Service Option:</p>
                    <p className="font-medium">
                      {formData.serviceOption === 'pickupOnly' ? 'Pickup Only' :
                       formData.serviceOption === 'deliveryOnly' ? 'Delivery Only' : 'Pickup & Delivery'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Pickup Date:</p>
                    <p className="font-medium">
                      {new Date(formData.pickupDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Pickup Time:</p>
                    <p className="font-medium">
                      {formData.pickupTime === '7am-10am' ? 'Morning (7am-10am)' : 'Afternoon (5pm-7pm)'}
                    </p>
                  </div>
                  {selectedDryCleaningServices.length > 0 && (
                    <div className="col-span-2">
                      <p className="text-gray-600">Dry Cleaning Services:</p>
                      <p className="font-medium">
                        {selectedDryCleaningServices.map(s => s.name).join(', ')}
                      </p>
                    </div>
                  )}
                </div>

                {formData.instructions && (
                  <div className="mb-4">
                    <p className="text-gray-600">Special Instructions:</p>
                    <p className="font-medium">{formData.instructions}</p>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="font-bold text-lg mb-3">Delivery Information</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-gray-600">Name:</p>
                    <p className="font-medium">{userData.firstName} {userData.lastName}</p>
                  </div>

                  <div>
                    <p className="text-gray-600">Contact:</p>
                    <p className="font-medium">{userData.contact || 'Not provided'}</p>
                  </div>

                  <div className="col-span-2">
                    <p className="text-gray-600">Address:</p>
                    <p className="font-medium">
                      {userData.street}{userData.blockLot ? `, Block ${userData.blockLot}` : ''}, {userData.barangay}, Calamba City
                    </p>
                  </div>

                </div>

                {formData.serviceOption !== 'pickupOnly' && (
                  <div className="border-t pt-3">
                    <p className="text-gray-600">Delivery Fee:</p>
                    <p className="font-medium">
                      {deliveryFee === 0 ? 'FREE (Your barangay is in our free delivery area)' : `₱${deliveryFee}`}
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="font-bold text-lg mb-3">Payment Summary</h3>
                <div className="space-y-2">
                  {selectedMainService && (
                    <div className="flex justify-between">
                      <span>Main Service ({selectedMainService.name}):</span>
                      <span>Estimated Total ₱{mainServicePrice}</span>
                    </div>
                  )}
                  {selectedDryCleaningServices.length > 0 && (
                    <div className="flex justify-between">
                      <span>Dry Cleaning ({selectedDryCleaningServices.length} item{selectedDryCleaningServices.length > 1 ? 's' : ''}):</span>
                      <span>Pricing varies - inspection required</span>
                    </div>
                  )}
                  {formData.serviceOption !== 'pickupOnly' && (
                    <div className="flex justify-between">
                      <span>Delivery Fee:</span>
                      <span>{deliveryFee === 0 ? 'FREE' : `₱${deliveryFee}`}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 font-bold flex justify-between">
                    <span>SubTotal:</span>
                    <span>₱{totalPrice}</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <h3 className="font-bold text-lg mb-3">Booking Confirmation</h3>
                <p className="text-blue-800">
                  Please check your email for confirmation of your booking. If your booking is approved, your laundry will be ready in approximately 24-48 hours.
                </p>
              </div>

              <div className="flex justify-between space-x-4">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-3 px-4 rounded-md"
                >
                  Back to Edit
                </button>
                <button
                  onClick={confirmOrder}
                  disabled={loading}
                  className="flex-1 bg-pink-600 hover:bg-pink-700 text-white font-medium py-3 px-4 rounded-md disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Confirm Order'}
                </button>
              </div>
            </div>
          )}

          {/* Orders List */}
          {activeTab === 'orders' && (
            <div className="divide-y">
              {orders.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  You don't have any orders yet.
                </div>
              ) : (
                orders.map((order, index) => (
                  <div key={order.id || index} className="p-6 cursor-pointer">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium" onClick={() => setSelectedOrderForDetails(order)}>
                          {order.order_id && <span className="text-gray-500">Order #{order.order_id} - </span>}
                          {!order.order_id && order.booking_id && <span className="text-gray-500">Booking #{order.booking_id} - </span>}
                          {!order.order_id && !order.booking_id && order.id && <span className="text-gray-500">Booking #{order.id} - </span>}

                          {mainServices.find(s => s.id === order.mainService)?.name || order.mainService}
                          {order.dryCleaningServices && order.dryCleaningServices.length > 0 && (
                            <span className="text-sm text-gray-500">
                              {' + ' + order.dryCleaningServices.map(id => dryCleaningServices.find(s => s.id === id)?.name).join(', ')}
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {new Date(order.pickupDate).toLocaleDateString()} at {order.pickupTime}
                        </p>
                        <div className="text-sm text-gray-600">Status: <StatusIcon status={order.status} /></div>
                        {order.status === 'rejected' && order.rejectionReason && (
                          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm font-medium text-red-800 mb-1">Rejection Reason:</p>
                            <p className="text-sm text-red-700">{order.rejectionReason}</p>
                          </div>
                        )}
                        <p className="text-sm text-gray-600">Total: ₱{order.totalPrice}</p>
                      </div>
                      <div className="flex space-x-2">
                        {order.status === 'pending_booking' && (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleEdit(order); }}
                              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                              Edit
                            </button>

                            <button // This button is for cancelling a booking before it becomes an order
                              onClick={(e) => { e.stopPropagation(); handleCancel(order.id); }}
                              className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                            >
                              Cancel
                            </button>
                          </>
                        )}

                        {order.paymentMethod === 'gcash' &&
                          order.order_id &&
                          (order.paymentStatus === 'unpaid' || order.paymentStatus === 'gcash_pending') && // Customer can pay if unpaid or if previous GCash payment is pending review
                          order.status !== 'completed' &&
                          order.status !== 'cancelled' &&
                          order.status !== 'pending_booking' && // Hide if it's just a booking request
                          order.status !== 'approved' && // Hide if booking is approved but not yet a processed order
                          (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrderForPayment(order);
                              setShowGcashModal(true);
                            }}
                            className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                          >
                            Pay with GCash
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrderForDetails && (
        <OrderDetailsModal
          selectedOrder={selectedOrderForDetails}
          setSelectedOrder={setSelectedOrderForDetails}
        />
      )}

      {/* Booking Submitted Modal */}
      {showPaymentDetailsModal && (
        <div className="fixed inset-0  bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">

            <div className="bg-gray-100 p-4 rounded mb-4 text-sm text-gray-700">

              <ul className="list-disc list-inside mt-2">
                <li>GCash</li>

              </ul>
            </div>
            <div className="bg-yellow-100 p-3 rounded text-yellow-800 text-sm mb-4">
              No payment is required at this time. Please wait for a confirmation message before proceeding.
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowPaymentDetailsModal(false)}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowPaymentDetailsModal(false)}
                className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-md"
              >
                Ok
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GCash Payment Modal */}
      {showGcashModal && selectedOrderForPayment && (
        <GcashPaymentModal
          isOpen={showGcashModal}
          onClose={() => setShowGcashModal(false)}
          amount={selectedOrderForPayment.totalPrice}
          orderId={selectedOrderForPayment.order_id || selectedOrderForPayment.booking_id || selectedOrderForPayment.id}
          onSubmit={handleGcashPaymentSubmit}
        />
      )}


    </div>
  );
};

export default ScheduleBooking;