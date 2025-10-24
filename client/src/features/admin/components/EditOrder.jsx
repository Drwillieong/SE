import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../../../../utils/axios';

const EditOrder = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [formData, setFormData] = useState({
        serviceType: 'washFold',
        pickupDate: '',
        pickupTime: '7am-10am',
        loadCount: 1,
        instructions: '',
        paymentMethod: 'cash',
        name: '',
        contact: '',
        email: '',
        address: '',
        estimatedClothes: 0,
        kilos: 0,
        pants: 0,
        shorts: 0,
        tshirts: 0,
        bedsheets: 0,
        status: 'pending'
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrder();
    }, [id]);

    const fetchOrder = async () => {
        try {
            const response = await apiClient.get(`/api/admin/orders/${id}`);

            const order = response.data;
            setFormData({
                serviceType: order.serviceType || 'washFold',
                pickupDate: order.pickupDate || '',
                pickupTime: order.pickupTime || '7am-10am',
                loadCount: order.loadCount || 1,
                instructions: order.instructions || '',
                paymentMethod: order.paymentMethod || 'cash',
                name: order.name || '',
                contact: order.contact || '',
                email: order.email || '',
                address: order.address || '',
                estimatedClothes: order.estimatedClothes || 0,
                kilos: order.kilos || 0,
                pants: order.pants || 0,
                shorts: order.shorts || 0,
                tshirts: order.tshirts || 0,
                bedsheets: order.bedsheets || 0,
                status: order.status || 'pending'
            });
        } catch (error) {
            console.error('Error fetching order:', error);
            alert('Error fetching order');
            navigate('/dashboard/order');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await apiClient.put(`/api/admin/orders/${id}`, formData);
            navigate('/dashboard/order');
        } catch (error) {
            console.error('Error updating order:', error);
            alert('Error updating order');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-lg">Loading order...</div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Order</h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Service Type
                            </label>
                            <select
                                name="serviceType"
                                value={formData.serviceType}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="washFold">Wash & Fold</option>
                                <option value="dryCleaning">Dry Cleaning</option>
                                <option value="hangDry">Hang Dry</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Pickup Date
                            </label>
                            <input
                                type="date"
                                name="pickupDate"
                                value={formData.pickupDate}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Pickup Time
                            </label>
                            <select
                                name="pickupTime"
                                value={formData.pickupTime}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="7am-10am">7am-10am</option>
                                <option value="5pm-7pm">5pm-7pm</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Load Count
                            </label>
                            <select
                                name="loadCount"
                                value={formData.loadCount}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value={1}>1 Load</option>
                                <option value={2}>2 Loads</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Payment Method
                            </label>
                            <select
                                name="paymentMethod"
                                value={formData.paymentMethod}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="cash">Cash</option>
                                <option value="gcash">GCash</option>
                                <option value="card">Card</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Status
                            </label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="pending">Pending</option>
                                <option value="washing">Washing</option>
                                <option value="drying">Drying</option>
                                <option value="folding">Folding</option>
                                <option value="ready">Ready</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Customer Name
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Contact Number
                        </label>
                        <input
                            type="tel"
                            name="contact"
                            value={formData.contact}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email (Optional)
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Address
                        </label>
                        <textarea
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Special Instructions (Optional)
                        </label>
                        <textarea
                            name="instructions"
                            value={formData.instructions}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={() => navigate('/dashboard/order')}
                            className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            Update Order
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditOrder;
