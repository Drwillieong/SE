import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../../utils/axios';
import { authUtils } from '../../../utils/auth';

const CreateOrder = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        contact: '',
        email: '',
        address: '',
        mainService: 'washDryFold',
        dryCleaningServices: [],
        loadCount: 1,
        paymentMethod: 'cash',
        serviceOption: 'pickupAndDelivery',
        photos: [],
        instructions: '',
        kilos: 0,
        dryCleaningPrices: {}
    });

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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleServiceChange = (serviceId) => {
        setFormData(prev => ({
            ...prev,
            // Toggle selection: if it's already selected, unselect it
            mainService: prev.mainService === serviceId ? '' : serviceId
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

    const handleServiceOptionChange = (option) => {
        setFormData(prev => ({
            ...prev,
            serviceOption: option
        }));
    };

    const calculateTotal = () => {
        const selectedMainService = mainServices.find(s => s.id === formData.mainService);

        const mainServicePrice = selectedMainService ? selectedMainService.price * formData.loadCount : 0;
        const dryCleaningPrice = formData.dryCleaningServices.reduce((sum, serviceId) => {
            return sum + (formData.dryCleaningPrices[serviceId] || 0);
        }, 0);
        const deliveryFee = formData.serviceOption === 'pickupOnly' ? 0 : 30; // Default delivery fee

        return mainServicePrice + dryCleaningPrice + deliveryFee;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Check if user is authenticated
        if (!authUtils.isAuthenticated()) {
            alert('Please log in to create an order');
            navigate('/login');
            return;
        }

        // Set loading state
        setLoading(true);

        try {
            const response = await apiClient.post('/api/admin/orders/admin/create-from-pickup', {
                serviceType: formData.mainService,
                pickupDate: new Date().toISOString().split('T')[0], // Today's date
                pickupTime: '7am-10am', // Default pickup time
                loadCount: formData.loadCount,
                instructions: formData.instructions,
                paymentMethod: formData.paymentMethod,
                name: formData.name,
                contact: formData.contact,
                email: formData.email,
                address: formData.address,
                photos: formData.photos,
                dryCleaningServices: formData.dryCleaningServices, // Add this
                dryCleaningPrices: formData.dryCleaningPrices, // Add this
                totalPrice: calculateTotal(),
                kilos: formData.kilos,
            });

            if (response.status === 201) {
                alert('Order created successfully!');

                // Reset form
                setFormData({
                    name: '',
                    contact: '',
                    email: '',
                    address: '',
                    mainService: 'washDryFold',
                    dryCleaningServices: [],
                    loadCount: 1,
                    paymentMethod: 'cash',
                    serviceOption: 'pickupAndDelivery',
                    photos: [],
                    instructions: '',
                    kilos: 0,
                    dryCleaningPrices: {},
                });

                // Navigate to order management with a refresh parameter
                navigate('/dashboard/order?refresh=true');
            } else {
                const errorData = response.data;
                alert('Error creating order: ' + (errorData?.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error creating order:', error);

            if (error.response?.status === 401) {
                alert('Your session has expired. Please log in again.');
                authUtils.logout();
                navigate('/login');
            } else if (error.response?.status === 403) {
                alert('You do not have permission to create orders.');
                navigate('/dashboard');
            } else {
                alert('Error creating order: ' + (error.response?.data?.message || error.message));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Order</h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Customer Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Customer Name *
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
                                Contact Number *
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
                                Email
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
                                Full Address *
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
                    </div>

                    {/* Main Service */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Main Service *
                        </label>
                        <div className="space-y-3">
                            {mainServices.map(service => (
                                <div
                                    key={service.id}
                                    className={`p-4 border rounded-lg cursor-pointer ${formData.mainService === service.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                                    onClick={() => handleServiceChange(service.id)}
                                >
                                    <div className="flex items-start">
                                        <input
                                            type="checkbox"
                                            name="mainService"
                                            checked={formData.mainService === service.id}
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
                                            className="mt-1"
                                        />
                                        <div className="ml-3">
                                            <label className="font-medium">{service.name}</label>
                                            <p className="text-sm text-gray-600">{service.priceText}</p>
                                        </div>
                                    </div>
                                    {/* This is the correct location for the price input */}
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

                    {/* Load Count */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Number of Loads *
                        </label>
                        <select
                            name="loadCount"
                            value={formData.loadCount}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value={1}>1 Load</option>
                            <option value={2}>2 Loads</option>
                            <option value={3}>3 Loads</option>
                            <option value={4}>4 Loads</option>
                            <option value={5}>5 Loads</option>
                        </select>
                    </div>

                    {/* Service Option */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Service Option *
                        </label>
                        <div className="space-y-3">
                            <div
                                className={`p-4 border rounded-lg cursor-pointer ${formData.serviceOption === 'pickupOnly' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                                onClick={() => handleServiceOptionChange('pickupOnly')}
                            >
                                <div className="flex items-start">
                                    <input
                                        type="radio"
                                        name="serviceOption"
                                        checked={formData.serviceOption === 'pickupOnly'}
                                        onChange={() => {}}
                                        className="mt-1"
                                    />
                                    <div className="ml-3">
                                        <label className="font-medium">Pickup Only</label>
                                        <p className="text-sm text-gray-600">We'll pick up your laundry and you'll collect it at our location</p>
                                    </div>
                                </div>
                            </div>

                            <div
                                className={`p-4 border rounded-lg cursor-pointer ${formData.serviceOption === 'pickupAndDelivery' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                                onClick={() => handleServiceOptionChange('pickupAndDelivery')}
                            >
                                <div className="flex items-start">
                                    <input
                                        type="radio"
                                        name="serviceOption"
                                        checked={formData.serviceOption === 'pickupAndDelivery'}
                                        onChange={() => {}}
                                        className="mt-1"
                                    />
                                    <div className="ml-3">
                                        <label className="font-medium">Pickup & Delivery</label>
                                        <p className="text-sm text-gray-600">We'll pick up your laundry and deliver it back to you</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Optional Fields */}
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

                    {/* Photos */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Photos (Optional)
                        </label>
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Upload photos of your laundry items</p>
                    </div>

                    {/* Special Instructions */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Special Instructions
                        </label>
                        <textarea
                            name="instructions"
                            value={formData.instructions}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Any special instructions for your laundry..."
                        />
                    </div>

                    {/* Total Price Display */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-medium">Total Price:</span>
                            <span className="text-2xl font-bold text-blue-600">₱{calculateTotal()}</span>
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
                            Create Order
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateOrder;
