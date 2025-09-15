import express from 'express';
import jwt from 'jsonwebtoken';
import { createOrder, getAllOrders, getOrderById, updateOrder, deleteOrder, getOrdersByStatus } from '../controllers/orderController.js';

const router = express.Router();

// JWT middleware to verify tokens
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access token required' });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// This function will be called from server.js to pass the db connection
export default (db) => {
    // Get all orders for the authenticated user
    router.get('/', verifyToken, (req, res) => {
        console.log('Received GET /api/orders request for user:', req.user.id);
        const sql = "SELECT * FROM orders WHERE userId = ? ORDER BY createdAt DESC";
        db.query(sql, [req.user.id], (err, results) => {
            if (err) {
                console.error('Error fetching user orders:', err);
                return res.status(500).json({ message: 'Server error fetching orders' });
            }
            res.json(results);
        });
    });

    // Create a new order
    router.post('/', verifyToken, (req, res) => {
        const orderData = {
            ...req.body,
            userId: req.user.id
        };
        createOrder(db)({ ...req, body: orderData }, res);
    });

    // Get order by ID (only if it belongs to the authenticated user)
    router.get('/:id', verifyToken, (req, res) => {
        const orderId = req.params.id;
        const sql = "SELECT * FROM orders WHERE id = ? AND userId = ?";
        db.query(sql, [orderId, req.user.id], (err, results) => {
            if (err) {
                console.error('Error fetching order:', err);
                return res.status(500).json({ message: 'Server error fetching order' });
            }
            if (results.length === 0) {
                return res.status(404).json({ message: 'Order not found' });
            }
            res.json(results[0]);
        });
    });

    // Update order (only if it belongs to the authenticated user)
    router.put('/:id', verifyToken, (req, res) => {
        const orderId = req.params.id;
        // First check if the order belongs to the user
        const checkSql = "SELECT id FROM orders WHERE id = ? AND userId = ?";
        db.query(checkSql, [orderId, req.user.id], (err, results) => {
            if (err) {
                console.error('Error checking order ownership:', err);
                return res.status(500).json({ message: 'Server error' });
            }
            if (results.length === 0) {
                return res.status(404).json({ message: 'Order not found or access denied' });
            }
            // Order belongs to user, proceed with update
            updateOrder(db)({ ...req, params: { id: orderId } }, res);
        });
    });

    // Delete order (only if it belongs to the authenticated user)
    router.delete('/:id', verifyToken, (req, res) => {
        const orderId = req.params.id;
        // First check if the order belongs to the user
        const checkSql = "SELECT id FROM orders WHERE id = ? AND userId = ?";
        db.query(checkSql, [orderId, req.user.id], (err, results) => {
            if (err) {
                console.error('Error checking order ownership:', err);
                return res.status(500).json({ message: 'Server error' });
            }
            if (results.length === 0) {
                return res.status(404).json({ message: 'Order not found or access denied' });
            }
            // Order belongs to user, proceed with delete
            deleteOrder(db)({ ...req, params: { id: orderId } }, res);
        });
    });

    return router;
};
