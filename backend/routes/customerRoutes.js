import express from 'express';
import {
  getCustomerBookings,
  getCustomerOrders,
  getCustomerOrderById,
  createCustomerBooking,
  getBookingCount,
  getCustomerBookingCounts,
  getCustomerHistory,
  updateCustomerProfile,
  getCustomerProfile,
  submitCustomerGcashPayment,
  updateCustomerOrder,
  cancelCustomerOrder
} from '../controllers/customerController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { requireCustomer } from '../middleware/authMiddleware.js';

const router = express.Router();

// This function will be called from server.js to pass the db connection
export default (db) => {
    // Get customer bookings (pending bookings only)
    router.get('/bookings', verifyToken, requireCustomer, getCustomerBookings(db));

    // Get all orders for the authenticated customer
    router.get('/orders', verifyToken, requireCustomer, getCustomerOrders(db));

    // Create a new order/booking for customer
    router.post('/orders', verifyToken, requireCustomer, createCustomerBooking(db));

    // Get booking count for a specific date
    router.get('/booking-count', verifyToken, requireCustomer, getBookingCount(db));

    // Get booking counts for dates (for customer booking calendar)
    router.get('/orders/counts', verifyToken, requireCustomer, getCustomerBookingCounts(db));

    // Get booking counts for calendar display
    router.get('/calendar-bookings', verifyToken, requireCustomer, getCustomerBookingCounts(db));

    // Get customer order by ID
    router.get('/orders/:id', verifyToken, requireCustomer, getCustomerOrderById(db));

    // Get customer history
    router.get('/history', verifyToken, requireCustomer, getCustomerHistory(db));

    // Get customer profile
    router.get('/profile', verifyToken, requireCustomer, getCustomerProfile(db));

    // Update customer profile
    router.put('/profile', verifyToken, requireCustomer, updateCustomerProfile(db));

    // Submit GCash payment proof for customer
    router.post('/orders/:id/gcash-payment', verifyToken, requireCustomer, submitCustomerGcashPayment(db));

    // Update customer order (for editing)
    router.put('/orders/:id', verifyToken, requireCustomer, updateCustomerOrder(db));

    // Cancel customer order
    router.put('/orders/:id/cancel', verifyToken, requireCustomer, cancelCustomerOrder(db));

    return router;
};
