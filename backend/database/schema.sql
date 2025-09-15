-- Database schema for laundry service admin dashboard
-- Run this script to create the necessary tables

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS wash;
USE wash;

-- Users table (assuming it already exists from auth system)
-- If not, uncomment the following lines:
-- CREATE TABLE users (
--   id INT AUTO_INCREMENT PRIMARY KEY,
--   firstName VARCHAR(255) NOT NULL,
--   lastName VARCHAR(255) NOT NULL,
--   contact VARCHAR(20),
--   email VARCHAR(255) UNIQUE NOT NULL,
--   password VARCHAR(255) NOT NULL,
--   barangay VARCHAR(255),
--   street VARCHAR(255),
--   blockLot VARCHAR(255),
--   landmark VARCHAR(255),
--   role ENUM('user', 'admin') DEFAULT 'user',
--   authProvider ENUM('email', 'google') DEFAULT 'email',
--   isVerified BOOLEAN DEFAULT FALSE,
--   verificationToken VARCHAR(255),
--   resetToken VARCHAR(255),
--   resetTokenExpiry DATETIME,
--   createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
-- );

-- Orders table for customer orders
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  serviceType ENUM('washFold', 'dryCleaning', 'hangDry') NOT NULL,
  pickupDate DATE NOT NULL,
  pickupTime ENUM('7am-10am', '5pm-7pm') NOT NULL,
  loadCount INT NOT NULL DEFAULT 1,
  instructions TEXT,
  status ENUM('pending', 'approved', 'rejected', 'completed', 'cancelled') DEFAULT 'pending',
  rejectionReason TEXT,
  paymentMethod ENUM('cash', 'gcash', 'card') NOT NULL,
  name VARCHAR(255) NOT NULL,
  contact VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  address TEXT NOT NULL,
  photos JSON, -- Store photo URLs as JSON array
  totalPrice DECIMAL(10, 2) NOT NULL,
  userId INT, -- Reference to users table if order is from registered user
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_created_at (createdAt),
  INDEX idx_user_id (userId),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
);

-- Bookings table for admin-created bookings
CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  serviceType ENUM('washFold', 'dryCleaning', 'hangDry') NOT NULL,
  pickupDate DATE NOT NULL,
  pickupTime ENUM('7am-10am', '5pm-7pm') NOT NULL,
  loadCount INT NOT NULL DEFAULT 1,
  instructions TEXT,
  status ENUM('pending', 'approved', 'rejected', 'completed') DEFAULT 'pending',
  rejectionReason TEXT,
  paymentMethod ENUM('cash', 'gcash', 'card') NOT NULL,
  name VARCHAR(255) NOT NULL,
  contact VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  address TEXT NOT NULL,
  photos JSON, -- Store photo URLs as JSON array
  totalPrice DECIMAL(10, 2) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_created_at (createdAt)
);

