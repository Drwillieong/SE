
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Modal from 'react-modal';
import OrderDetailsModal from '../../components/OrderDetailsModal';
import PaymentReviewModal from '../../components/PaymentReviewModal';
import TimerDisplay from '../../components/TimerDisplay';
import TimerProgressBar from '../../components/TimerProgressBar';
import StatusIcon from '../../components/StatusIcon';
import apiClient from '../../../../utils/axios';
// API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8800';

// Initialize modal
Modal.setAppElement('#root');

// Status options for filtering
const statusOptions = [
  { value: 'all', label: 'All Orders' },
  { value: 'pending', label: 'Pending' },
  { value: 'washing', label: 'Washing' },
  { value: 'drying', label: 'Drying' },
  { value: 'folding', label: 'Folding' },
  { value: 'ready', label: 'Ready' },
  { value: 'completed', label: 'Completed' }
];

// Service type options
const serviceOptions = [
  { value: 'washFold', label: 'Wash & Fold' },
  { value: 'dryCleaning', label: 'Dry Cleaning' },
  { value: 'hangDry', label: 'Hang Dry' }
];

const OrderManagement = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [timerStatuses, setTimerStatuses] = useState({});
  const [loadingStatus, setLoadingStatus] = useState({});
  const [userId, setUserId] = useState(null);
  const [paymentReviewModalOpen, setPaymentReviewModalOpen] = useState(false);

  // Load timer statuses from localStorage on mount
  useEffect(() => {
    const savedTimerStatuses = localStorage.getItem('orderTimerStatuses');
    if (savedTimerStatuses) {
      try {
        const parsed = JSON.parse(savedTimerStatuses);
        // Clean up expired timers
        const now = Date.now();
        const cleanedTimers = {};
        Object.entries(parsed).forEach(([orderId, timer]) => {
          if (timer.isActive && (now - timer.startTime) < timer.duration) {
            cleanedTimers[orderId] = timer;
          }
        });
        setTimerStatuses(cleanedTimers);
      } catch (error) {
        console.error('Error loading timer statuses from localStorage:', error);
      }
    }
  }, []);

  // Save timer statuses to localStorage whenever they change
  useEffect(() => {
    if (Object.keys(timerStatuses).length > 0) {
      localStorage.setItem('orderTimerStatuses', JSON.stringify(timerStatuses));
    } else {
      localStorage.removeItem('orderTimerStatuses');
    }
  }, [timerStatuses]);

  useEffect(() => {
    console.log('OrderManagement component mounted/updated');
    fetchOrders();
    fetchStats();

    // Get user ID from token or localStorage
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserId(payload.userId || payload.id);
      } catch (error) {
        console.error('Error parsing token:', error);
      }
    }

    // Check if we need to refresh due to order creation
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('refresh') === 'true') {
      // Remove the refresh parameter from URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);

      // Show success message
      setTimeout(() => {
        alert('Order created successfully! The new order should now be visible.');
      }, 1000);
    }

    // Set up periodic refresh every 30 seconds
    const intervalId = setInterval(() => {
      fetchOrders();
      fetchStats();
    }, 30000);

    return () => clearInterval(intervalId);
  }, []);

  // Fetch timer statuses for all orders
  useEffect(() => {
    const fetchAllTimerStatuses = async () => {
      if (orders.length > 0) {
        const timerPromises = orders.map(order => {
          // If a timer is active, we just need to set it up locally
          if (['washing', 'drying', 'folding'].includes(order.status)) {
            startLocalTimer(order.order_id, order.status);
          }
        });
        await Promise.all(timerPromises);
      }
    };

    fetchAllTimerStatuses();
  }, [orders]);

  // Filter and sort orders when dependencies change
  useEffect(() => {
    let filtered = [...orders];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.contact.includes(searchTerm) ||
        order.order_id.toString().includes(searchTerm)
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'status':
        const statusOrder = { pending: 0, washing: 1, drying: 2, folding: 3, ready: 4, completed: 5 };
        filtered.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }

    setFilteredOrders(filtered);
  }, [orders, statusFilter, searchTerm, sortBy]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found. Please log in again.');
        navigate('/login');
        return;
      }

      console.log('Fetching orders from API...');
      const response = await fetch(`${API_URL}/api/admin/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('Fetched orders from API:', responseData);

        // Handle both old format (direct array) and new format (object with orders array)
        const ordersData = Array.isArray(responseData) ? responseData : responseData.orders || [];

        // Filter out 'pending_booking' and 'approved' statuses as they are handled in the Booking section
        const processedOrdersData = ordersData.filter(
          order => order.status !== 'pending_booking' && order.status !== 'approved'  && order.status !== 'rejected'
        );

        // Transform the data to match frontend expectations
        const transformedOrders = processedOrdersData.map(order => ({
          ...order,
          // Parse JSON fields
          photos: typeof order.photos === 'string' ? JSON.parse(order.photos) : order.photos || [],
          laundryPhoto: typeof order.laundry_photos === 'string' ? JSON.parse(order.laundry_photos) : order.laundry_photos || [],
          // Format dates
          createdAt: new Date(order.created_at),
          pickupDate: order.pickup_date,
          pickupTime: order.pickup_time,
          // Map service_orders_id to order_id for frontend compatibility
          order_id: order.service_orders_id,
          // Map other fields to match frontend expectations
          serviceType: order.service_type,
          loadCount: order.load_count,
          paymentStatus: order.payment_status,
          paymentMethod: order.payment_method,
          totalPrice: order.total_price || 0,
          estimatedClothes: order.estimated_clothes,
          kilos: order.kilos
        }));

        // Filter out completed and paid orders (they should be in history)
        const filteredOrders = transformedOrders.filter(order =>
          !(order.status === 'completed' && order.paymentStatus === 'paid')
        );

        console.log('Transformed and filtered orders:', filteredOrders);
        setOrders(filteredOrders);
        setError(null);
      } else {
        if (response.status === 403) {
          setError('Admin access required. Please log in as an administrator.');
          navigate('/login');
        } else if (response.status === 401) {
          setError('Session expired. Please log in again.');
          navigate('/login');
        } else {
          setError('Failed to load orders. Please try again later.');
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_URL}/api/admin/orders/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const statsData = await response.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        // Update local state
        setOrders(prev => prev.map(order =>
          order.order_id === orderId ? { ...order, status: newStatus } : order
        ));
        alert('Order status updated successfully!');
      } else {
        alert('Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    }
  };

  // Starts a timer locally without a backend call
  const startLocalTimer = (orderId, status) => {
    // Define duration for each status in seconds (e.g., 1 hour)
    const duration = 3600;

    setTimerStatuses(prev => ({
      ...prev,
      [orderId]: {
        isActive: true,
        startTime: Date.now(),
        duration: duration * 1000, // duration in milliseconds
        autoAdvanceEnabled: prev[orderId]?.autoAdvanceEnabled || false,
      }
    }));
  };
  const autoAdvanceOrder = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/orders/${orderId}/auto-advance`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Update local state
        setOrders(prev => prev.map(order =>
          order.order_id === orderId ? { ...order, status: data.next } : order
        ));
        alert(`Order advanced to ${data.next} status!`);
      } else {
        alert('Failed to auto-advance order');
      }
    } catch (error) {
      console.error('Error auto-advancing order:', error);
      alert('Failed to auto-advance order');
    }
  };

  // Timer management functions

  const toggleAutoAdvance = async (orderId, enabled) => {
    // This now only updates the local state
    setTimerStatuses(prev => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        autoAdvanceEnabled: enabled
      }
    }));
  };

  // Defines the order of status progression
  const statusProgression = ['pending', 'washing', 'drying', 'folding', 'ready'];

  const advanceToNextStatus = async (orderId) => {
    try {
      setLoadingStatus(prev => ({ ...prev, [orderId]: true }));

      // Find the current order to determine the next status
      const currentOrder = orders.find(o => o.order_id === orderId);
      if (!currentOrder) {
        throw new Error('Order not found');
      }

      const currentIndex = statusProgression.indexOf(currentOrder.status);
      if (currentIndex === -1 || currentIndex >= statusProgression.length - 1) {
        // If status is not in progression or is the last one ('ready'), do nothing or handle completion
        console.log(`Order ${orderId} is at the final status or status not in progression.`);
        // Optionally, you could call handleOrderCompletion(orderId) if the status is 'ready'
        if (currentOrder.status === 'ready') {
          await handleOrderCompletion(orderId);
        }
        return;
      }

      const nextStatus = statusProgression[currentIndex + 1];

      // Call the existing updateOrderStatus function
      await updateOrderStatus(orderId, nextStatus);

      // Start a local timer for the new status if it's a processing step
      if (['washing', 'drying', 'folding'].includes(nextStatus)) {
        startLocalTimer(orderId, nextStatus);
      } else {
        // If moving to 'ready' or another status, deactivate the timer
        setTimerStatuses(prev => ({ ...prev, [orderId]: { ...prev[orderId], isActive: false } }));
      }

    } catch (error) {
      console.error('Error advancing order status:', error);
      alert('Failed to advance order status');
    } finally {
      setLoadingStatus(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const handleTimerExpired = async (orderId) => {
    console.log('Timer expired for order:', orderId);
    // Auto-advance if enabled
    const timerStatus = timerStatuses[orderId];
    if (timerStatus && timerStatus.autoAdvanceEnabled) {
      await advanceToNextStatus(orderId);
    }
  };

  const handleOrderCompletion = async (orderId) => {
    try {
      // Set loading state for this specific order
      setLoadingStatus(prev => ({ ...prev, [orderId]: true }));

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/orders/${orderId}/complete`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();

        // Refresh the orders list to ensure consistency (filtering will handle removal if completed and paid)
        await fetchOrders();

        // Refresh stats as well
        await fetchStats();

        // Close the modal
        setSelectedOrder(null);

        alert('Order completed successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to complete order: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error completing order:', error);
      alert('Failed to complete order. Please check your connection and try again.');
    } finally {
      // Remove loading state
      setLoadingStatus(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const handleCreateOrder = () => {
    navigate('/dashboard/create-order');
  };

  const handleEditOrder = (orderId) => {
    navigate(`/dashboard/edit-order/${orderId}`);
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to delete this order? It will be moved to history and can be restored later.')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/admin/orders/${orderId}/soft-delete`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            deletedAt: new Date().toISOString(),
            deletedBy: 'admin'
          })
        });

        if (response.ok) {
          // Remove the deleted order from local state (it will appear in history)
          setOrders(prev => prev.filter(order => order.order_id !== orderId));
          alert('Order moved to history successfully! It can be restored from the Admin History page.');
        } else {
          alert('Failed to delete order');
        }
      } catch (error) {
        console.error('Error deleting order:', error);
        alert('Failed to delete order');
      }
    }
  };

  const handleOrderNumberClick = (order) => {
    setSelectedOrder(order);
  };

  const handleUpdatePaymentStatus = async (orderId, newStatus) => {
    if (window.confirm(`Are you sure you want to mark this order as ${newStatus}?`)) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/admin/orders/${orderId}/payment-status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ payment_status: newStatus }),
        });

        if (response.ok) {
          // Update local state
          setOrders((prev) =>
            prev.map((order) =>
              order.order_id === orderId ? { ...order, paymentStatus: newStatus } : order
            )
          );
          alert(`Order marked as ${newStatus} successfully!`);
        } else {
          alert('Failed to update payment status');
        }
      } catch (error) {
        console.error('Error updating payment status:', error);
        alert('Failed to update payment status.');
      }
    }
  };

  const handlePaymentDecision = async (decision, orderId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/orders/${orderId}/gcash-payment-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ decision })
      });

      if (response.ok) {
        const data = await response.json();
        // Update local state
        setOrders(prev => prev.map(order =>
          order.order_id === orderId ? { ...order, paymentStatus: data.paymentStatus } : order
        ));
        alert(`Payment ${decision} successfully!`);
        setSelectedPayment(null);
        setPaymentReviewModalOpen(false);
      } else {
        alert('Failed to update payment decision');
      }
    } catch (error) {
      console.error('Error updating payment decision:', error);
      alert('Failed to update payment decision');
    }
  };

  const handleReviewPayment = (order) => {
    setSelectedPayment(order);
    setPaymentReviewModalOpen(true);
  };

  const handleOrderUpdate = (updatedOrder) => {
    setOrders(prev => prev.map(order =>
      order.order_id === updatedOrder.order_id ? updatedOrder : order
    ));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'washing': return 'bg-blue-100 text-blue-800';
      case 'drying': return 'bg-purple-100 text-purple-800';
      case 'folding': return 'bg-indigo-100 text-indigo-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
            </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold mb-4">Error loading orders</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-800">Order Management</h1>
          <button
            onClick={handleCreateOrder}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors font-medium"
          >
            Create Order
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full lg:w-auto">
            <div className="bg-white p-4 rounded-lg shadow-md border">
              <div className="text-2xl font-bold text-blue-600">{stats.totalOrders || 0}</div>
              <div className="text-sm text-gray-600">Total Orders</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md border">
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingOrders || 0}</div>
              <div className="text-sm text-gray-600">Pending Orders</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md border">
              <div className="text-2xl font-bold text-green-600">{stats.completedOrders || 0}</div>
              <div className="text-sm text-gray-600">Completed Orders</div>
            </div>
          </div>
        )}
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by customer name, contact, or order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="md:w-48">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="status">By Status</option>
              <option value="name">By Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-lg">No orders found</p>
            <p className="text-sm">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.order_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <button
                          onClick={() => handleOrderNumberClick(order)}
                          className="text-sm font-medium text-blue-600 hover:text-blue-900 hover:underline cursor-pointer"
                        >
                          Order #{order.order_id}
                        </button>
                        <div className="text-sm text-gray-500">
                          {formatDate(order.createdAt)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Pickup: {order.pickupDate} at {order.pickupTime}
                        </div>
                        {/* Timer Display */}
                        <TimerDisplay
                          orderId={order.order_id}
                          timerStatus={timerStatuses[order.order_id]}
                          onTimerExpired={handleTimerExpired}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.contact}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {serviceOptions.find(s => s.value === order.serviceType)?.label || order.serviceType}
                      </div>
                      <div className="text-sm text-gray-500">
                        Load: {order.loadCount}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <StatusIcon
                            status={order.status}
                            isClickable={['pending', 'washing', 'drying', 'folding'].includes(order.status)}
                            onClick={() => advanceToNextStatus(order.order_id)}
                            isLoading={loadingStatus[order.order_id]}
                          />
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </div>
                        {/* Timer Progress Bar */}
                        <TimerProgressBar
                          timerStatus={timerStatuses[order.order_id]}
                          size="sm"
                        />
                        {/* Auto-advance toggle */}
                        {timerStatuses[order.order_id]?.isActive && (
                          <div className="flex items-center gap-1">
                            <label className="flex items-center gap-1 text-xs">
                              <input
                                type="checkbox"
                                checked={timerStatuses[order.order_id]?.autoAdvanceEnabled || false}
                                onChange={(e) => toggleAutoAdvance(order.order_id, e.target.checked)}
                                className="w-3 h-3"
                              />
                              Auto-advance
                            </label>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₱{order.totalPrice?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                          order.paymentStatus === 'gcash_pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {order.paymentStatus === 'paid' ? 'Paid' :
                           order.paymentStatus === 'gcash_pending' ? 'GCash Pending' : 'Unpaid'}
                        </span>
                        {order.paymentStatus === 'gcash_pending' && (
                          <button
                            onClick={() => handleReviewPayment(order)}
                            className="text-blue-600 hover:text-blue-900 text-xs"
                          >
                            Review Payment
                          </button>
                        )}
                        {order.paymentStatus === 'unpaid' && (
                          <button
                            onClick={() => handleUpdatePaymentStatus(order.order_id, 'paid')}
                            className="text-green-600 hover:text-green-900 text-xs"
                          >
                            Mark as Paid
                          </button>
                        )}
                        {order.paymentStatus === 'paid' && (
                          <button
                            onClick={() => handleUpdatePaymentStatus(order.order_id, 'unpaid')}
                            className="text-yellow-600 hover:text-yellow-900 text-xs"
                          >
                            Mark as Unpaid
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleEditOrder(order.order_id)}
                          className="text-blue-600 hover:text-blue-900 text-xs"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(order.order_id)}
                          className="text-red-600 hover:text-red-900 text-xs"
                        >
                          Archive
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      <OrderDetailsModal
        selectedOrder={selectedOrder}
        setSelectedOrder={setSelectedOrder}
        updateOrderStatus={updateOrderStatus}
        serviceOptions={serviceOptions}
        onCompleteOrder={handleOrderCompletion}
        onMarkAsPaid={(orderId) => handleUpdatePaymentStatus(orderId, 'paid')}
      />

      {/* Payment Review Modal */}
      <PaymentReviewModal
        isOpen={paymentReviewModalOpen}
        onClose={() => {
          setSelectedPayment(null);
          setPaymentReviewModalOpen(false);
        }}
        payment={selectedPayment}
        onDecision={handlePaymentDecision}
      />

    </div>
  );
};

export default OrderManagement;
