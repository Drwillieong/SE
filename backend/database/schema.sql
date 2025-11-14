-- Database schema for laundry service admin dashboard
-- Run this script to create the necessary tables

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS wash;
USE wash;

-- Normalized users table for core authentication (applies to both customers and admins)
CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  authProvider ENUM('email', 'google') DEFAULT 'email',
  isVerified BOOLEAN DEFAULT FALSE,
  verificationToken VARCHAR(255),
  resetToken VARCHAR(255),
  loginAttempts INT DEFAULT 0,
  lockoutUntil DATETIME NULL,
  resetTokenExpiry DATETIME,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Customers table (centralized for all customers, registered or guest)
CREATE TABLE customers_profiles (
  customer_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT DEFAULT NULL,  -- NULL for guests
  firstName VARCHAR(255),
  lastName VARCHAR(255),
  name VARCHAR(255) NOT NULL,  -- Full name for guests or computed for registered
  contact VARCHAR(20) NOT NULL,
  email VARCHAR(255) DEFAULT NULL,
  address TEXT NOT NULL,
  barangay VARCHAR(255),
  street VARCHAR(255),
  blockLot VARCHAR(255),
  landmark TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  UNIQUE KEY unique_user_customer (user_id)  -- One customer per user
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Booking counts table for tracking daily booking limits
CREATE TABLE booking_counts (
  id INT NOT NULL AUTO_INCREMENT,
  date DATE NOT NULL UNIQUE,
  count INT NOT NULL DEFAULT 0,
  limit_count INT NOT NULL DEFAULT 3,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY unique_date (date),
  KEY idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Payments table
CREATE TABLE payments (
  payment_id INT AUTO_INCREMENT PRIMARY KEY,
  service_orders_id INT NOT NULL,
  payment_method ENUM('cash', 'gcash') NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  payment_status ENUM('unpaid', 'paid') DEFAULT 'unpaid',
  payment_proof VARCHAR(255) DEFAULT NULL,
  reference_id VARCHAR(255) DEFAULT NULL,
  payment_review_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (service_orders_id) REFERENCES service_orders(service_orders_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Normalized service_orders table
CREATE TABLE service_orders (
  service_orders_id INT NOT NULL AUTO_INCREMENT,

  -- Customer reference
  customer_id INT NULL,

  -- Service details (flexible for booking and order phases)
  service_type ENUM('fullService', 'washDryFold', 'washFold', 'dryCleaning', 'hangDry') NOT NULL,
  dry_cleaning_services JSON DEFAULT NULL,  -- For bookings with dry cleaning options
  pickup_date DATE NOT NULL,
  pickup_time ENUM('7am-10am', '5pm-7pm') NOT NULL,
  load_count INT NOT NULL DEFAULT 1,
  instructions TEXT DEFAULT NULL,



  -- Processing details (populated during order phase)
  kilos DECIMAL(5,2) DEFAULT NULL,
  laundry_photos JSON DEFAULT NULL,  -- Photos of processed laundry

  -- Status progression (combined and expanded)
  status ENUM('pending', 'pending_booking', 'approved', 'rejected', 'cancelled', 'washing', 'drying', 'folding', 'ready', 'completed') DEFAULT 'pending',
  rejection_reason TEXT DEFAULT NULL,

  -- Service options
  service_option ENUM('pickupOnly', 'pickupAndDelivery') DEFAULT 'pickupAndDelivery',
  delivery_fee DECIMAL(10,2) DEFAULT 0,

  -- Pricing
  total_price DECIMAL(10,2) DEFAULT 0,

  -- Soft delete and history management
  is_deleted TINYINT(1) DEFAULT 0,
  deleted_at DATETIME DEFAULT NULL,
  moved_to_history_at DATETIME DEFAULT NULL,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Primary key
  PRIMARY KEY (service_orders_id),

  -- Foreign key
  FOREIGN KEY (customer_id) REFERENCES customers_profiles(customer_id) ON DELETE CASCADE,

  -- Indexes for performance
  KEY idx_pickup_date (pickup_date),
  KEY idx_status (status),
  KEY idx_customer_id (customer_id),
  KEY idx_moved_to_history_at (moved_to_history_at),
  KEY idx_is_deleted (is_deleted),
  KEY idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Order timers table (separated for modularity and to reduce NULLs in service_orders)
CREATE TABLE order_timers (
  timer_id INT AUTO_INCREMENT PRIMARY KEY,
  service_orders_id INT NOT NULL,
  timer_start DATETIME DEFAULT NULL,
  timer_end DATETIME DEFAULT NULL,
  auto_advance_enabled TINYINT(1) DEFAULT 0,
  current_timer_status VARCHAR(20) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (service_orders_id) REFERENCES service_orders(service_orders_id) ON DELETE CASCADE,
  KEY idx_service_orders_id (service_orders_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
