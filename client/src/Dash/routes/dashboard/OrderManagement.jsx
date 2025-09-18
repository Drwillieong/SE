import React, { useState, useEffect } from "react";

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8800/api/orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      } else {
        setError('Failed to fetch orders');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full text-pink-600"></div>
        <p className="mt-2">Loading orders...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center text-red-600">
        <p className="text-lg font-semibold mb-4">Error loading orders</p>
        <p>{error}</p>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Order Management</h1>
      {orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-md">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Name</th>
                <th className="py-2 px-4 border-b">Contact</th>
                <th className="py-2 px-4 border-b">Email</th>
                <th className="py-2 px-4 border-b">Pickup Date</th>
                <th className="py-2 px-4 border-b">Pickup Time</th>
                <th className="py-2 px-4 border-b">Service Type</th>
                <th className="py-2 px-4 border-b">Load Count</th>
                <th className="py-2 px-4 border-b">Estimated Clothes</th>
                <th className="py-2 px-4 border-b">Kilos</th>
                <th className="py-2 px-4 border-b">Pants</th>
                <th className="py-2 px-4 border-b">Shorts</th>
                <th className="py-2 px-4 border-b">T-Shirts</th>
                <th className="py-2 px-4 border-b">Bedsheets</th>
                <th className="py-2 px-4 border-b">Total Price</th>
                <th className="py-2 px-4 border-b">Status</th>
                <th className="py-2 px-4 border-b">Photos</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id} className="text-center border-t">
                  <td className="py-2 px-4 border-b">{order.name}</td>
                  <td className="py-2 px-4 border-b">{order.contact}</td>
                  <td className="py-2 px-4 border-b">{order.email}</td>
                  <td className="py-2 px-4 border-b">{order.pickupDate}</td>
                  <td className="py-2 px-4 border-b">{order.pickupTime}</td>
                  <td className="py-2 px-4 border-b">{order.serviceType}</td>
                  <td className="py-2 px-4 border-b">{order.loadCount}</td>
                  <td className="py-2 px-4 border-b">{order.estimatedClothes || '-'}</td>
                  <td className="py-2 px-4 border-b">{order.kilos || '-'}</td>
                  <td className="py-2 px-4 border-b">{order.pants || '-'}</td>
                  <td className="py-2 px-4 border-b">{order.shorts || '-'}</td>
                  <td className="py-2 px-4 border-b">{order.tshirts || '-'}</td>
                  <td className="py-2 px-4 border-b">{order.bedsheets || '-'}</td>
                  <td className="py-2 px-4 border-b">₱{order.totalPrice}</td>
                  <td className="py-2 px-4 border-b">{order.status}</td>
                  <td className="py-2 px-4 border-b">
                    {order.photos && order.photos.length > 0 ? (
                      order.photos.map((photo, idx) => (
                        <img key={idx} src={photo} alt="Order Photo" className="inline-block w-12 h-12 object-cover rounded-md mr-1" />
                      ))
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;
