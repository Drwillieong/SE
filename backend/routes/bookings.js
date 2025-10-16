import express from 'express';
import { createBooking, getAllBookings, getBookingById, updateBooking, deleteBooking, getBookingsByStatus, getBookingCounts } from '../controllers/bookingController_new.js';
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

    // Get booking counts for dates
    router.post('/counts', verifyToken, getBookingCounts(db));

    return router;
};
