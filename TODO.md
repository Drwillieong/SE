# TODO: Fix Booking Issues

## Completed
- [x] Update Booking.js model to alias booking_id as id in SELECT queries
- [x] Modify getAllBookings controller to filter by user for non-admins
- [x] Change admin Booking.jsx to use /api/admin/bookings instead of /api/admin/orders for fetch, approve, reject, and create
- [x] Fix Booking model's getAll method to avoid duplicate columns
- [x] Update updateBooking controller to properly handle rejectionReason updates
- [x] Verify admin dashboard booking rejection flow
- [x] Ensure tables are created (added bookings table creation to server.js)
- [x] Remove 10-second timeout from admin Booking.jsx fetchBookings to prevent AbortError
- [x] Update customer BookHistory.jsx to fetch from /api/bookings instead of /api/orders to reflect booking status updates
- [x] Fix admin routes to properly pass db connection to controller functions

## Pending
- [ ] Test admin dashboard loading bookings (should no longer show loading screen)
- [ ] Test admin dashboard approve/reject booking functionality
- [ ] Test customer dashboard reflects booking status and rejection reason after admin approval/rejection
- [ ] Verify end-to-end booking flow: customer creates booking -> admin sees pending booking -> admin approves/rejects -> customer sees updated status and rejection reason

## Testing Instructions
1. Start the backend server: `cd easy/backend && npm start`
2. Start the client: `cd easy/client && npm run dev`
3. Login as admin and go to admin dashboard booking page
4. Verify bookings load without AbortError
5. Login as customer, create a booking
6. Switch to admin, approve/reject the booking with reason
7. Switch to customer dashboard, verify status and rejection reason are reflected
