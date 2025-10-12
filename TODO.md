# TODO: Remove Laundry Item Fields (Pants, Shorts, T-Shirts, Bedsheets)

## Database Schema
- [ ] Remove `pants`, `shorts`, `tshirts`, `bedsheets` columns from orders table in `backend/database/schema.sql`

## Backend Controller
- [ ] Remove field handling in `backend/controllers/orderController.js` createOrderFromPickup function

## Frontend Components
- [ ] Remove form inputs from `client/src/features/admin/components/CheckOrderModal.jsx`
- [ ] Remove form inputs from `client/src/features/admin/components/EditOrder.jsx`
- [ ] Remove display from `client/src/features/admin/components/OrderDetailsModal.jsx`
- [ ] Remove display from `client/src/features/customer/components/OrderDetailsModal.jsx`
- [ ] Remove initialization from `client/src/features/admin/routes/dashboard/Booking.jsx`

## Followup Steps
- [ ] Database migration needed to drop these columns from existing tables
- [ ] Test application functionality after changes
