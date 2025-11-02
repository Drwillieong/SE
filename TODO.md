# Timer Persistence Fix

## Tasks
- [x] Modify OrderManagement.jsx to fetch timer statuses from backend on mount
- [x] Update timer initialization to use backend data as primary source, localStorage as fallback
- [x] Ensure timer operations (start, toggle auto-advance) call backend APIs and update both localStorage and backend
- [x] Add API call to get timer status for all orders with active timers on component mount
- [x] Update localStorage when backend operations succeed to maintain sync
- [x] Fix timer start time to use backend's timer_start instead of Date.now() to prevent timer reset on page refresh
- [x] Fix TimerDisplay component to show timer even when not active (display remaining time correctly)

## Testing
- [ ] Test persistence across page refreshes
- [ ] Test persistence across logout/login cycles
- [ ] Verify timer display shows correct data from backend
- [ ] Ensure backend timer operations work correctly
