import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendVerificationEmail } from '../utils/email.js';

const salt = 10;

// Function to generate verification token
const generateVerificationToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

export const signup = (db) => (req, res) => {
    const verificationToken = generateVerificationToken();
    const sql = "INSERT INTO users (`firstName`, `lastName`, `contact`, `email`, `password`, `verificationToken`) VALUES (?)";
    
    bcrypt.hash(req.body.password.toString(), salt, (err, hash) => {
        if (err) {
            return res.json({ Error: "Error hashing password" });
        }
        const values = [
            req.body.firstName,
            req.body.lastName,
            req.body.contact,
            req.body.email,
            hash,
            verificationToken
        ];
        db.query(sql, [values], (err, data) => {
            if (err) {
                console.error('Error inserting user:', err);
                return res.json({ Error: "Error inserting user" });
            }
            
            // Send verification email
            sendVerificationEmail(req.body.email, verificationToken);
            
            return res.json({
                message: "User created successfully. Please check your email for verification instructions.",
                requiresVerification: true
            });
        });
    });
};

export const login = (db) => (req, res) => {
    console.log("Login request received:", req.body);
    const sql = "SELECT * FROM users WHERE email = ?";
    db.query(sql, [req.body.email], (err, data) => {
        if (err) return res.json({ Error: "Error fetching user" });
        console.log("Database response:", data);
        if (data.length > 0) {
            bcrypt.compare(req.body.password.toString(), data[0].password, (err, response) => {
                if (err) return res.json({ Error: "Error comparing passwords" });
                if (response) {
                    // Check if email is verified
                    if (!data[0].isVerified) {
                        return res.status(403).json({
                            message: "Email not verified. Please check your email for verification instructions.",
                            requiresVerification: true
                        });
                    }
                    
                    const user = {
                        id: data[0].id,
                        firstName: data[0].firstName,
                        lastName: data[0].lastName,
                        email: data[0].email,
                        contact: data[0].contact,
                        role: data[0].role || 'user'
                    };
                    const token = jwt.sign({ id: data[0].id }, 'your_jwt_secret', { expiresIn: '1h' });
                    console.log("Login successful, returning:", { message: "Login successful", token, user });
                    return res.status(200).json({ message: "Login successful", token, user });
                } else {
                    return res.status(400).json({ message: "Wrong email or password" });
                }
            });
        } else {
            return res.status(400).json({ message: "User not found" });
        }
    });
};

export const verifyEmail = (db) => (req, res) => {
    const { token } = req.query;
    
    if (!token) {
        return res.status(400).json({ message: "Verification token is required" });
    }
    
    const sql = "SELECT * FROM users WHERE verificationToken = ?";
    db.query(sql, [token], (err, data) => {
        if (err) {
            console.error('Error verifying email:', err);
            return res.status(500).json({ message: "Error verifying email" });
        }
        
        if (data.length === 0) {
            return res.status(400).json({ message: "Invalid verification token" });
        }
        
        const user = data[0];
        
        // Update user to mark as verified and clear verification token
        const updateSql = "UPDATE users SET isVerified = TRUE, verificationToken = NULL WHERE id = ?";
        db.query(updateSql, [user.id], (err) => {
            if (err) {
                console.error('Error updating user verification status:', err);
                return res.status(500).json({ message: "Error completing verification" });
            }
            
            console.log(`Email verified for user: ${user.email}`);
            res.send(`
                <html>
                    <head>
                        <title>Email Verified</title>
                        <style>
                            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                            .success { color: #28a745; font-size: 24px; }
                        </style>
                    </head>
                    <body>
                        <div class="success">✅ Email successfully verified!</div>
                        <p>Your email address has been verified. You can now log in to your account.</p>
                        <p><a href="/login">Go to Login</a></p>
                    </body>
                </html>
            `);
        });
    });
};

export const resendVerification = (db) => (req, res) => {
    const { email } = req.body;
    const verificationToken = generateVerificationToken();
    const sql = "UPDATE users SET verificationToken = ? WHERE email = ?";
    
    db.query(sql, [verificationToken, email], (err, result) => {
        if (err) {
            console.error('Error updating verification token:', err);
            return res.status(500).json({ message: "Error updating verification token" });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        
        // Send verification email
        sendVerificationEmail(email, verificationToken);
        
        return res.json({
            message: "Verification email resent. Please check your inbox."
        });
    });
};
