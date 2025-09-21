import express from 'express';
import cors from 'cors';
import mysql from 'mysql';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import passport from 'passport';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import bookingRoutes from './routes/bookings.js';
import { initializeGoogleStrategy } from './config/googleOAuth.js';

// Load environment variables from .env file
dotenv.config();

console.log('Loaded env vars:', {
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL
});

const app = express();
app.use(express.json({ limit: '10mb' })); // Increase JSON payload limit
app.use(express.urlencoded({ limit: '10mb', extended: true })); // Increase URL-encoded payload limit
app.use(cors({
    origin: 'http://localhost:5173', // Your React app's URL
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight OPTIONS requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(204);
});

app.use(cookieParser());

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true in production with HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'admin123',
    database: 'wash'
});

// Test database connection
db.connect(async (err) => {
    if (err) {
        console.error('Database connection failed:', err.message);
        console.error('Please ensure:');
        console.error('1. MySQL server is running on localhost');
        console.error('2. Database "wash" exists');
        console.error('3. User "root" has password "admin123"');
        return;
    }
    console.log('Connected to MySQL database');
    
    // Initialize Google OAuth strategy
    initializeGoogleStrategy(db);
    
    // Check if users table exists, create it if not
    const checkTableSql = "SHOW TABLES LIKE 'users'";
    db.query(checkTableSql, (err, result) => {
        if (err) {
            console.error('Error checking users table:', err.message);
            return;
        }
        
        if (result.length === 0) {
            console.log('Users table not found, creating it...');
            const createTableSql = `
                CREATE TABLE users (
                    user_id INT AUTO_INCREMENT PRIMARY KEY,
                    firstName VARCHAR(255) NOT NULL,
                    lastName VARCHAR(255) NOT NULL,
                    contact VARCHAR(20),
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password VARCHAR(255),
                    barangay VARCHAR(255),
                    street VARCHAR(255),
                    blockLot VARCHAR(255),
                    landmark VARCHAR(255),
                    googleId VARCHAR(255) UNIQUE,
                    authProvider ENUM('email', 'google') DEFAULT 'email',
                    role ENUM('user', 'admin') DEFAULT 'user',
                    isVerified BOOLEAN DEFAULT FALSE,
                    verificationToken VARCHAR(255),
                    resetToken VARCHAR(255),
                    resetTokenExpiry DATETIME,
                    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            `;
            
            db.query(createTableSql, (err) => {
                if (err) {
                    console.error('Error creating users table:', err.message);
                } else {
                    console.log('Users table created successfully');
                }
            });
        } else {
            console.log('Users table exists');
            
            // Check if we need to update the table structure
            const checkColumnsSql = `
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'users' AND TABLE_SCHEMA = 'wash'
            `;
            
            db.query(checkColumnsSql, (err, columns) => {
                if (err) {
                    console.error('Error checking table columns:', err.message);
                    return;
                }
                
                const columnNames = columns.map(col => col.COLUMN_NAME);
                
                // Add googleId column if it doesn't exist
                if (!columnNames.includes('googleId')) {
                    console.log('Adding googleId column to users table...');
                    const addGoogleIdSql = "ALTER TABLE users ADD COLUMN googleId VARCHAR(255) UNIQUE";
                    db.query(addGoogleIdSql, (err) => {
                        if (err) {
                            console.error('Error adding googleId column:', err.message);
                        } else {
                            console.log('googleId column added successfully');
                        }
                    });
                }
                
                // Add authProvider column if it doesn't exist
                if (!columnNames.includes('authProvider')) {
                    console.log('Adding authProvider column to users table...');
                    const addAuthProviderSql = "ALTER TABLE users ADD COLUMN authProvider ENUM('email', 'google') DEFAULT 'email'";
                    db.query(addAuthProviderSql, (err) => {
                        if (err) {
                            console.error('Error adding authProvider column:', err.message);
                        } else {
                            console.log('authProvider column added successfully');
                        }
                    });
                }
                
                // Make contact and password columns nullable if they aren't already
                if (columnNames.includes('contact')) {
                    const makeContactNullableSql = "ALTER TABLE users MODIFY COLUMN contact VARCHAR(20) NULL";
                    db.query(makeContactNullableSql, (err) => {
                        if (err) {
                            console.error('Error making contact nullable:', err.message);
                        } else {
                            console.log('Contact column made nullable');
                        }
                    });
                }

                if (columnNames.includes('password')) {
                    const makePasswordNullableSql = "ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NULL";
                    db.query(makePasswordNullableSql, (err) => {
                        if (err) {
                            console.error('Error making password nullable:', err.message);
                        } else {
                            console.log('Password column made nullable');
                        }
                    });
                }

                // Add barangay column if it doesn't exist
                if (!columnNames.includes('barangay')) {
                    console.log('Adding barangay column to users table...');
                    const addBarangaySql = "ALTER TABLE users ADD COLUMN barangay VARCHAR(255) NULL";
                    db.query(addBarangaySql, (err) => {
                        if (err) {
                            console.error('Error adding barangay column:', err.message);
                        } else {
                            console.log('Barangay column added successfully');
                        }
                    });
                }

                // Add street column if it doesn't exist
                if (!columnNames.includes('street')) {
                    console.log('Adding street column to users table...');
                    const addStreetSql = "ALTER TABLE users ADD COLUMN street VARCHAR(255) NULL";
                    db.query(addStreetSql, (err) => {
                        if (err) {
                            console.error('Error adding street column:', err.message);
                        } else {
                            console.log('Street column added successfully');
                        }
                    });
                }

                // Add blockLot column if it doesn't exist
                if (!columnNames.includes('blockLot')) {
                    console.log('Adding blockLot column to users table...');
                    const addBlockLotSql = "ALTER TABLE users ADD COLUMN blockLot VARCHAR(255) NULL";
                    db.query(addBlockLotSql, (err) => {
                        if (err) {
                            console.error('Error adding blockLot column:', err.message);
                        } else {
                            console.log('BlockLot column added successfully');
                        }
                    });
                }

                // Add landmark column if it doesn't exist
                if (!columnNames.includes('landmark')) {
                    console.log('Adding landmark column to users table...');
                    const addLandmarkSql = "ALTER TABLE users ADD COLUMN landmark VARCHAR(255) NULL";
                    db.query(addLandmarkSql, (err) => {
                        if (err) {
                            console.error('Error adding landmark column:', err.message);
                        } else {
                            console.log('Landmark column added successfully');
                        }
                    });
                }
            });
        }
    });

    // Check if bookings table exists, create it if not
    const checkBookingsTableSql = "SHOW TABLES LIKE 'bookings'";
    db.query(checkBookingsTableSql, (err, result) => {
        if (err) {
            console.error('Error checking bookings table:', err.message);
            return;
        }

        if (result.length === 0) {
            console.log('Bookings table not found, creating it...');
            const createBookingsTableSql = `
                CREATE TABLE bookings (
                    booking_id INT AUTO_INCREMENT PRIMARY KEY,
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
                    photos JSON,
                    totalPrice DECIMAL(10, 2) NOT NULL,
                    user_id INT,
                    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_status (status),
                    INDEX idx_created_at (createdAt),
                    INDEX idx_user_id (user_id),
                    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
                )
            `;

            db.query(createBookingsTableSql, (err) => {
                if (err) {
                    console.error('Error creating bookings table:', err.message);
                } else {
                    console.log('Bookings table created successfully');
                }
            });
        } else {
            console.log('Bookings table exists');

            // Update existing users with role 'customer' to 'user'
            const updateCustomerRoleSql = "UPDATE users SET role = 'user' WHERE role = 'customer'";
            db.query(updateCustomerRoleSql, (err, result) => {
                if (err) {
                    console.error('Error updating customer roles:', err.message);
                } else if (result.affectedRows > 0) {
                    console.log(`Updated ${result.affectedRows} users from role 'customer' to 'user'`);
                } else {
                    console.log('No users with role \'customer\' found to update');
                }
            });
        }
    });
});

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log('verifyToken middleware called, authHeader:', authHeader);
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Access token required');
    return res.status(401).json({ message: 'Access token required' });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    console.log('Token decoded:', decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.log('Invalid token:', error.message);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Use auth routes
app.use('/auth', authRoutes(db));

// Use admin routes with JWT authentication
const adminRouter = express.Router();
adminRouter.use(verifyToken);
adminRouter.use((req, res, next) => {
  req.db = db;
  next();
});
adminRouter.use(adminRoutes);
app.use('/api/admin', adminRouter);

// Use booking routes with JWT authentication
const bookingRouter = express.Router();
bookingRouter.use(verifyToken);
bookingRouter.use(bookingRoutes(db));
app.use('/api/bookings', bookingRouter);

app.get('/', (req, res) => {
    res.send('Server is running!');
});

app.listen(8800, () => {
    console.log("Connected to backend!");
});
