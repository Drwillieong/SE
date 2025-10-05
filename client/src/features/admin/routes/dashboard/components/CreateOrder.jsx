import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { authUtils } from '../../../../../utils/auth';

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
        estimatedClothes: 0,
        kilos: 0,
        pants: 0,
        shorts: 0,
        tshirts: 0,
        bedsheets: 0
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
            price: 350,
            priceText: '₱350 per item'
        },
        {
            id: 'dryCleanCoat',
            name: 'Dry Cleaning - Coat',
            price: 400,
            priceText: '₱400 per item'
        },
        {
            id: 'dryCleanGown',
            name: 'Dry Cleaning - Gown',
            price: 650,
            priceText: '₱650 per item'
        },
        {
            id: 'dryCleanWeddingGown',
            name: 'Dry Cleaning - Wedding Gown',
            price: 1500,
            priceText: '₱1,500 per item'
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
            mainService: serviceId
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

    const handleServiceOptionChange = (option) => {
        setFormData(prev => ({
            ...prev,
            serviceOption: option
        }));
    };

    const calculateTotal = () => {
        const selectedMainService = mainServices.find(s => s.id === formData.mainService);
        const selectedDryCleaning = dryCleaningServices.filter(s => formData.dryCleaningServices.includes(s.id));

        const mainServicePrice = selectedMainService ? selectedMainService.price * formData.loadCount : 0;
        const dryCleaningPrice = selectedDryCleaning.reduce((sum, s) => sum + s.price, 0);
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
            const response = await api.post('/api/admin/orders', {
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
                totalPrice: calculateTotal(),
                estimatedClothes: formData.estimatedClothes,
                kilos: formData.kilos,
                pants: formData.pants,
                shorts: formData.shorts,
                tshirts: formData.tshirts,
                bedsheets: formData.bedsheets
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
                    estimatedClothes: 0,
                    kilos: 0,
                    pants: 0,
                    shorts: 0,
                    tshirts: 0,
                    bedsheets: 0
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
                                            type="radio"
                                            name="mainService"
                                            checked={formData.mainService === service.id}
                                            onChange={() => {}}
                                            className="mt-1"
                                        />
                                        <div className="ml-3">
                                            <label className="font-medium">{service.name}</label>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Estimated Total Clothes (Optional)
                            </label>
                            <input
                                type="number"
                                name="estimatedClothes"
                                value={formData.estimatedClothes}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    </div>

                    {/* Item Counts */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Number of Pants (Optional)
                            </label>
                            <input
                                type="number"
                                name="pants"
                                value={formData.pants}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Number of Shorts (Optional)
                            </label>
                            <input
                                type="number"
                                name="shorts"
                                value={formData.shorts}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Number of T-Shirts (Optional)
                            </label>
                            <input
                                type="number"
                                name="tshirts"
                                value={formData.tshirts}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Number of Bedsheets (Optional)
                            </label>
                            <input
                                type="number"
                                name="bedsheets"
                                value={formData.bedsheets}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
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
