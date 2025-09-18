import express from 'express';
import { createOrder, getAllOrders, getOrderById, updateOrder, deleteOrder, getOrdersByStatus, createOrderFromPickup } from '../controllers/orderController.js';
import { verifyToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// This function will be called from server.js to pass the db connection
export default (db) => {
    // Get all orders for the authenticated user
    router.get('/', verifyToken, getAllOrders(db));

    // Create a new order
    router.post('/', verifyToken, (req, res) => {
        const orderData = {
            ...req.body,
            userId: req.user.user_id
        };
        createOrder(db)({ ...req, body: orderData }, res);
    });

    // Get order by ID (only if it belongs to the authenticated user)
    router.get('/:id', verifyToken, getOrderById(db));

    // Update order (only if it belongs to the authenticated user)
    router.put('/:id', verifyToken, updateOrder(db));

    // Delete order (only if it belongs to the authenticated user)
    router.delete('/:id', verifyToken, deleteOrder(db));

    // Admin route to create order from pickup details
    router.post('/admin/create-from-pickup', verifyToken, requireAdmin, createOrderFromPickup(db));

    return router;
};
