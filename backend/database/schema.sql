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

-- Orders table for customer orders
Field
Type
Null
Key
Default
Extra
order_id
int
NO
PRI
NULL
auto_increment
serviceType
enum('washFold','dryCleaning','hangDry')
NO
NULL
pickupDate
date
NO
MUL
NULL
pickupTime
enum('7am-10am','5pm-7pm')
NO
NULL
loadCount
int
NO
1
instructions
text
YES
NULL
status
enum('pending','washing','drying','folding','ready','completed')
YES
MUL
pending
rejectionReason
text
YES
NULL
paymentMethod
enum('cash','gcash','card')
NO
NULL
name
varchar(255)
NO
NULL
contact
varchar(20)
NO
NULL
email
varchar(255)
YES
NULL
address
text
NO
NULL
photos
json
YES
NULL
totalPrice
decimal(10,2)
NO
NULL
paymentStatus
enum('unpaid','paid')
YES
unpaid
payment_proof
varchar(255)
YES
NULL
reference_id
varchar(255)
YES
NULL
payment_status
enum('pending','approved','rejected')
YES
pending
user_id
int
YES
MUL
NULL
estimatedClothes
int
YES
NULL
kilos
decimal(5,2)
YES
NULL
laundryPhoto
json
YES
NULL
bookingId
int
YES
NULL
timer_start
datetime
YES
NULL
timer_end
datetime
YES
NULL
auto_advance_enabled
tinyint(1)
YES
0
current_timer_status
varchar(20)
YES
NULL
moved_to_history_at
datetime
YES
MUL
NULL
is_deleted
tinyint(1)
YES
MUL
0
deleted_at
datetime
YES
NULL
createdAt
timestamp
YES
MUL
CURRENT_TIMESTAMP
DEFAULT_GENERATED
updatedAt
timestamp
YES
CURRENT_TIMESTAMP
DEFAULT_GENERATED on update CURRENT_TIMESTAMP




-- Add index on pickupDate for bookings table
ALTER TABLE bookings ADD INDEX idx_pickup_date (pickupDate);


Field
Type
Null
Key
Default
Extra
booking_id
int
NO
PRI
NULL
auto_increment
mainService
enum('fullService','washDryFold')
NO
NULL
dryCleaningServices
json
YES
NULL
pickupDate
date
NO
MUL
NULL
pickupTime
enum('7am-10am','5pm-7pm')
NO
NULL
loadCount
int
NO
1
instructions
text
YES
NULL
status
enum('pending','approved','rejected','cancelled')
YES
MUL
pending
rejectionReason
text
YES
NULL
paymentMethod
enum('cash','gcash','card')
NO
NULL
name
varchar(255)
NO
NULL
contact
varchar(20)
NO
NULL
email
varchar(255)
YES
NULL
address
text
NO
NULL
photos
json
YES
NULL
totalPrice
decimal(10,2)
NO
NULL
user_id
int
YES
MUL
NULL
createdAt
timestamp
YES
MUL
CURRENT_TIMESTAMP
DEFAULT_GENERATED
updatedAt
timestamp
YES
CURRENT_TIMESTAMP
DEFAULT_GENERATED on update CURRENT_TIMESTAMP
serviceOption
varchar(50)
YES
NULL
deliveryFee
decimal(10,2)
YES
NULL
moved_to_history_at
datetime
YES
MUL
NULL
is_deleted
tinyint(1)
YES
MUL
0
deleted_at
datetime
YES
NULL