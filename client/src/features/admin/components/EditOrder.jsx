import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../../../utils/axios';

const mainServices = [
    {
        id: 'washDryFold',
        name: 'Wash, Dry & Fold',
        price: 179,
        priceText: '₱179/load'
    },
    {
        id: 'fullService',
        name: 'Full Service (Wash, Dry & Fold)',
        price: 199,
        priceText: '₱199/load (Detergent, Fabcon, Colorsafe Bleach INCLUDED)'
    }
];

const dryCleaningServices = [
    {
        id: 'dryCleanBarong',
        name: 'Dry Cleaning - Barong',
        price: 0, // Price will be set by admin
        priceText: 'Price set upon inspection'
    },
    {
        id: 'dryCleanCoat',
        name: 'Dry Cleaning - Coat',
        price: 0,
        priceText: 'Price set upon inspection'
    },
    {
        id: 'dryCleanGown',
        name: 'Dry Cleaning - Gown',
        price: 0,
        priceText: 'Price set upon inspection'
    },
    {
        id: 'dryCleanWeddingGown',
        name: 'Dry Cleaning - Wedding Gown',
        price: 0,
        priceText: 'Price set upon inspection'
    }
];

const EditOrder = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [formData, setFormData] = useState({
        serviceType: 'washFold',
        loadCount: 1,
        instructions: '',
        paymentMethod: 'cash',
        name: '',
        contact: '',
        email: '',
        address: '',
        kilos: 0,
        status: 'pending',
        dryCleaningServices: [],
        dryCleaningPrices: {},
        totalPrice: 0
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
                loadCount: order.loadCount || 1,
                instructions: order.instructions || '',
                paymentMethod: order.paymentMethod || 'cash',
                name: order.name || '',
                contact: order.contact || '',
                email: order.email || '',
                address: order.address || '',

                kilos: order.kilos || 0,
                status: order.status || 'pending',
                dryCleaningServices: order.dryCleaningServices || [],
                dryCleaningPrices: order.dryCleaningPrices || {},
                totalPrice: order.totalPrice || order.total_price || 0
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

    const handleDryCleaningChange = (serviceId) => {
        setFormData(prev => ({
            ...prev,
            dryCleaningServices: prev.dryCleaningServices.includes(serviceId)
                ? prev.dryCleaningServices.filter(id => id !== serviceId)
                : [...prev.dryCleaningServices, serviceId]
        }));
    };

    const handleDryCleaningPriceChange = (serviceId, price) => {
        const newPrice = parseFloat(price) || 0;
        setFormData(prev => ({
            ...prev,
            dryCleaningPrices: {
                ...prev.dryCleaningPrices,
                [serviceId]: newPrice
            }
        }));
    };

    const totalPrice = useMemo(() => {
        let total = 0;

        // Calculate main service price
        const selectedMainService = mainServices.find(service => service.id === formData.serviceType);
        if (selectedMainService) {
            total += selectedMainService.price * formData.loadCount;
        }

        // Calculate dry cleaning prices
        formData.dryCleaningServices.forEach(serviceId => {
            const price = formData.dryCleaningPrices[serviceId] || 0;
            total += price;
        });

        return total;
    }, [formData.serviceType, formData.loadCount, formData.dryCleaningServices, formData.dryCleaningPrices]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const updateData = {
                ...formData,
                totalPrice: totalPrice // Include the calculated total price
            };
            await apiClient.put(`/api/admin/orders/${id}`, updateData);
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
                                Main Service *
                            </label>
                            <div className="space-y-3">
                                {mainServices.map(service => (
                                    <div
                                        key={service.id}
                                        className={`p-4 border rounded-lg cursor-pointer ${formData.serviceType === service.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                                        onClick={() => setFormData(prev => ({ ...prev, serviceType: service.id }))}
                                    >
                                        <div className="flex items-start">
                                            <input
                                                type="radio"
                                                name="serviceType"
                                                checked={formData.serviceType === service.id}
                                                onChange={() => {}}
                                                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <div className="ml-3">
                                                <label className="font-medium block">{service.name}</label>
                                                <p className="text-sm text-gray-600">{service.priceText}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                             {/* Dry Cleaning Services */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Dry Cleaning Services (Optional)
                        </label>
                        <div className="space-y-3">
                            {dryCleaningServices.map(service => (
                                <div
                                    key={service.id}
                                    className={`p-4 border rounded-lg cursor-pointer ${formData.dryCleaningServices.includes(service.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                                    onClick={() => handleDryCleaningChange(service.id)}
                                >
                                    <div className="flex items-start">
                                        <input
                                            type="checkbox"
                                            name="dryCleaningServices"
                                            checked={formData.dryCleaningServices.includes(service.id)}
                                            onChange={() => {}}
                                            className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <div className="ml-3">
                                            <label className="font-medium block">{service.name}</label>
                                            <p className="text-sm text-gray-600">{service.priceText}</p>
                                        </div>
                                    </div>
                                    {/* Price input for selected services */}
                                    {formData.dryCleaningServices.includes(service.id) && (
                                        <div className="mt-2 pl-7">
                                            <label className="block text-sm font-medium text-gray-700">Set Price:</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <span className="text-gray-500 sm:text-sm">₱</span>
                                                </div>
                                                <input
                                                    type="number"
                                                    value={formData.dryCleaningPrices[service.id] || ''}
                                                    onChange={(e) => handleDryCleaningPriceChange(service.id, e.target.value)}
                                                    className="w-full pl-7 pr-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="0.00"
                                                    onClick={(e) => e.stopPropagation()} // Prevent card click when interacting with input
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
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
                            Kilos of Laundry (Optional)
                        </label>
                        <input
                            type="number"
                            name="kilos"
                            value={formData.kilos}
                            onChange={handleChange}
                            step="0.1"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

                    {/* Total Price Display */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-semibold text-gray-900">Total Price:</span>
                            <span className="text-2xl font-bold text-green-600">₱{totalPrice.toFixed(2)}</span>
                        </div>
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
