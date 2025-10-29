import express from 'express';
import {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  getOrdersByStatus,
  startOrderTimer,
  stopOrderTimer,
  getOrderTimerStatus,
  toggleOrderAutoAdvance,
  advanceOrderToNextStatus,
  getOrdersWithActiveTimers,
  getOrdersWithExpiredTimers,
  updatePaymentStatus,
  reviewGcashPayment,
  completeOrder,
  softDeleteOrder
} from '../controllers/adminOrderController.js';
import { verifyToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// This function will be called from server.js to pass the db connection
export default (db) => {
    // Get all orders for admin
    router.get('/', verifyToken, requireAdmin, getAllOrders(db));

    // Create order for admin
    router.post('/', verifyToken, requireAdmin, createOrder(db));

    // Create order from pickup (admin)
    router.post('/admin/create-from-pickup', verifyToken, requireAdmin, createOrder(db));

    // Get order by ID
    router.get('/:id', verifyToken, requireAdmin, getOrderById(db));

    // Update order status or details
    router.put('/:id', verifyToken, requireAdmin, updateOrder(db));

    // Delete order
    router.delete('/:id', verifyToken, requireAdmin, deleteOrder(db));

    // Get orders by status
    router.get('/status/:status', verifyToken, requireAdmin, getOrdersByStatus(db));

    // Timer management
    router.post('/:id/start-timer', verifyToken, requireAdmin, startOrderTimer(db));
    router.post('/:id/stop-timer', verifyToken, requireAdmin, stopOrderTimer(db));
    router.get('/:id/timer-status', verifyToken, requireAdmin, getOrderTimerStatus(db));
    router.post('/:id/toggle-auto-advance', verifyToken, requireAdmin, toggleOrderAutoAdvance(db));
    router.post('/:id/advance-status', verifyToken, requireAdmin, advanceOrderToNextStatus(db));

    // Get orders with active/expired timers
    router.get('/timers/active', verifyToken, requireAdmin, getOrdersWithActiveTimers(db));
    router.get('/timers/expired', verifyToken, requireAdmin, getOrdersWithExpiredTimers(db));

    // Payment management
    router.put('/:id/payment-status', verifyToken, requireAdmin, updatePaymentStatus(db));
    router.post('/:id/review-gcash', verifyToken, requireAdmin, reviewGcashPayment(db));

    // Order completion and history
    router.post('/:id/complete', verifyToken, requireAdmin, completeOrder(db));
    router.delete('/:id/soft-delete', verifyToken, requireAdmin, softDeleteOrder(db));

    return router;
};
