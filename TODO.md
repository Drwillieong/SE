# Booking System Bug Fixes

## Completed Tasks
- [x] Add limit check for admin bookings in bookingController.js
- [x] Remove local count update in ScheduleBooking.jsx confirmOrder; ensure fetchBookingCounts updates calendar after customer booking
- [x] Verify getBookingCountsForDates query includes 'pending' bookings
- [x] Test: Create customer booking, check calendar updates immediately and on refresh
- [x] Test: Attempt admin booking when limit reached, ensure rejection
