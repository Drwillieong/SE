# Order Management Timer Feature Implementation

## Overview:
Add a comprehensive timer system to the admin order management with:
- 1-hour timers for each order status
- Visual timer display
- Clickable status icons to change progress
- Auto-advance functionality
- Clickable order numbers instead of "View Details" button

## Plan Implementation Steps:

### Database Schema Updates:
1. **Update `backend/database/schema.sql`**
   - Add `timer_start` DATETIME field to orders table
   - Add `timer_end` DATETIME field to orders table
   - Add `auto_advance_enabled` BOOLEAN field to orders table
   - Add `current_timer_status` VARCHAR field to track which status is being timed

### Backend Changes:
2. **Update `backend/models/Order.js`**
   - Add methods for timer management (startTimer, stopTimer, getTimerStatus)
   - Add methods for auto-advance functionality
   - Add method to calculate remaining time

3. **Update `backend/controllers/orderController.js`**
   - Add `/api/admin/orders/:id/timer/start` endpoint
   - Add `/api/admin/orders/:id/timer/stop` endpoint
   - Add `/api/admin/orders/:id/auto-advance/toggle` endpoint
   - Add `/api/admin/orders/:id/status/next` endpoint
   - Update existing endpoints to handle timer fields

### Frontend Changes:
4. **Update `client/src/Dash/routes/dashboard/OrderManagement.jsx`**
   - Add timer display component showing remaining time
   - Make status icons clickable to change status
   - Remove "View Details" button from actions
   - Make order numbers clickable to show order details
   - Add auto-advance toggle button
   - Add timer progress bar visualization
   - Add real-time timer updates using useEffect

5. **Create Timer Components**
   - Create `TimerDisplay.jsx` component for showing countdown
   - Create `TimerProgressBar.jsx` component for visual progress
   - Create `StatusIcon.jsx` component for clickable status icons

### Features to Implement:
6. **Timer System:**
   - Each status (washing, drying, folding) gets 1 hour timer
   - Visual countdown display (MM:SS format)
   - Progress bar showing completion percentage
   - Auto-refresh timer every second

7. **Status Management:**
   - Click status icon to manually advance to next status
   - Visual feedback for clickable elements
   - Confirmation dialog for status changes

8. **Auto-Advance System:**
   - Toggle button to enable/disable auto-advance
   - Automatic progression through statuses when timer expires
   - Visual indicator when auto-advance is active

9. **UI/UX Improvements:**
   - Order number becomes clickable link
   - Order details modal opens when clicking order number
   - Remove redundant "View Details" button
   - Better visual hierarchy for timer information

## Progress Tracking:
- [ ] Update database schema with timer fields
- [ ] Add timer methods to Order model
- [ ] Add timer endpoints to orderController
- [ ] Create timer display components
- [ ] Update OrderManagement.jsx with timer features
- [ ] Implement clickable status icons
- [ ] Implement auto-advance functionality
- [ ] Make order numbers clickable
- [ ] Remove "View Details" button
- [ ] Test complete timer system
- [ ] Test auto-advance functionality
- [ ] Test manual status progression

## Technical Notes:
- Timer duration: 1 hour (3600000 milliseconds) per status
- Status progression: pending → washing → drying → folding → ready → completed
- Timer storage: Store start/end times in database for persistence
- Real-time updates: Use setInterval for live timer updates
- Auto-advance: Background process to check and advance expired timers
