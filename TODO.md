# TODO: Fix MySQL "Out of sort memory" Error

## Issue
- Error: "Out of sort memory, consider increasing server sort buffer size"
- Occurs in `getCustomerOrders` function in `backend/controllers/customerController.js`
- Query: `SELECT * FROM service_orders WHERE user_id = ? AND moved_to_history_at IS NULL AND is_deleted = FALSE ORDER BY created_at DESC LIMIT ? OFFSET ?`

## Root Cause
- The query requires sorting a large number of rows for a single user
- No composite index on (user_id, moved_to_history_at, is_deleted, created_at)
- MySQL falls back to filesort, which exceeds sort_buffer_size

## Solution
- Add composite index to optimize query performance
- Update schema.sql with the new index
- Run ALTER TABLE on production database

## Steps
- [x] Update `backend/database/schema.sql` to include composite index
- [x] Create `backend/add_index.sql` with ALTER TABLE command
- [ ] Run ALTER TABLE command on Aiven MySQL database
- [ ] Test the fix in production
