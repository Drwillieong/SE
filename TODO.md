# Task: Implement Booking Count Decrement on Status Change

## Information Gathered
- The `booking_counts` table tracks daily booking limits with columns: `id`, `date`, `count`, `limit_count`
- Current logic in `adminBookingController.js` deletes the entire row when a booking becomes inactive, which is incorrect
- Customer controller already has correct decrement logic in some places
- Admin bookings don't currently increment counts on creation, but should for accurate availability tracking
- Real-time updates are already implemented in the frontend via Socket.IO

## Plan
1. **Fix admin booking creation**: Add increment logic to `createAdminBooking` in `adminBookingController.js`
2. **Fix status change logic**: Update `updateBooking` in `adminBookingController.js` to decrement count instead of deleting row
3. **Fix deletion logic**: Update `deleteBooking` in `adminBookingController.js` to decrement count instead of deleting row
4. **Add transaction wrapper**: Wrap decrement/delete operations in database transactions for atomicity
5. **Ensure consistency**: Verify that all booking status changes properly update counts

## Dependent Files to be edited
- `backend/controllers/adminBookingController.js`

## Followup steps
- Test the booking count updates work correctly
- Verify real-time updates reflect in ScheduleBooking.jsx
- Ensure no race conditions with concurrent updates
