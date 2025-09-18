import { validationResult } from 'express-validator';
import { Booking } from '../models/Booking.js';

// Controller to get all bookings
export const getAllBookings = (db) => async (req, res) => {
  const bookingModel = new Booking(db);
  try {
    let bookings;
    if (req.user.role === 'admin') {
      bookings = await bookingModel.getAll();
    } else {
      bookings = await bookingModel.getByUserId(req.user.user_id);
    }
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Server error fetching bookings' });
  }
};

// Controller to get booking by ID
export const getBookingById = (db) => async (req, res) => {
  const bookingId = req.params.id;
  const bookingModel = new Booking(db);
  try {
    const booking = await bookingModel.getById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json(booking);
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ message: 'Server error fetching booking' });
  }
};

// Controller to create a new booking
export const createBooking = (db) => async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const bookingModel = new Booking(db);
  try {
    const bookingId = await bookingModel.create(req.body);
    res.status(201).json({ message: 'Booking created successfully', bookingId });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ message: 'Server error creating booking' });
  }
};

// Controller to update booking status or details
export const updateBooking = (db) => async (req, res) => {
  const bookingId = req.params.id;
  const updates = req.body;
  const bookingModel = new Booking(db);

  // Validate rejectionReason if status is rejected
  if (updates.status === 'rejected' && (!updates.rejectionReason || updates.rejectionReason.trim() === '')) {
    return res.status(400).json({ message: 'Rejection reason is required when rejecting a booking' });
  }

  try {
    await bookingModel.update(bookingId, updates);
    res.json({ message: 'Booking updated successfully' });
  } catch (error) {
    console.error('Error updating booking:', error);
    if (error.message === 'Booking not found') {
      return res.status(404).json({ message: 'Booking not found' });
    }
    if (error.message === 'No fields to update') {
      return res.status(400).json({ message: 'No fields to update' });
    }
    res.status(500).json({ message: 'Server error updating booking' });
  }
};

// Controller to delete a booking
export const deleteBooking = (db) => async (req, res) => {
  const bookingId = req.params.id;
  const bookingModel = new Booking(db);
  try {
    await bookingModel.delete(bookingId);
    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    if (error.message === 'Booking not found') {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.status(500).json({ message: 'Server error deleting booking' });
  }
};

// Controller to get bookings by status
export const getBookingsByStatus = (db) => async (req, res) => {
  const status = req.params.status;
  const bookingModel = new Booking(db);
  try {
    const bookings = await bookingModel.getByStatus(status);
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings by status:', error);
    res.status(500).json({ message: 'Server error fetching bookings' });
  }
};

// Controller to send pickup notification email
export const sendPickupEmail = (db) => async (req, res) => {
  const bookingId = req.params.id;
  const bookingModel = new Booking(db);

  try {
    // Get booking details
    const booking = await bookingModel.getById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if booking is approved
    if (booking.status !== 'approved') {
      return res.status(400).json({ message: 'Can only send pickup notification for approved bookings' });
    }

    // Import email function
    const { sendPickupEmail: sendEmail } = await import('../utils/email.js');

    // Send email
    await sendEmail(booking.email, booking.name, booking.address);

    res.json({ message: 'Pickup notification email sent successfully' });
  } catch (error) {
    console.error('Error sending pickup email:', error);
    if (error.message === 'Email transporter not configured') {
      return res.status(500).json({ message: 'Email service not configured' });
    }
    res.status(500).json({ message: error.message || 'Server error sending pickup email' });
  }
};
