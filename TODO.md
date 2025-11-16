# Booking Count Fix - Task Breakdown

## Problem
When orders change status from active states (pending, pending_booking, approved, washing, drying, folding, ready) to non-active states (cancelled, rejected, completed), the booking count for that pickup_date is NOT decremented. This causes the ScheduleBooking.jsx calendar to show incorrect booking counts.

## Solution Overview
Update backend controllers to properly decrement booking counts when orders transition from any active status to any non-active status. Ensure real-time updates are sent to frontend via WebSocket.

## Tasks

### Backend Fixes
- [ ] Update `adminOrderController.js` - `updateOrder` function to decrement booking counts for all active->non-active status transitions
- [ ] Update `adminBookingController.js` - `updateBooking` function to decrement booking counts for all active->non-active status transitions
- [ ] Ensure booking counts cannot go negative using GREATEST(count - 1, 0)
- [ ] Delete booking_counts row when count reaches 0
- [ ] Emit real-time 'booking-counts-updated' events for frontend refresh

### Frontend Verification
- [ ] Verify ScheduleBooking.jsx properly listens to 'booking-counts-updated' socket events
- [ ] Confirm booking counts refresh immediately after status changes
- [ ] Test that calendar shows correct availability after order completion/cancellation

### Testing
- [ ] Test order status changes from various active states to non-active states
- [ ] Verify booking counts decrement correctly without double-counting
- [ ] Ensure no negative counts occur
- [ ] Confirm real-time updates work properly

## Active Statuses (count toward limit)
- pending
- pending_booking
- approved
- washing
- drying
- folding
- ready

## Non-Active Statuses (do not count toward limit)
- cancelled
- rejected
- completed
