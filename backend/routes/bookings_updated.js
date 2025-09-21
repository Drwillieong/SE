import express from 'express';
import { createBooking, getAllBookings, getBookingById, updateBooking, deleteBooking, getBookingsByStatus, sendPickupEmail, sendPickupSMS, sendPickupNotification } from '../controllers/bookingController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// This function will be called from server.js to pass the db connection
export default (db) => {
    // Get all bookings for the authenticated user
    router.get('/', verifyToken, getAllBookings(db));

    // Create a new booking
    router.post('/', verifyToken, (req, res) => {
        const bookingData = {
            ...req.body,
            user_id: req.user.user_id
        };
        createBooking(db)({ ...req, body: bookingData }, res);
    });

    // Get booking by ID (only if it belongs to the authenticated user)
    router.get('/:id', verifyToken, getBookingById(db));

    // Update booking (only if it belongs to the authenticated user)
    router.put('/:id', verifyToken, updateBooking(db));

    // Delete booking (only if it belongs to the authenticated user)
    router.delete('/:id', verifyToken, deleteBooking(db));

    // Get bookings by status
    router.get('/status/:status', verifyToken, getBookingsByStatus(db));

    // Send pickup notification email
    router.post('/:id/pickup-email', verifyToken, sendPickupEmail(db));

    // Send pickup notification SMS
    router.post('/:id/pickup-sms', verifyToken, sendPickupSMS(db));

    // Send both pickup notification email and SMS (default pickup action)
    router.post('/:id/pickup-notification', verifyToken, sendPickupNotification(db));

    return router;
};
