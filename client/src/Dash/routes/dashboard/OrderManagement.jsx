import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Modal from 'react-modal';
import OrderDetailsModal from './components/OrderDetailsModal';
import TimerDisplay from './components/TimerDisplay';
import TimerProgressBar from './components/TimerProgressBar';
import StatusIcon from './components/StatusIcon';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [timerStatuses, setTimerStatuses] = useState({});
  const [loadingStatus, setLoadingStatus] = useState({});

  useEffect(() => {
    console.log('OrderManagement component mounted/updated');
    fetchOrders();
    fetchStats();

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
        const timerPromises = orders.map(order => fetchTimerStatus(order.order_id));
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
      const response = await fetch('http://localhost:8800/api/admin/orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('Fetched orders from API:', responseData);

        // Handle both old format (direct array) and new format (object with orders array)
        const ordersData = Array.isArray(responseData) ? responseData : responseData.orders || [];

        // Transform the data to match frontend expectations
        const transformedOrders = ordersData.map(order => ({
          ...order,
          // Parse JSON fields
          photos: typeof order.photos === 'string' ? JSON.parse(order.photos) : order.photos || [],
          laundryPhoto: typeof order.laundryPhoto === 'string' ? JSON.parse(order.laundryPhoto) : order.laundryPhoto || [],
          // Format dates
          createdAt: new Date(order.createdAt),
          pickupDate: order.pickupDate
        }));
        console.log('Transformed orders:', transformedOrders);
        setOrders(transformedOrders);
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

      const response = await fetch('http://localhost:8800/api/admin/orders/stats', {
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
      const response = await fetch(`http://localhost:8800/api/admin/orders/${orderId}`, {
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

  const autoAdvanceOrder = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8800/api/admin/orders/${orderId}/auto-advance`, {
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
  const fetchTimerStatus = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8800/api/admin/orders/${orderId}/timer/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const timerStatus = await response.json();
        setTimerStatuses(prev => ({
          ...prev,
          [orderId]: timerStatus
        }));
        return timerStatus;
      }
    } catch (error) {
      console.error('Error fetching timer status:', error);
    }
    return null;
  };

  const startOrderTimer = async (orderId, status) => {
    try {
      setLoadingStatus(prev => ({ ...prev, [orderId]: true }));
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8800/api/admin/orders/${orderId}/timer/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        await fetchTimerStatus(orderId);
        // Update order status if starting timer for a new status
        if (status !== 'pending') {
          setOrders(prev => prev.map(order =>
            order.order_id === orderId ? { ...order, status } : order
          ));
        }
      } else {
        alert('Failed to start timer');
      }
    } catch (error) {
      console.error('Error starting timer:', error);
      alert('Failed to start timer');
    } finally {
      setLoadingStatus(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const toggleAutoAdvance = async (orderId, enabled) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8800/api/admin/orders/${orderId}/auto-advance/toggle`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ enabled })
      });

      if (response.ok) {
        setTimerStatuses(prev => ({
          ...prev,
          [orderId]: {
            ...prev[orderId],
            autoAdvanceEnabled: enabled
          }
        }));
      } else {
        alert('Failed to toggle auto-advance');
      }
    } catch (error) {
      console.error('Error toggling auto-advance:', error);
      alert('Failed to toggle auto-advance');
    }
  };

  const advanceToNextStatus = async (orderId) => {
    try {
      setLoadingStatus(prev => ({ ...prev, [orderId]: true }));
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8800/api/admin/orders/${orderId}/status/next`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Update local state
        setOrders(prev => prev.map(order =>
          order.order_id === orderId ? { ...order, status: data.order.status } : order
        ));
        // Refresh timer status
        await fetchTimerStatus(orderId);
      } else {
        alert('Failed to advance order status');
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

  const handleOrderNumberClick = (order) => {
    setSelectedOrder(order);
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full text-pink-600"></div>
          <p className="mt-2">Loading orders...</p>
        </div>
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
        <h1 className="text-3xl font-bold text-gray-800">Order Management</h1>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full lg:w-auto">
            <div className="bg-white p-4 rounded-lg shadow-md border">
              <div className="text-2xl font-bold text-blue-600">{stats.totalOrders || 0}</div>
              <div className="text-sm text-gray-600">Total Orders</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md border">
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingOrders || 0}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md border">
              <div className="text-2xl font-bold text-green-600">{stats.completedOrders || 0}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md border">
              <div className="text-2xl font-bold text-purple-600">₱{stats.totalRevenue?.toLocaleString() || '0'}</div>
              <div className="text-sm text-gray-600">Revenue</div>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => startOrderTimer(order.order_id, order.status)}
                          className="text-purple-600 hover:text-purple-900 text-xs"
                          disabled={timerStatuses[order.order_id]?.isActive}
                        >
                          {timerStatuses[order.order_id]?.isActive ? 'Timer Active' : 'Start Timer'}
                        </button>
                        {timerStatuses[order.order_id]?.isActive && (
                          <button
                            onClick={() => toggleAutoAdvance(order.order_id, !timerStatuses[order.order_id]?.autoAdvanceEnabled)}
                            className="text-orange-600 hover:text-orange-900 text-xs"
                          >
                            {timerStatuses[order.order_id]?.autoAdvanceEnabled ? 'Disable Auto' : 'Enable Auto'}
                          </button>
                        )}
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
      />
    </div>
  );
};

export default OrderManagement;
