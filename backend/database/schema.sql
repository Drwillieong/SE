-- Database schema for laundry service admin dashboard
-- Run this script to create the necessary tables

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS wash;
USE wash;

-- Users table (assuming it already exists from auth system)
-- If not, uncomment the following lines:
 CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
   firstName VARCHAR(255) NOT NULL,
  lastName VARCHAR(255) NOT NULL,
   contact VARCHAR(20),
   email VARCHAR(255) UNIQUE NOT NULL,
   password VARCHAR(255) NOT NULL,
   barangay VARCHAR(255),
   street VARCHAR(255),
   blockLot VARCHAR(255),
  landmark VARCHAR(255),
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




-CREATE TABLE orders (
  order_id INT NOT NULL AUTO_INCREMENT,
  serviceType ENUM('washFold', 'dryCleaning', 'hangDry') NOT NULL,
  pickupDate DATE NOT NULL,
  pickupTime ENUM('7am-10am', '5pm-7pm') NOT NULL,
  loadCount INT NOT NULL DEFAULT 1,
  instructions TEXT DEFAULT NULL,
  status ENUM('pending', 'washing', 'drying', 'folding', 'ready', 'completed') DEFAULT 'pending',
  rejectionReason TEXT DEFAULT NULL,
  paymentMethod ENUM('cash', 'gcash', 'card') NOT NULL,
  name VARCHAR(255) NOT NULL,
  contact VARCHAR(20) NOT NULL,
  email VARCHAR(255) DEFAULT NULL,
  address TEXT NOT NULL,
  photos JSON DEFAULT NULL,
  totalPrice DECIMAL(10,2) NOT NULL,
  paymentStatus ENUM('unpaid', 'paid') DEFAULT 'unpaid',
  payment_proof VARCHAR(255) DEFAULT NULL,
  reference_id VARCHAR(255) DEFAULT NULL,
  payment_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  user_id INT DEFAULT NULL,
  estimatedClothes INT DEFAULT NULL,
  kilos DECIMAL(5,2) DEFAULT NULL,
  laundryPhoto JSON DEFAULT NULL,
  bookingId INT DEFAULT NULL,
  timer_start DATETIME DEFAULT NULL,
  timer_end DATETIME DEFAULT NULL,
  auto_advance_enabled TINYINT(1) DEFAULT 0,
  current_timer_status VARCHAR(20) DEFAULT NULL,
  moved_to_history_at DATETIME DEFAULT NULL,
  is_deleted TINYINT(1) DEFAULT 0,
  deleted_at DATETIME DEFAULT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (order_id),
  KEY idx_pickupDate (pickupDate),
  KEY idx_status (status),
  KEY idx_user_id (user_id),
  KEY idx_moved_to_history_at (moved_to_history_at),
  KEY idx_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;





-- Add index on pickupDate for bookings table
CREATE TABLE bookings (
  booking_id INT NOT NULL AUTO_INCREMENT,
  mainService ENUM('fullService', 'washDryFold') NOT NULL,
  dryCleaningServices JSON DEFAULT NULL,
  pickupDate DATE NOT NULL,
  pickupTime ENUM('7am-10am', '5pm-7pm') NOT NULL,
  loadCount INT NOT NULL DEFAULT 1,
  instructions TEXT DEFAULT NULL,
  status ENUM('pending', 'approved', 'rejected', 'completed', 'cancelled') DEFAULT 'pending',
  rejectionReason TEXT DEFAULT NULL,
  paymentMethod ENUM('cash', 'gcash', 'card') NOT NULL,
  name VARCHAR(255) NOT NULL,
  contact VARCHAR(20) NOT NULL,
  email VARCHAR(255) DEFAULT NULL,
  address TEXT NOT NULL,
  photos JSON DEFAULT NULL,
  totalPrice DECIMAL(10,2) NOT NULL,
  user_id INT DEFAULT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  serviceOption VARCHAR(50) DEFAULT NULL,
  deliveryFee DECIMAL(10,2) DEFAULT NULL,
  moved_to_history_at DATETIME DEFAULT NULL,
  is_deleted TINYINT(1) DEFAULT 0,
  deleted_at DATETIME DEFAULT NULL,
  PRIMARY KEY (booking_id),
  KEY idx_pickupDate (pickupDate),
  KEY idx_status (status),
  KEY idx_user_id (user_id),
  KEY idx_moved_to_history_at (moved_to_history_at),
  KEY idx_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
