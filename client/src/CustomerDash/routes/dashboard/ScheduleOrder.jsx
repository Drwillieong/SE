import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Define free pickup barangays and their fees
const freePickupBarangays = [
  "Brgy. 1", "Brgy. 2", "Brgy. 3", "Brgy. 4", "Brgy. 5", "Brgy. 6", "Brgy. 7",
  "Lecheria (Up to City Cemetery)", "San Juan", "San Jose",
  "Looc (Bukana, Mahogany, Vermont)", "Bañadero (Bukana, Bria Homes)",
  "Palingon", "Lingga", "Sampiruhan", "Parian (Bantayan/Villa Carpio)"
];

// Define barangays with special pricing
const barangayPricing = {
  "Mapagong": 65,
  "Bubuyan": 65,
  "Burol": 65,
  "Bucal": 40,
  "Camaligan": 40,
  "La Mesa": 40
};

const ScheduleOrder = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [userDataLoading, setUserDataLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pickup');
  const [orders, setOrders] = useState([]);
  const [editingOrder, setEditingOrder] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
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

  // Booking form state
  const [formData, setFormData] = useState({
    serviceType: 'washFold',
    pickupDate: '',
    pickupTime: '7am-10am',
    instructions: '',
    status: 'pending',
    paymentMethod: 'cash',
    serviceOption: 'pickupAndDelivery' // New field: 'pickupOnly', 'deliveryOnly', 'pickupAndDelivery'
  });

  // Available services
  const services = [
    {
      id: 'washFold',
      name: 'Wash & Fold',
      description: 'The perfect service for your everyday laundry needs.',
      price: 189,
      priceText: '₱189/load up to 7 kilos (Detergent and Fab Con INCLUDED)'
    },
  ];

  // Calculate delivery fee based on barangay
  const calculateDeliveryFee = (barangay) => {
    if (!barangay) return 0;

    // Check if barangay is in free pickup list
    const isFree = freePickupBarangays.some(freeBrgy =>
      barangay.toLowerCase().includes(freeBrgy.toLowerCase().split(' ')[0])
    );

    if (isFree) return 0;

    // Check for special pricing
    for (const [brgy, fee] of Object.entries(barangayPricing)) {
      if (barangay.toLowerCase().includes(brgy.toLowerCase())) {
        return fee;
      }
    }

    // Default fee for other areas
    return 30;
  };

  // Available pickup dates (next 7 days)
  const getPickupDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);
      dates.push({
        date: date.getDate(),
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        fullDate: date.toISOString().split('T')[0]
      });
    }
    return dates;
  };

  // Fetch user data and orders
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        const userRes = await axios.get('http://localhost:8800/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
          withCredentials: true
        });
        setUserData(userRes.data);
        setUser({ id: userRes.data.id, name: `${userRes.data.firstName} ${userRes.data.lastName}` });
        if (userRes.data.barangay) {
          setDeliveryFee(calculateDeliveryFee(userRes.data.barangay));
        }
        // Fetch orders
        const ordersRes = await axios.get('http://localhost:8800/api/orders', {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
          withCredentials: true
        });
        // Filter out cancelled orders from the list
        const filteredOrders = ordersRes.data.filter(order => order.status !== 'cancelled');
        setOrders(filteredOrders);
      } catch (error) {
        console.error('Error fetching user data or orders:', error);
        navigate('/login');
      } finally {
        setUserDataLoading(false);
      }
    };
    fetchUserData();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setPaymentDetails(prev => ({ ...prev, [name]: value }));
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

  const handlePaymentDetailsSubmit = () => {
    // Validate payment details
    if (paymentDetails.method === 'gcash' && !paymentDetails.gcashNumber) {
      alert('Please enter your GCash number');
      return;
    }
    if (paymentDetails.method === 'card') {
      if (!paymentDetails.cardNumber || !paymentDetails.expiry || !paymentDetails.cvv) {
        alert('Please fill in all card details');
        return;
      }
    }
    setShowPaymentDetailsModal(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.pickupDate) {
      alert('Please select a pickup date');
      return;
    }

    if (!userData || !userData.barangay || !userData.street) {
      alert('Please complete your profile information first');
      navigate('/profile');
      return;
    }

    // Show confirmation before final submission
    setShowConfirmation(true);
  };

  const confirmOrder = async () => {
    try {
      setLoading(true);
      const selectedService = services.find(s => s.id === formData.serviceType);

      const userAddress = `${userData.street || ''}${userData.blockLot ? `, Block ${userData.blockLot}` : ''}, ${userData.barangay || ''}, Calamba City`;

      const orderPayload = {
        serviceType: formData.serviceType,
        pickupDate: formData.pickupDate,
        pickupTime: formData.pickupTime,
        loadCount: 1, // Assuming 1 load as default
        instructions: formData.instructions,
        status: 'pending',
        paymentMethod: formData.paymentMethod,
        name: userData.firstName + ' ' + userData.lastName,
        contact: userData.contact,
        email: userData.email,
        address: userAddress,
        photos: [],
        totalPrice: selectedService.price + (formData.serviceOption === 'pickupOnly' ? 0 : deliveryFee),
        userId: user.id,
      };

      const token = localStorage.getItem('token');
      if (editingOrder) {
        // Update existing order
        await axios.put(`http://localhost:8800/api/orders/${editingOrder.id}`, orderPayload, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        });
        alert('Order updated successfully!');
      } else {
        // Create new order
        await axios.post('http://localhost:8800/api/orders', orderPayload, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        });
        alert('Booking submitted successfully! Our team will review your request.');
      }

      setShowConfirmation(false);
      setEditingOrder(null);
      resetForm();
      setActiveTab('orders');
      // Refresh orders
        const ordersRes = await axios.get('http://localhost:8800/api/orders', {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        });
      setOrders(ordersRes.data);
    } catch (error) {
      console.error('Error saving order:', error);
      alert(error.message || 'Failed to save order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (order) => {
    setEditingOrder(order);
    setFormData({
      serviceType: order.serviceType,
      pickupDate: order.pickupDate,
      pickupTime: order.pickupTime,
      instructions: order.instructions,
      paymentMethod: order.paymentMethod,
      status: order.status,
      serviceOption: order.serviceOption || 'pickupAndDelivery'
    });
    setActiveTab('pickup');
  };

      const handleCancel = async (orderId) => {
        if (window.confirm('Are you sure you want to cancel this booking?')) {
          try {
            setLoading(true);
            const token = localStorage.getItem('token');
            // Add content-type header for JSON
            await axios.put(`http://localhost:8800/api/orders/${orderId}`, { status: 'cancelled' }, {
              headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              withCredentials: true
            });
            alert('Order cancelled successfully!');
            // Refresh orders and filter out cancelled order
            const ordersRes = await axios.get('http://localhost:8800/api/orders', {
              headers: { Authorization: `Bearer ${token}` }
            });
            // Filter out cancelled orders from the list
            const filteredOrders = ordersRes.data.filter(order => order.status !== 'cancelled');
            setOrders(filteredOrders);
          } catch (error) {
            console.error('Error cancelling order:', error);
            alert('Failed to cancel order. Please try again.');
          } finally {
            setLoading(false);
          }
        }
      };

  const resetForm = () => {
    setFormData({
      serviceType: 'washFold',
      pickupDate: '',
      pickupTime: '7am-10am',
      instructions: '',
      status: 'pending',
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
            onClick={() => navigate('/profile')}
            className="bg-pink-600 text-white px-4 py-2 rounded-md hover:bg-pink-700"
          >
            Complete Profile
          </button>
        </div>
      </div>
    );
  }

  const selectedService = services.find(s => s.id === formData.serviceType);
  const servicePrice = selectedService.price;
  const totalPrice = servicePrice + (formData.serviceOption === 'pickupOnly' ? 0 : deliveryFee);

  return (
    <div className="min-h-fit bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-pink-600 mb-8">Laundry Booking</h1>

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
            My Orders
          </button>
        </div>

        {/* Main Content Area */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Pickup Form */}
          {activeTab === 'pickup' && !showConfirmation && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-4">Choose Your Service</h2>
                <div className="space-y-4">
                  {services.map(service => (
                    <div
                      key={service.id}
                      className={`p-4 border rounded-lg cursor-pointer ${formData.serviceType === service.id ? 'border-pink-500 bg-pink-50' : 'border-gray-200'}`}
                      onClick={() => setFormData(prev => ({ ...prev, serviceType: service.id }))}
                    >
                      <div className="flex items-start">
                        <input
                          type="radio"
                          id={service.id}
                          name="serviceType"
                          checked={formData.serviceType === service.id}
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

              {/* Service Option Selection */}
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-4">Service Option</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                <h2 className="text-xl font-bold mb-4">Pickup Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date *</label>
                    <div className="grid grid-cols-3 gap-2">
                      {getPickupDates().map((date) => (
                        <button
                          key={date.fullDate}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, pickupDate: date.fullDate }))}
                          className={`py-2 text-center rounded ${formData.pickupDate === date.fullDate ? 'bg-pink-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                        >
                          <div className="text-xs">{date.day}</div>
                          <div className="font-medium">{date.date}</div>
                        </button>
                      ))}
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
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-bold mb-4">Order Details</h2>
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
                      <button
                        type="button"
                        onClick={() => handlePaymentMethodChange('card')}
                        className={`p-2 text-center text-sm rounded ${paymentDetails.method === 'card' ? 'bg-pink-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                      >
                        Card
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

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !formData.pickupDate}
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
                    <p className="text-gray-600">Service:</p>
                    <p className="font-medium">{selectedService.name}</p>
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
                  <div className="flex justify-between">
                    <span>Service Fee:</span>
                    <span>₱{servicePrice}</span>
                  </div>
                  {formData.serviceOption !== 'pickupOnly' && (
                    <div className="flex justify-between">
                      <span>Delivery Fee:</span>
                      <span>{deliveryFee === 0 ? 'FREE' : `₱${deliveryFee}`}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 font-bold flex justify-between">
                    <span>Total:</span>
                    <span>₱{totalPrice}</span>
                  </div>
                </div>
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
                orders.map(order => (
                  <div key={order.id} className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{services.find(s => s.id === order.serviceType)?.name || order.serviceType}</h3>
                        <p className="text-sm text-gray-600">
                          {new Date(order.pickupDate).toLocaleDateString()} at {order.pickupTime}
                        </p>
                        <p className="text-sm text-gray-600">Status: <span className={`font-medium ${
                          order.status === 'pending' ? 'text-yellow-600' :
                          order.status === 'approved' ? 'text-green-600' :
                          order.status === 'completed' ? 'text-blue-600' :
                          order.status === 'cancelled' ? 'text-red-600' : 'text-gray-600'
                        }`}>{order.status}</span></p>
                        <p className="text-sm text-gray-600">Total: ₱{order.totalPrice}</p>
                      </div>
                      <div className="flex space-x-2">
                        {order.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleEdit(order)}
                              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleCancel(order.id)}
                              className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                            >
                              Cancel
                            </button>
                          </>
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

      {/* Booking Submitted Modal */}
      {showPaymentDetailsModal && (
        <div className="fixed inset-0 bg-pink-400 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Booking Submitted</h3>
            <p className="mb-4">
              Thank you for submitting your laundry booking. It is now pending approval.
            </p>
            <div className="bg-gray-100 p-4 rounded mb-4 text-sm text-gray-700">
              Our team will check your laundry, weigh it, and confirm the total cost. Once your booking is approved, you'll receive a notification with the final price and a secure link to complete your payment using your selected method:
              <ul className="list-disc list-inside mt-2">
                <li>GCash</li>
                <li>Credit/Debit Card</li>
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
    </div>
  );
};

export default ScheduleOrder;
