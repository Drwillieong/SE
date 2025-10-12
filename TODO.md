# Fix Booking Issues

## Problems to Fix
1. When booking in ScheduleBooking (customer), the count doesn't increment in the mini calendar.
2. In Booking.jsx (admin), you can still create bookings even if the day is fully booked (max 3).
3. When creating a booking in Booking.jsx (admin), the mini calendar in ScheduleBooking doesn't update.

## Plan
- Add booking count check in admin Booking.jsx before creating booking to prevent overbooking.
- Ensure real-time updates work via socket for customer mini calendar when admin creates bookings.
- Verify that customer booking increments the count properly.

## Steps
1. Modify Booking.jsx to add count check before creating booking.
2. Test the admin overbooking prevention.
3. Test real-time updates from admin to customer.
4. Test customer booking increment.
