import { validationResult } from 'express-validator';

// Controller to get all bookings
export const getAllBookings = (db) => (req, res) => {
  const sql = "SELECT * FROM bookings ORDER BY createdAt DESC";
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching bookings:', err);
      return res.status(500).json({ message: 'Server error fetching bookings' });
    }
    res.json(results);
  });
};

// Controller to get booking by ID
export const getBookingById = (db) => (req, res) => {
  const bookingId = req.params.id;
  const sql = "SELECT * FROM bookings WHERE id = ?";
  db.query(sql, [bookingId], (err, results) => {
    if (err) {
      console.error('Error fetching booking:', err);
      return res.status(500).json({ message: 'Server error fetching booking' });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json(results[0]);
  });
};

// Controller to create a new booking
export const createBooking = (db) => (req, res) => {
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
    totalPrice
  } = req.body;

  const sql = `INSERT INTO bookings 
    (serviceType, pickupDate, pickupTime, loadCount, instructions, status, paymentMethod, name, contact, email, address, photos, totalPrice, createdAt) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;

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
    totalPrice
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error creating booking:', err);
      return res.status(500).json({ message: 'Server error creating booking' });
    }
    res.status(201).json({ message: 'Booking created successfully', bookingId: result.insertId });
  });
};

// Controller to update booking status or details
export const updateBooking = (db) => (req, res) => {
  const bookingId = req.params.id;
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
  values.push(bookingId);

  const sql = `UPDATE bookings SET ${setClause} WHERE id = ?`;

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error updating booking:', err);
      return res.status(500).json({ message: 'Server error updating booking' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json({ message: 'Booking updated successfully' });
  });
};

// Controller to delete a booking
export const deleteBooking = (db) => (req, res) => {
  const bookingId = req.params.id;
  const sql = "DELETE FROM bookings WHERE id = ?";
  db.query(sql, [bookingId], (err, result) => {
    if (err) {
      console.error('Error deleting booking:', err);
      return res.status(500).json({ message: 'Server error deleting booking' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json({ message: 'Booking deleted successfully' });
  });
};
