
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email.js';

const salt = 10;

// Function to generate verification token
const generateVerificationToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

export const signup = (db) => (req, res) => {
    // First, check if email already exists
    const checkEmailSql = "SELECT id, authProvider, isVerified FROM users WHERE email = ?";
    db.query(checkEmailSql, [req.body.email], (err, existingUsers) => {
        if (err) {
            console.error('Error checking existing email:', err);
            return res.status(500).json({ Error: "Server error checking email" });
        }

        if (existingUsers.length > 0) {
            const existingUser = existingUsers[0];
            console.log('Email already exists:', req.body.email, 'Auth provider:', existingUser.authProvider);

            // If user signed up with Google OAuth, suggest using Google login
            if (existingUser.authProvider === 'google') {
                return res.status(409).json({
                    Error: "This email is already registered with Google. Please use 'Continue with Google' to sign in.",
                    authProvider: 'google'
                });
            }

            // If user signed up with email but hasn't verified, suggest resending verification
            if (!existingUser.isVerified) {
                return res.status(409).json({
                    Error: "This email is already registered but not verified. Please check your email for verification instructions or request a new verification email.",
                    requiresVerification: true
                });
            }

            // Email exists and is verified
            return res.status(409).json({
                Error: "This email is already registered. Please try logging in instead."
            });
        }

        // Email doesn't exist, proceed with signup
        const verificationToken = generateVerificationToken();
        const sql = "INSERT INTO users (`firstName`, `lastName`, `contact`, `email`, `password`, `barangay`, `street`, `blockLot`, `landmark`, `verificationToken`, `authProvider`) VALUES (?)";

        bcrypt.hash(req.body.password.toString(), salt, (err, hash) => {
            if (err) {
                console.error('Error hashing password:', err);
                return res.status(500).json({ Error: "Error processing password" });
            }

            const values = [
                req.body.firstName,
                req.body.lastName,
                req.body.contact,
                req.body.email,
                hash,
                null, // barangay
                null, // street
                null, // blockLot
                null, // landmark
                verificationToken,
                'email' // authProvider
            ];

            db.query(sql, [values], (err, data) => {
                if (err) {
                    console.error('Error inserting user:', err);
                    // Handle specific MySQL errors
                    if (err.code === 'ER_DUP_ENTRY') {
                        return res.status(409).json({ Error: "This email is already registered. Please try logging in instead." });
                    }
                    return res.status(500).json({ Error: "Error creating account" });
                }

                // Generate JWT token for the new user
                const user = {
                    id: data.insertId,
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    email: req.body.email,
                    role: 'user'
                };
                const token = jwt.sign(user, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' });

                console.log('User created successfully:', req.body.email);
                return res.status(201).json({
                    message: "User created successfully. Please complete your account setup.",
                    token: token,
                    requiresVerification: false // Since we're not sending verification email
                });
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
                    // Email verification is no longer mandatory for login
                    const user = {
                        id: data[0].id,
                        firstName: data[0].firstName,
                        lastName: data[0].lastName,
                        email: data[0].email,
                        contact: data[0].contact,
                        role: data[0].role || 'customer'
                    };
                    const token = jwt.sign({
                        id: data[0].id,
                        email: data[0].email,
                        firstName: data[0].firstName,
                        lastName: data[0].lastName,
                        role: data[0].role || 'customer'
                    }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' });
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
        sendVerificationEmail(email, verificationToken)
            .then(() => {
                return res.json({
                    message: "Verification email resent. Please check your inbox."
                });
            })
            .catch(error => {
                console.error('Failed to resend verification email:', error.message);
                return res.status(500).json({
                    message: "Failed to resend verification email. Please try again later."
                });
            });
    });
};

// Forgot password controller
export const forgotPassword = (db) => (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }

    const resetToken = generateVerificationToken();
    const updateSql = "UPDATE users SET resetToken = ?, resetTokenExpiry = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE email = ?";

    db.query(updateSql, [resetToken, email], (err, result) => {
        if (err) {
            console.error('Error updating reset token:', err);
            return res.status(500).json({ message: "Server error" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        sendPasswordResetEmail(email, resetToken)
            .then(() => {
                res.json({ message: "Password reset email sent. Please check your inbox." });
            })
            .catch(error => {
                console.error('Error sending password reset email:', error);
                res.status(500).json({ message: "Failed to send password reset email" });
            });
    });
};

// Reset password controller
export const resetPassword = (db) => (req, res) => {
    const { token, password } = req.body;

    if (!token || !password) {
        return res.status(400).json({ message: "Token and password are required" });
    }

    if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters long" });
    }

    // First, find the user with the reset token
    const findUserSql = "SELECT id, email FROM users WHERE resetToken = ? AND resetTokenExpiry > NOW()";

    db.query(findUserSql, [token], (err, data) => {
        if (err) {
            console.error('Error finding user with reset token:', err);
            return res.status(500).json({ message: "Server error" });
        }

        if (data.length === 0) {
            return res.status(400).json({ message: "Invalid or expired reset token" });
        }

        const user = data[0];

        // Hash the new password
        bcrypt.hash(password.toString(), salt, (err, hash) => {
            if (err) {
                console.error('Error hashing password:', err);
                return res.status(500).json({ message: "Error processing password" });
            }

            // Update the user's password and clear the reset token
            const updateSql = "UPDATE users SET password = ?, resetToken = NULL, resetTokenExpiry = NULL WHERE id = ?";

            db.query(updateSql, [hash, user.id], (err, result) => {
                if (err) {
                    console.error('Error updating password:', err);
                    return res.status(500).json({ message: "Server error" });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({ message: "User not found" });
                }

                console.log(`Password reset successful for user: ${user.email}`);
                res.json({ message: "Password reset successfully. You can now log in with your new password." });
            });
        });
    });
};

// Change password controller for logged-in users
export const changePassword = (db) => (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({ message: "New password must be at least 8 characters long" });
    }

    // First, get the current user
    const getUserSql = "SELECT password FROM users WHERE id = ?";
    db.query(getUserSql, [userId], (err, data) => {
        if (err) {
            console.error('Error fetching user:', err);
            return res.status(500).json({ message: "Server error" });
        }

        if (data.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const user = data[0];

        // Check if current password is correct
        bcrypt.compare(currentPassword.toString(), user.password, (err, isMatch) => {
            if (err) {
                console.error('Error comparing passwords:', err);
                return res.status(500).json({ message: "Server error" });
            }

            if (!isMatch) {
                return res.status(400).json({ message: "Current password is incorrect" });
            }

            // Hash the new password
            bcrypt.hash(newPassword.toString(), salt, (err, hash) => {
                if (err) {
                    console.error('Error hashing new password:', err);
                    return res.status(500).json({ message: "Error processing password" });
                }

                // Update the user's password
                const updateSql = "UPDATE users SET password = ? WHERE id = ?";
                db.query(updateSql, [hash, userId], (err, result) => {
                    if (err) {
                        console.error('Error updating password:', err);
                        return res.status(500).json({ message: "Server error" });
                    }

                    if (result.affectedRows === 0) {
                        return res.status(404).json({ message: "User not found" });
                    }

                    console.log(`Password changed successfully for user ID: ${userId}`);
                    res.json({ message: "Password changed successfully" });
                });
            });
        });
    });
};
