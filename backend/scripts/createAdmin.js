import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const createAdmin = async () => {
    let connection;
    try {
        // Establish database connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            port: process.env.DB_PORT,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('Connected to MySQL database');

        // Admin user details from environment variables
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@123.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
        const saltRounds = 10;

        // Check if admin already exists
        const checkAdminSql = "SELECT user_id FROM users WHERE email = ?";
        const [results] = await connection.execute(checkAdminSql, [adminEmail]);

        if (results.length > 0) {
            console.log('Admin user already exists.');
            return;
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

        // Create admin user
        const insertAdminSql = `
            INSERT INTO users (firstName, lastName, contact, email, password, role, authProvider, isVerified)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            'Admin',
            'User',
            '09123456789',
            adminEmail,
            hashedPassword,
            'admin',
            'email',
            true // Automatically verify the admin user
        ];

        await connection.execute(insertAdminSql, values);

        console.log('Admin user created successfully!');
        console.log(`Email: ${adminEmail}`);
        console.log(`Password: ${adminPassword}`);

    } catch (error) {
        console.error('Failed to create admin user:', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Database connection closed.');
        }
    }
};

createAdmin();
