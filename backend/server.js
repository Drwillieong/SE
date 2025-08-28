import express from 'express';
import cors from 'cors'; 
import mysql from 'mysql';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import passport from 'passport';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import { initializeGoogleStrategy } from './config/googleOAuth.js';

// Load environment variables from .env file
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:5173', // Your React app's URL
    credentials: true
}));
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
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    firstName VARCHAR(255) NOT NULL,
                    lastName VARCHAR(255) NOT NULL,
                    contact VARCHAR(20),
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password VARCHAR(255),
                    googleId VARCHAR(255) UNIQUE,
                    authProvider ENUM('email', 'google') DEFAULT 'email',
                    role ENUM('customer', 'admin') DEFAULT 'customer',
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
            });
        }
    });
});

// Use auth routes
app.use('/', authRoutes(db));

app.get('/', (req, res) => {
    res.send('Server is running!');
});

app.listen(8800, () => {
    console.log("Connected to backend!");
});
