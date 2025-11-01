import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import OrderDetailsModal from "../../components/OrderDetailsModal";
import apiClient from '../../../../utils/axios';


const OrderHistory = () => {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [typeFilter, setTypeFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const socketRef = useRef(null);

    // History type options for filtering (adapted for user: all, booking, order)
    const historyTypeOptions = [
        { value: 'all', label: 'All History' },
        { value: 'booking', label: 'Bookings' },
        { value: 'order', label: 'Orders' }
    ];

    useEffect(() => {
        fetchItems();
        setupWebSocket();

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    // Filter and sort items when dependencies change
    useEffect(() => {
        let filtered = [...items];

        // Apply type filter
        if (typeFilter !== 'all') {
            filtered = filtered.filter(item => item.type === typeFilter);
        }

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(item =>
                getItemService(item)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                getItemId(item)?.toString().includes(searchTerm) ||
                item.instructions?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Apply sorting
        switch (sortBy) {
            case 'newest':
                filtered.sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at));
                break;
            case 'oldest':
                filtered.sort((a, b) => new Date(a.createdAt || a.created_at) - new Date(b.createdAt || b.created_at));
                break;
            case 'service':
                filtered.sort((a, b) => (getItemService(a) || '').localeCompare(getItemService(b) || ''));
                break;
            case 'status':
                filtered.sort((a, b) => (a.status || '').localeCompare(b.status || ''));
                break;
            default:
                break;
        }

        setFilteredItems(filtered);
    }, [items, typeFilter, searchTerm, sortBy]);

    const setupWebSocket = () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Initialize WebSocket connection
        socketRef.current = window.io(import.meta.env.VITE_API_URL || 'http://localhost:8800', {
            transports: ['websocket', 'polling'],
            auth: { token }
        });

        socketRef.current.on('connect', () => {
            console.log('Connected to WebSocket');
        });

        // Listen for booking updates
        socketRef.current.on('your-booking-updated', (data) => {
            console.log('Booking updated:', data);
            fetchItems(); // Refresh data when booking is updated
        });

        // Listen for order updates
        socketRef.current.on('your-order-updated', (data) => {
            console.log('Order updated:', data);
            fetchItems(); // Refresh data when order is updated
        });

        // Listen for new bookings
        socketRef.current.on('your-booking-created', (data) => {
            console.log('New booking created:', data);
            fetchItems(); // Refresh data when new booking is created
        });

        // Listen for new orders
        socketRef.current.on('your-order-created', (data) => {
            console.log('New order created:', data);
            fetchItems(); // Refresh data when new order is created
        });

        socketRef.current.on('disconnect', () => {
            console.log('Disconnected from WebSocket');
        });
    };

    const fetchItems = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('No authentication token found. Please log in again.');
                navigate('/login');
                return;
            }

            console.log('Fetching items with token:', token);

            // Fetch both bookings and orders
            const ordersResponse = await apiClient.get('/api/customer/orders');

            console.log('Orders response status:', ordersResponse.status);

            let orders = [];

            if (ordersResponse.status === 200) {
                const ordersData = ordersResponse.data;
                console.log('Orders data:', ordersData);
                // Handle both direct array and paginated response formats
                orders = Array.isArray(ordersData) ? ordersData : ordersData.orders || [];
            } else {
                console.error('Failed to fetch orders:', ordersResponse.status);
            }

            // Combine and sort by creation date (newest first)
            const allItems = [...orders].map(item => {
                // Determine if it's a booking or an order based on status
                const type = item.status === 'pending_booking' ? 'booking' : 'order';
                return { ...item, type };
            }).sort((a, b) => {
                const dateA = new Date(a.createdAt || a.created_at);
                const dateB = new Date(b.createdAt || b.created_at);
                return dateB - dateA;
            });

            console.log('Combined items:', allItems);
            setItems(allItems);
            setError(null);
        } catch (error) {
            console.error('Error fetching items:', error);
            setError('Network error. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending':
            case 'approved':
                return 'bg-green-100 text-green-800';
            case 'rejected':
                return 'bg-red-100 text-red-800';
            case 'completed':
                return 'bg-blue-100 text-blue-800';
            case 'cancelled':
            case 'deleted':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-blue-100 text-blue-800';
        }
    };

    // Type icon mapping (adapted from admin)
    const getTypeIcon = (type) => {
        switch (type) {
            case 'order':
                return '📦';
            case 'booking':
                return '📅';
            default:
                return '📋';
        }
    };

    const getItemTypeLabel = (type) => {
        return type === 'booking' ? 'Booking' : 'Order';
    };

    const getItemId = (item) => {
        return item.type === 'booking' ? item.booking_id || item.id : item.order_id || item.id;
    };

    const getItemService = (item) => {
        if (item.type === 'booking') {
            return item.mainService || item.serviceType;
        } else {
            return item.serviceType;
        }
    };

    const handleItemClick = (item) => {
        if (item.type === 'booking') {
            setSelectedBooking(item);
        } else {
            setSelectedOrder(item);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatPrice = (price) => {
        if (price === null || price === undefined) return 'N/A';
        return `₱${Number(price).toLocaleString()}`;
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
                    <p className="text-lg font-semibold mb-4">Error loading history</p>
                    <p>{error}</p>
                    <button
                        onClick={fetchItems}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
                <h1 className="text-3xl font-bold text-gray-800">My Booking History</h1>
            </div>

            {/* Filters and Search */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Search by service, ID, or instructions..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Type Filter */}
                    <div className="md:w-48">
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {historyTypeOptions.map(option => (
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
                            <option value="service">By Service</option>
                            <option value="status">By Status</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* History Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {filteredItems.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <p className="text-lg">No history items found</p>
                        <p className="text-sm">Try adjusting your search or filter criteria</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Item Details
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
                                        Created
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredItems.map((item) => (
                                    <tr key={`${item.type}-${getItemId(item)}`} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleItemClick(item)}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <button
                                                    className="text-sm font-medium text-blue-600 hover:text-blue-900 hover:underline cursor-pointer flex items-center gap-2"
                                                >
                                                    <span>{getTypeIcon(item.type)}</span>
                                                    {getItemTypeLabel(item.type)} #{getItemId(item)}
                                                </button>
                                                <div className="text-sm text-gray-500">
                                                    Created: {formatDate(item.createdAt || item.created_at)}
                                                </div>
                                                {item.pickupDate && (
                                                    <div className="text-sm text-gray-500">
                                                        Pickup: {item.pickupDate} at {item.pickupTime}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {getItemService(item) || 'N/A'}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                Loads: {item.loadCount || 1}
                                            </div>
                                            {item.instructions && (
                                                <div className="text-xs text-gray-500 mt-1">
                                                    Instructions: {item.instructions}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                                                {item.status?.charAt(0).toUpperCase() + item.status?.slice(1) || 'Unknown'}
                                            </span>
                                            {item.status === 'rejected' && item.rejectionReason && (
                                                <div className="text-xs text-red-600 mt-1">
                                                    Reason: {item.rejectionReason}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {formatPrice(item.totalPrice)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(item.createdAt || item.created_at)}
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
            />

            {/* Booking Details Modal */}
            <OrderDetailsModal
                selectedOrder={selectedBooking}
                setSelectedOrder={setSelectedBooking}
            />
        </div>
    );
};

export default OrderHistory;