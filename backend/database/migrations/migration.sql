-- Database Migration Script
-- Add missing history tracking columns to orders and bookings tables

USE wash;

-- Add missing columns to orders table (one at a time)
ALTER TABLE orders
ADD COLUMN moved_to_history_at DATETIME NULL;

ALTER TABLE orders
ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;

ALTER TABLE orders
ADD COLUMN deleted_at DATETIME NULL;

ALTER TABLE orders
ADD COLUMN booking_id INT NULL;

-- Add missing columns to bookings table (one at a time)
ALTER TABLE bookings
ADD COLUMN moved_to_history_at DATETIME NULL;

ALTER TABLE bookings
ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;

ALTER TABLE bookings
ADD COLUMN deleted_at DATETIME NULL;

-- Add indexes for better performance
CREATE INDEX idx_orders_moved_to_history ON orders(moved_to_history_at);
CREATE INDEX idx_orders_is_deleted ON orders(is_deleted);
CREATE INDEX idx_bookings_moved_to_history ON bookings(moved_to_history_at);
CREATE INDEX idx_bookings_is_deleted ON bookings(is_deleted);

-- Verify the changes
DESCRIBE orders;
DESCRIBE bookings;
