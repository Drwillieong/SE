import express from 'express';
import { body } from 'express-validator';
import { getAllBookings, getBookingById, createBooking, updateBooking, deleteBooking, sendPickupEmail } from '../controllers/bookingController.js';
import { getAllUsers } from '../controllers/userController.js';
import {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  getOrdersByStatus,
  createOrderFromPickup,
  getOrderStats,
  autoAdvanceOrder,
  startOrderTimer,
  stopOrderTimer,
  getOrderTimerStatus,
  toggleOrderAutoAdvance,
  advanceOrderToNextStatus,
  getOrdersWithActiveTimers,
  getOrdersWithExpiredTimers
} from '../controllers/orderController.js';
import { verifyToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Booking routes
router.get('/bookings', verifyToken, requireAdmin, (req, res) => getAllBookings(req.db)(req, res));
router.get('/bookings/:id', verifyToken, requireAdmin, (req, res) => getBookingById(req.db)(req, res));
router.post('/bookings', [
  body('serviceType').isIn(['washFold', 'dryCleaning', 'hangDry']).withMessage('Invalid service type'),
  body('pickupDate').isISO8601().withMessage('Invalid pickup date'),
  body('pickupTime').isIn(['7am-10am', '5pm-7pm']).withMessage('Invalid pickup time'),
  body('loadCount').isInt({ min: 1, max: 2 }).withMessage('Load count must be 1 or 2'),
  body('name').notEmpty().withMessage('Name is required'),
  body('contact').notEmpty().withMessage('Contact is required'),
  body('address').notEmpty().withMessage('Address is required'),
  body('paymentMethod').isIn(['cash', 'gcash', 'card']).withMessage('Invalid payment method')
], verifyToken, requireAdmin, (req, res) => createBooking(req.db)(req, res));
router.put('/bookings/:id', verifyToken, requireAdmin, (req, res) => updateBooking(req.db)(req, res));
router.delete('/bookings/:id', verifyToken, requireAdmin, (req, res) => deleteBooking(req.db)(req, res));
router.post('/bookings/:id/pickup-email', verifyToken, requireAdmin, (req, res) => sendPickupEmail(req.db)(req, res));

// Order routes
router.get('/orders', verifyToken, requireAdmin, (req, res) => getAllOrders(req.db)(req, res));
router.get('/orders/stats', verifyToken, requireAdmin, (req, res) => getOrderStats(req.db)(req, res));
router.get('/orders/status/:status', verifyToken, requireAdmin, (req, res) => getOrdersByStatus(req.db)(req, res));
router.get('/orders/:id', verifyToken, requireAdmin, (req, res) => getOrderById(req.db)(req, res));
router.post('/orders', [
  body('serviceType').isIn(['washFold', 'dryCleaning', 'hangDry']).withMessage('Invalid service type'),
  body('pickupDate').isISO8601().withMessage('Invalid pickup date'),
  body('pickupTime').isIn(['7am-10am', '5pm-7pm']).withMessage('Invalid pickup time'),
  body('loadCount').isInt({ min: 1, max: 2 }).withMessage('Load count must be 1 or 2'),
  body('name').notEmpty().withMessage('Name is required'),
  body('contact').notEmpty().withMessage('Contact is required'),
  body('address').notEmpty().withMessage('Address is required'),
  body('paymentMethod').isIn(['cash', 'gcash', 'card']).withMessage('Invalid payment method')
], verifyToken, requireAdmin, (req, res) => createOrder(req.db)(req, res));
router.post('/orders/admin/create-from-pickup', verifyToken, requireAdmin, (req, res) => createOrderFromPickup(req.db)(req, res));
router.put('/orders/:id', verifyToken, requireAdmin, (req, res) => updateOrder(req.db)(req, res));
router.put('/orders/:id/auto-advance', verifyToken, requireAdmin, (req, res) => autoAdvanceOrder(req.db)(req, res));
router.delete('/orders/:id', verifyToken, requireAdmin, (req, res) => deleteOrder(req.db)(req, res));

// Timer management routes
router.post('/orders/:id/timer/start', verifyToken, requireAdmin, (req, res) => startOrderTimer(req.db)(req, res));
router.post('/orders/:id/timer/stop', verifyToken, requireAdmin, (req, res) => stopOrderTimer(req.db)(req, res));
router.get('/orders/:id/timer/status', verifyToken, requireAdmin, (req, res) => getOrderTimerStatus(req.db)(req, res));
router.put('/orders/:id/auto-advance/toggle', verifyToken, requireAdmin, (req, res) => toggleOrderAutoAdvance(req.db)(req, res));
router.put('/orders/:id/status/next', verifyToken, requireAdmin, (req, res) => advanceOrderToNextStatus(req.db)(req, res));
router.get('/orders/timers/active', verifyToken, requireAdmin, (req, res) => getOrdersWithActiveTimers(req.db)(req, res));
router.get('/orders/timers/expired', verifyToken, requireAdmin, (req, res) => getOrdersWithExpiredTimers(req.db)(req, res));

// User management routes (admin only)
router.get('/users', verifyToken, requireAdmin, (req, res) => getAllUsers(req.db)(req, res));

export default router;
