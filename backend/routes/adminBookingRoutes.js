import express from 'express';
import {
  getWelcomeMessage,
  getAllBookings,
  getBookingById,
  createAdminBooking,
  updateBooking,
  deleteBooking,
  getBookingsByStatus,
  approveBooking,
  getBookingCounts,
  sendPickupEmail,
  sendPickupSMS,
  sendPickupNotification
} from '../controllers/adminBookingController.js';
import { verifyToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// This function will be called from server.js to pass the db connection
export default (db) => {
    // Welcome endpoint
    router.get('/welcome', verifyToken, requireAdmin, getWelcomeMessage(db));

    // Get all bookings for admin
    router.get('/', verifyToken, requireAdmin, getAllBookings(db));

    // Create booking for admin (no limits)
    router.post('/', verifyToken, requireAdmin, createAdminBooking(db));

    // Get booking by ID
    router.get('/:id', verifyToken, requireAdmin, getBookingById(db));

    // Update booking status or details
    router.put('/:id', verifyToken, requireAdmin, updateBooking(db));

    // Delete booking
    router.delete('/:id', verifyToken, requireAdmin, deleteBooking(db));

    // Get bookings by status
    router.get('/status/:status', verifyToken, requireAdmin, getBookingsByStatus(db));

    // Approve booking and convert to order
    router.post('/:id/approve', verifyToken, requireAdmin, approveBooking(db));

    // Get booking counts for dates
    router.post('/counts', verifyToken, requireAdmin, getBookingCounts(db));

    // Send pickup notification email
    router.post('/:id/send-email', verifyToken, requireAdmin, sendPickupEmail(db));

    // Send pickup notification SMS
    router.post('/:id/send-sms', verifyToken, requireAdmin, sendPickupSMS(db));

    // Send both pickup notification email and SMS
    router.post('/:id/pickup-notification', verifyToken, requireAdmin, sendPickupNotification(db));

    return router;
};
