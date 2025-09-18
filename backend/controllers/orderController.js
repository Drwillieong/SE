import { validationResult } from 'express-validator';
import { Order } from '../models/Order.js';

// Controller to get all orders
export const getAllOrders = (db) => async (req, res) => {
  const orderModel = new Order(db);
  try {
    const orders = await orderModel.getAll();
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Server error fetching orders' });
  }
};

// Controller to get order by ID
export const getOrderById = (db) => async (req, res) => {
  const orderId = req.params.id;
  const orderModel = new Order(db);
  try {
    const order = await orderModel.getById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Server error fetching order' });
  }
};

// Controller to create a new order
export const createOrder = (db) => async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const orderModel = new Order(db);
  try {
    const orderId = await orderModel.create(req.body);
    res.status(201).json({ message: 'Order created successfully', orderId });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Server error creating order' });
  }
};

// Controller to update order status or details
export const updateOrder = (db) => async (req, res) => {
  const orderId = req.params.id;
  const updates = req.body;
  const orderModel = new Order(db);

  try {
    await orderModel.update(orderId, updates);
    res.json({ message: 'Order updated successfully' });
  } catch (error) {
    console.error('Error updating order:', error);
    if (error.message === 'Order not found') {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (error.message === 'No fields to update') {
      return res.status(400).json({ message: 'No fields to update' });
    }
    res.status(500).json({ message: 'Server error updating order' });
  }
};

// Controller to delete an order
export const deleteOrder = (db) => async (req, res) => {
  const orderId = req.params.id;
  const orderModel = new Order(db);
  try {
    await orderModel.delete(orderId);
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    if (error.message === 'Order not found') {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(500).json({ message: 'Server error deleting order' });
  }
};

// Controller to get orders by status
export const getOrdersByStatus = (db) => async (req, res) => {
  const status = req.params.status;
  const orderModel = new Order(db);
  try {
    const orders = await orderModel.getByStatus(status);
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders by status:', error);
    res.status(500).json({ message: 'Server error fetching orders' });
  }
};

// Controller to create order from pickup details (admin only)
export const createOrderFromPickup = (db) => async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const orderModel = new Order(db);
  try {
    const orderData = {
      ...req.body,
      status: 'pending', // Set initial status for new orders from pickup
      userId: req.body.userId || null // Link to user if available
    };
    const orderId = await orderModel.create(orderData);
    res.status(201).json({ message: 'Order created successfully from pickup', orderId });
  } catch (error) {
    console.error('Error creating order from pickup:', error);
    res.status(500).json({ message: 'Server error creating order from pickup' });
  }
};
