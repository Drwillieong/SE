import { validationResult } from 'express-validator';

// Controller to get all orders
export const getAllOrders = (db) => (req, res) => {
  const sql = "SELECT * FROM orders ORDER BY createdAt DESC";
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching orders:', err);
      return res.status(500).json({ message: 'Server error fetching orders' });
    }
    res.json(results);
  });
};

// Controller to get order by ID
export const getOrderById = (db) => (req, res) => {
  const orderId = req.params.id;
  const sql = "SELECT * FROM orders WHERE id = ?";
  db.query(sql, [orderId], (err, results) => {
    if (err) {
      console.error('Error fetching order:', err);
      return res.status(500).json({ message: 'Server error fetching order' });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(results[0]);
  });
};

// Controller to create a new order
export const createOrder = (db) => (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    serviceType,
    pickupDate,
    pickupTime,
    loadCount,
    instructions,
    status,
    paymentMethod,
    name,
    contact,
    email,
    address,
    photos,
    totalPrice,
    userId
  } = req.body;

  const sql = `INSERT INTO orders
    (serviceType, pickupDate, pickupTime, loadCount, instructions, status, paymentMethod, name, contact, email, address, photos, totalPrice, userId, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;

  // photos will be stored as JSON string
  const photosJson = photos ? JSON.stringify(photos) : JSON.stringify([]);

  const values = [
    serviceType,
    pickupDate,
    pickupTime,
    loadCount,
    instructions,
    status || 'pending',
    paymentMethod,
    name,
    contact,
    email,
    address,
    photosJson,
    totalPrice,
    userId
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error creating order:', err);
      return res.status(500).json({ message: 'Server error creating order' });
    }
    res.status(201).json({ message: 'Order created successfully', orderId: result.insertId });
  });
};

// Controller to update order status or details
export const updateOrder = (db) => (req, res) => {
  const orderId = req.params.id;
  const updates = req.body;

  // If photos are included, convert to JSON string
  if (updates.photos) {
    updates.photos = JSON.stringify(updates.photos);
  }

  const fields = Object.keys(updates);
  if (fields.length === 0) {
    return res.status(400).json({ message: 'No fields to update' });
  }

  const setClause = fields.map(field => `${field} = ?`).join(', ');
  const values = fields.map(field => updates[field]);
  values.push(orderId);

  const sql = `UPDATE orders SET ${setClause} WHERE id = ?`;

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error updating order:', err.sqlMessage || err.message || err);
      return res.status(500).json({ message: 'Server error updating order', error: err.sqlMessage || err.message || err });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json({ message: 'Order updated successfully' });
  });
};

// Controller to delete an order
export const deleteOrder = (db) => (req, res) => {
  const orderId = req.params.id;
  const sql = "DELETE FROM orders WHERE id = ?";
  db.query(sql, [orderId], (err, result) => {
    if (err) {
      console.error('Error deleting order:', err);
      return res.status(500).json({ message: 'Server error deleting order' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json({ message: 'Order deleted successfully' });
  });
};

// Controller to get orders by status
export const getOrdersByStatus = (db) => (req, res) => {
  const status = req.params.status;
  const sql = "SELECT * FROM orders WHERE status = ? ORDER BY createdAt DESC";
  db.query(sql, [status], (err, results) => {
    if (err) {
      console.error('Error fetching orders by status:', err);
      return res.status(500).json({ message: 'Server error fetching orders' });
    }
    res.json(results);
  });
};
