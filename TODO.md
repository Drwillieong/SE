# Fix Orders Visibility After Refresh/Login

## Status: In Progress

### Issues Identified
- [x] Frontend incorrectly maps `order.id` instead of `order.service_orders_id` from backend
- [x] This breaks order identification and display after page refresh or login/logout

### Fixes Needed
- [ ] Update order transformation in `fetchOrdersAndCounts` useEffect
- [ ] Update order transformation in `confirmOrder` function
- [ ] Update order transformation in `handleCancel` function
- [ ] Test orders display after refresh and login/logout cycles
