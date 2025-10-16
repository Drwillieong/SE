import express from 'express';
import {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  getOrdersByStatus,
  submitGcashPayment
} from './controllers/orderController.js';
import { verifyToken } from './middleware/authMiddleware.js';
import { multerUpload } from './controllers/uploadController.js';

const router = express.Router();

// This function will be called from server.js to pass the db connection
export default (db) => {
    // Get all orders for the authenticated user
    router.get('/', verifyToken, getAllOrders(db));

    // Create a new order
    router.post('/', verifyToken, (req, res) => {
        const orderData = {
            ...req.body,
            user_id: req.user.user_id
        };
        createOrder(db)({ ...req, body: orderData }, res);
    });

    // Get order by ID (only if it belongs to the authenticated user)
    router.get('/:id', verifyToken, getOrderById(db));

    // Update order (only if it belongs to the authenticated user)
    router.put('/:id', verifyToken, updateOrder(db));

    // Delete order (only if it belongs to the authenticated user)
    router.delete('/:id', verifyToken, deleteOrder(db));

    // Get orders by status
    router.get('/status/:status', verifyToken, getOrdersByStatus(db));

    // Submit GCash payment proof
    router.post('/:id/gcash-payment', verifyToken, submitGcashPayment(db));

    return router;
};
