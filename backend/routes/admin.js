import express from 'express';
import { body } from 'express-validator';
import { getAllBookings, getBookingById, createBooking, updateBooking, deleteBooking } from '../controllers/bookingController.js';
import { getAllOrders, getOrderById, createOrder, updateOrder, deleteOrder, getOrdersByStatus } from '../controllers/orderController.js';
import { getDashboardStats, getMonthlyRevenue, getWeeklyOrders } from '../controllers/dashboardController.js';
import { getAllUsers } from '../controllers/userController.js';
import { verifyToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Booking routes
router.get('/bookings', verifyToken, requireAdmin, getAllBookings);
router.get('/bookings/:id', verifyToken, requireAdmin, getBookingById);
router.post('/bookings', [
  body('serviceType').isIn(['washFold', 'dryCleaning', 'hangDry']).withMessage('Invalid service type'),
  body('pickupDate').isISO8601().withMessage('Invalid pickup date'),
  body('pickupTime').isIn(['7am-10am', '5pm-7pm']).withMessage('Invalid pickup time'),
  body('loadCount').isInt({ min: 1, max: 2 }).withMessage('Load count must be 1 or 2'),
  body('name').notEmpty().withMessage('Name is required'),
  body('contact').notEmpty().withMessage('Contact is required'),
  body('address').notEmpty().withMessage('Address is required'),
  body('paymentMethod').isIn(['cash', 'gcash', 'card']).withMessage('Invalid payment method')
], verifyToken, requireAdmin, createBooking);
router.put('/bookings/:id', verifyToken, requireAdmin, updateBooking);
router.delete('/bookings/:id', verifyToken, requireAdmin, deleteBooking);

// Order routes
router.get('/orders', verifyToken, requireAdmin, getAllOrders);
router.get('/orders/:id', verifyToken, requireAdmin, getOrderById);
router.get('/orders/status/:status', verifyToken, requireAdmin, getOrdersByStatus);
router.post('/orders', [
  body('serviceType').isIn(['washFold', 'dryCleaning', 'hangDry']).withMessage('Invalid service type'),
  body('pickupDate').isISO8601().withMessage('Invalid pickup date'),
  body('pickupTime').isIn(['7am-10am', '5pm-7pm']).withMessage('Invalid pickup time'),
  body('loadCount').isInt({ min: 1, max: 2 }).withMessage('Load count must be 1 or 2'),
  body('name').notEmpty().withMessage('Name is required'),
  body('contact').notEmpty().withMessage('Contact is required'),
  body('address').notEmpty().withMessage('Address is required'),
  body('paymentMethod').isIn(['cash', 'gcash', 'card']).withMessage('Invalid payment method')
], verifyToken, requireAdmin, createOrder);
router.put('/orders/:id', verifyToken, requireAdmin, updateOrder);
router.delete('/orders/:id', verifyToken, requireAdmin, deleteOrder);

// Dashboard routes
router.get('/dashboard/stats', verifyToken, requireAdmin, getDashboardStats);
router.get('/dashboard/revenue', verifyToken, requireAdmin, getMonthlyRevenue);
router.get('/dashboard/weekly-orders', verifyToken, requireAdmin, getWeeklyOrders);

// User management routes (admin only)
router.get('/users', verifyToken, requireAdmin, getAllUsers);

export default router;
