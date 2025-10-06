import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import OrderDetailsModal from "../../components/OrderDetailsModal";

const OrderHistory = () => {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const socketRef = useRef(null);

    useEffect(() => {
        fetchItems();
        setupWebSocket();

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    const setupWebSocket = () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Initialize WebSocket connection
        socketRef.current = window.io('http://localhost:8800', {
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
                navigate('/login');
                return;
            }

            console.log('Fetching items with token:', token);

            // Fetch both bookings and orders
            const [bookingsResponse, ordersResponse] = await Promise.all([
                fetch('http://localhost:8800/api/bookings', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }),
                fetch('http://localhost:8800/api/orders', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                })
            ]);

            console.log('Bookings response status:', bookingsResponse.status);
            console.log('Orders response status:', ordersResponse.status);

            let bookings = [];
            let orders = [];

            if (bookingsResponse.ok) {
                bookings = await bookingsResponse.json();
                console.log('Bookings data:', bookings);
                // Add type to bookings for identification
                bookings = bookings.map(booking => ({ ...booking, type: 'booking' }));
            } else {
                console.error('Failed to fetch bookings:', bookingsResponse.status, await bookingsResponse.text());
            }

            if (ordersResponse.ok) {
                const ordersData = await ordersResponse.json();
                console.log('Orders data:', ordersData);
                // Handle both direct array and paginated response formats
                orders = Array.isArray(ordersData) ? ordersData : ordersData.orders || [];
                // Add type to orders for identification
                orders = orders.map(order => ({ ...order, type: 'order' }));
            } else {
                console.error('Failed to fetch orders:', ordersResponse.status, await ordersResponse.text());
            }

            // Combine and sort by creation date (newest first)
            const allItems = [...bookings, ...orders].sort((a, b) => {
                const dateA = new Date(a.createdAt || a.created_at);
                const dateB = new Date(b.createdAt || b.created_at);
                return dateB - dateA;
            });

            console.log('Combined items:', allItems);
            setItems(allItems);
        } catch (error) {
            console.error('Error fetching items:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-200 text-yellow-800';
            case 'approved': return 'bg-green-200 text-green-800';
            case 'rejected': return 'bg-red-200 text-red-800';
            case 'completed': return 'bg-blue-200 text-blue-800';
            case 'cancelled': return 'bg-gray-200 text-gray-800';
            default: return 'bg-gray-200 text-gray-800';
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

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">My Order History</h1>

            {items.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-gray-500">No orders found.</p>
                    <p className="text-sm text-gray-400 mt-2">Your submitted bookings and orders will appear here.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {items.map((item) => (
                        <div
                            key={`${item.type}-${getItemId(item)}`}
                            className="bg-white rounded-lg shadow p-6 border cursor-pointer hover:shadow-lg transition-shadow"
                            onClick={() => handleItemClick(item)}
                        >
                            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-semibold">
                                            {getItemTypeLabel(item.type)} #{getItemId(item)}
                                        </h3>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p><span className="font-medium">Service:</span> {getItemService(item)}</p>
                                            <p><span className="font-medium">Pickup:</span> {item.pickupDate} at {item.pickupTime}</p>
                                            <p><span className="font-medium">Loads:</span> {item.loadCount || 1}</p>
                                        </div>
                                        <div>
                                            <p><span className="font-medium">Total Price:</span> ₱{item.totalPrice}</p>
                                            <p><span className="font-medium">Payment:</span> {item.paymentMethod}</p>
                                            <p><span className="font-medium">Created:</span> {new Date(item.createdAt || item.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>

                                    {item.instructions && (
                                        <div className="mt-3">
                                            <p className="font-medium text-sm">Instructions:</p>
                                            <p className="text-sm text-gray-600">{item.instructions}</p>
                                        </div>
                                    )}

                                    {item.status === 'rejected' && item.rejectionReason && (
                                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                                            <p className="font-medium text-red-800 text-sm">Rejection Reason:</p>
                                            <p className="text-red-700 text-sm mt-1">{item.rejectionReason}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

          

            {/* Order Details Modal */}
            <OrderDetailsModal
                selectedOrder={selectedOrder}
                setSelectedOrder={setSelectedOrder}
            />
        </div>
    );
};

export default OrderHistory;
