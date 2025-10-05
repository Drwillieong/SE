import mysql from 'mysql';
import bcrypt from 'bcrypt';

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'admin123',
    database: 'wash'
});

const salt = 10;

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err.message);
        return;
    }
    console.log('Connected to MySQL database');

    // Create admin user
    const adminEmail = 'admin@123.com';
    const adminPassword = 'admin123';

    // Check if admin already exists
    const checkAdminSql = "SELECT user_id FROM users WHERE email = ?";
    db.query(checkAdminSql, [adminEmail], (err, results) => {
        if (err) {
            console.error('Error checking admin user:', err);
            return;
        }

        if (results.length > 0) {
            console.log('Admin user already exists');
            db.end();
            return;
        }

        // Create admin user
        bcrypt.hash(adminPassword, salt, (err, hash) => {
            if (err) {
                console.error('Error hashing password:', err);
                return;
            }

            const insertAdminSql = `
                INSERT INTO users (firstName, lastName, contact, email, password, role, authProvider, isVerified)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const values = [
                'Admin',
                'User',
                '09123456789',
                adminEmail,
                hash,
                'admin',
                'email',
                true
            ];

            db.query(insertAdminSql, values, (err, result) => {
                if (err) {
                    console.error('Error creating admin user:', err);
                } else {
                    console.log('Admin user created successfully');
                    console.log('Email: admin@washit.com');
                    console.log('Password: admin123');
                }
                db.end();
            });
        });
    });
});
