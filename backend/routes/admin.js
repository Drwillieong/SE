import express from 'express';
import { body } from 'express-validator';
import { getAllBookings, getBookingById, createBooking, updateBooking, deleteBooking } from '../controllers/bookingController.js';
import { getAllOrders, getOrderById, createOrder, updateOrder, deleteOrder, getOrdersByStatus } from '../controllers/orderController.js';
import { getDashboardStats, getMonthlyRevenue, getWeeklyOrders } from '../controllers/dashboardController.js';
import { getAllUsers } from '../controllers/userController.js';

const router = express.Router();

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Booking routes
router.get('/bookings', requireAdmin, getAllBookings);
router.get('/bookings/:id', requireAdmin, getBookingById);
router.post('/bookings', [
  body('serviceType').isIn(['washFold', 'dryCleaning', 'hangDry']).withMessage('Invalid service type'),
  body('pickupDate').isISO8601().withMessage('Invalid pickup date'),
  body('pickupTime').isIn(['7am-10am', '5pm-7pm']).withMessage('Invalid pickup time'),
  body('loadCount').isInt({ min: 1, max: 2 }).withMessage('Load count must be 1 or 2'),
  body('name').notEmpty().withMessage('Name is required'),
  body('contact').notEmpty().withMessage('Contact is required'),
  body('address').notEmpty().withMessage('Address is required'),
  body('paymentMethod').isIn(['cash', 'gcash', 'card']).withMessage('Invalid payment method')
], requireAdmin, createBooking);
router.put('/bookings/:id', requireAdmin, updateBooking);
router.delete('/bookings/:id', requireAdmin, deleteBooking);

// Order routes
router.get('/orders', requireAdmin, (req, res) => {
  console.log('GET /api/admin/orders called, user:', req.user);
  getAllOrders(req.db)(req, res);
});
router.get('/orders/:id', requireAdmin, getOrderById);
router.get('/orders/status/:status', requireAdmin, getOrdersByStatus);
router.post('/orders', [
  body('serviceType').isIn(['washFold', 'dryCleaning', 'hangDry']).withMessage('Invalid service type'),
  body('pickupDate').isISO8601().withMessage('Invalid pickup date'),
  body('pickupTime').isIn(['7am-10am', '5pm-7pm']).withMessage('Invalid pickup time'),
  body('loadCount').isInt({ min: 1, max: 2 }).withMessage('Load count must be 1 or 2'),
  body('name').notEmpty().withMessage('Name is required'),
  body('contact').notEmpty().withMessage('Contact is required'),
  body('address').notEmpty().withMessage('Address is required'),
  body('paymentMethod').isIn(['cash', 'gcash', 'card']).withMessage('Invalid payment method')
], requireAdmin, createOrder);
router.put('/orders/:id', requireAdmin, updateOrder);
router.delete('/orders/:id', requireAdmin, deleteOrder);

// Dashboard routes
router.get('/dashboard/stats', requireAdmin, getDashboardStats);
router.get('/dashboard/revenue', requireAdmin, getMonthlyRevenue);
router.get('/dashboard/weekly-orders', requireAdmin, getWeeklyOrders);

// User management routes (admin only)
router.get('/users', requireAdmin, getAllUsers);

export default router;
