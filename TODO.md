# TODO List

## Fix Customer Booking History Issues

### Backend Changes
- [x] Update `getCustomerOrders` in `customerController.js` to return properly formatted data for frontend compatibility
  - [x] Change `laundry_photos` to `laundryPhoto` (camelCase)
  - [x] Add `paymentStatus` and `paymentMethod` fields
  - [x] Add `serviceType` and `mainService` for compatibility
  - [x] Add `order_id` as alias for `service_orders_id`
  - [x] Add `loadCount` as alias for `load_count`
  - [x] Add other missing fields: `pickupDate`, `pickupTime`, `instructions`, `name`, `contact`, `email`, `address`, `rejectionReason`, `createdAt`, `updatedAt`
- [x] Update `getCustomerHistory` in `customerController.js` to include all history items and proper data formatting
  - [x] Include completed orders, moved to history, and soft deleted items
  - [x] Apply same data transformation as `getCustomerOrders` for consistency

### Frontend Verification
- [ ] Test that service information displays correctly in booking history list
- [ ] Test that OrderDetailsModal shows complete information including:
  - [ ] Service type/name
  - [ ] Laundry photos
  - [ ] Payment method
  - [ ] Payment status
  - [ ] All other order details

### Testing
- [ ] Verify customer can view their booking history
- [ ] Verify OrderDetailsModal opens and displays all information
- [ ] Check for any console errors or missing data
