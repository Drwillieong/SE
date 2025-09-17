import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const OrderHistory = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await fetch('http://localhost:8800/api/orders', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const ordersData = await response.json();
                setOrders(ordersData);
            } else {
                console.error('Failed to fetch orders');
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
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

            {orders.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-gray-500">No orders found.</p>
                    <p className="text-sm text-gray-400 mt-2">Your submitted bookings will appear here.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <div key={order.id} className="bg-white rounded-lg shadow p-6 border">
                            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-semibold">Order #{order.id}</h3>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p><span className="font-medium">Service:</span> {order.serviceType}</p>
                                            <p><span className="font-medium">Pickup:</span> {order.pickupDate} at {order.pickupTime}</p>
                                            <p><span className="font-medium">Loads:</span> {order.loadCount}</p>
                                        </div>
                                        <div>
                                            <p><span className="font-medium">Total Price:</span> ₱{order.totalPrice}</p>
                                            <p><span className="font-medium">Payment:</span> {order.paymentMethod}</p>
                                            <p><span className="font-medium">Created:</span> {new Date(order.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>

                                    {order.instructions && (
                                        <div className="mt-3">
                                            <p className="font-medium text-sm">Instructions:</p>
                                            <p className="text-sm text-gray-600">{order.instructions}</p>
                                        </div>
                                    )}

                                    {order.status === 'rejected' && order.rejectionReason && (
                                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                                            <p className="font-medium text-red-800 text-sm">Rejection Reason:</p>
                                            <p className="text-red-700 text-sm mt-1">{order.rejectionReason}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OrderHistory;
