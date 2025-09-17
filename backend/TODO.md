# TODO: Fix Booking Issues

## Completed
- [x] Update Booking.js model to alias booking_id as id in SELECT queries
- [x] Modify getAllBookings controller to filter by user for non-admins
- [x] Change admin Booking.jsx to use /api/admin/bookings instead of /api/admin/orders for fetch, approve, reject, and create

## Pending
- [x] Fix Booking model's getAll method to avoid duplicate columns
- [x] Update updateBooking controller to properly handle rejectionReason updates
- [x] Verify admin dashboard booking rejection flow
- [ ] Test admin dashboard loading bookings
- [ ] Test rejection with reason
- [x] Ensure tables are created (added bookings table creation to server.js)

# TODO: Fix Role Enum Inconsistency

## Completed
- [x] Fix role enum in server.js to match schema.sql: ENUM('user', 'admin') DEFAULT 'user'
- [x] Update authController.js to set role: 'user' instead of 'customer' for regular users
- [x] Ensure admin users are created with role: 'admin' (already handled in createAdmin.js)
- [x] Fix users table primary key from 'id' to 'user_id' to match User model
- [x] Fix bookings table foreign key to reference users(user_id)
- [x] Add bookings table creation to server.js
- [x] Add SQL to update existing users with role 'customer' to 'user'

## Pending
- [x] Test sign-up functionality after fixes
- [x] Verify admin dashboard can access bookings
