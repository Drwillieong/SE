# Database Normalization Update - Auth Flow

## Backend Updates
- [ ] Fix route mismatch in NewAccountSetup.jsx - change `/api/customer/profile` to `/auth/users/profile`
- [ ] Verify User.js model methods work with normalized tables
- [ ] Verify authController.js signup/login work with normalized tables
- [ ] Verify auth.js routes work with normalized tables
- [ ] Test signup flow creates user in users and customer_profile in customers_profiles
- [ ] Test login flow retrieves data from joined tables
- [ ] Test profile update in NewAccountSetup

## Frontend Updates
- [ ] Update NewAccountSetup.jsx to use correct API endpoint
- [ ] Verify SignUpModal.jsx works with normalized data
- [ ] Verify Login.jsx works with normalized data
- [ ] Test complete signup -> new account setup -> login flow

## Testing
- [ ] Test signup creates user and profile correctly
- [ ] Test new account setup updates profile
- [ ] Test login retrieves complete user data
- [ ] Test profileComplete logic works correctly

# Payment Fields Normalization

## Schema Updates
- [x] Remove payment fields from service_orders table in schema.sql
- [x] Add drop column statements to migrate.js

## Model Updates
- [x] Update ServiceOrder.js to join with payments table for payment data
- [x] Update AdminBooking.js to join with payments table for payment data
- [x] Update Payment.js to handle all payment operations
- [x] Update AdminHistory.js to join with payments table for payment data
- [x] Update AdminAnalytics.js to join with payments table for payment data

## Controller Updates
- [ ] Update adminOrderController.js to use Payment model for payment operations
- [ ] Update customerController.js to use Payment model for payment operations
- [ ] Update adminBookingController.js to use Payment model for payment operations
- [ ] Update adminAnalyticsController.js to use Payment model for payment operations

## Testing
- [ ] Run migration to drop columns from database
- [ ] Test all payment-related functionality (booking, payment submission, approval, analytics)
