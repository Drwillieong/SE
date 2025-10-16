import express from 'express';
import jwt from 'jsonwebtoken';
import { signup, login, verifyEmail, resendVerification, forgotPassword, resetPassword, changePassword } from './controllers/authController.js';
import passport from 'passport';
import { verifyToken } from './middleware/authMiddleware.js';

const router = express.Router();

// This function will be called from server.js to pass the db connection
export default (db) => {
    router.post('/signup', signup(db));
    router.post('/login', login(db));
    router.get('/verify-email', verifyEmail(db));
    router.post('/resend-verification', resendVerification(db));
    router.post('/forgot-password', forgotPassword(db));
    router.post('/reset-password', resetPassword(db));
    
    // Google OAuth routes
    router.get('/google', (req, res, next) => {
        passport.authenticate('google', {
            scope: ['profile', 'email'],
            state: req.query.redirect || '/'
        })(req, res, next);
    });
    
    router.get('/google/callback',
        passport.authenticate('google', {
            failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=auth_failed`,
            session: false
        }),
        (req, res) => {
            console.log('Google OAuth callback reached');
            console.log('User from Google:', req.user);
            console.log('User ID:', req.user.user_id);
            console.log('User email:', req.user.email);

            // Check if user profile is complete
            const checkProfileSql = "SELECT user_id, barangay, street, firstName, lastName, role FROM users WHERE user_id = ?";
            console.log('Checking profile for user ID:', req.user.user_id);
            db.query(checkProfileSql, [req.user.user_id], (err, profileResult) => {
                if (err) {
                    console.error('Error checking user profile:', err);
                    // On error, redirect to new account setup
                    const token = jwt.sign(
                        {
                    user_id: req.user.user_id,
                    email: req.user.email,
                    firstName: req.user.firstName,
                    lastName: req.user.lastName,
                    role: req.user.role || 'user'
                        },
                        process.env.JWT_SECRET || 'your_jwt_secret',
                        { expiresIn: '1h' }
                    );
                    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/newaccountsetup?token=${token}`;
                    console.log('Error checking profile, redirecting to setup:', redirectUrl);
                    return res.redirect(redirectUrl);
                }

                console.log('Profile query result:', profileResult);
                console.log('Profile result length:', profileResult.length);

                if (profileResult.length === 0) {
                    console.log('No profile found for user, redirecting to setup');
                    const token = jwt.sign(
                        {
                    user_id: req.user.user_id,
                    email: req.user.email,
                    firstName: req.user.firstName,
                    lastName: req.user.lastName,
                    role: req.user.role || 'user'
                        },
                        process.env.JWT_SECRET || 'your_jwt_secret',
                        { expiresIn: '1h' }
                    );
                    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/newaccountsetup?token=${token}`;
                    console.log('No profile found, redirecting to setup:', redirectUrl);
                    return res.redirect(redirectUrl);
                }

                const userProfile = profileResult[0];
                console.log('User profile data:', {
                    user_id: userProfile.user_id,
                    barangay: userProfile.barangay,
                    street: userProfile.street,
                    firstName: userProfile.firstName,
                    lastName: userProfile.lastName,
                    role: userProfile.role
                });

                const profileComplete = !!(userProfile.barangay && userProfile.street);
                const userRole = userProfile.role || 'customer';
                console.log('Profile complete check result:', profileComplete);
                console.log('Barangay value:', userProfile.barangay, 'Street value:', userProfile.street);
                console.log('User role:', userRole);

                // Generate JWT token
                const token = jwt.sign(
                    {
                        user_id: req.user.user_id,
                        email: req.user.email,
                        firstName: req.user.firstName,
                        lastName: req.user.lastName,
                        role: userRole
                    },
                    process.env.JWT_SECRET || 'your_jwt_secret',
                    { expiresIn: '1h' }
                );

                console.log('Generated JWT token for user:', req.user.email);

                let redirectUrl;
                if (profileComplete) {
                    // User profile is complete, redirect to appropriate dashboard
                    const dashboardPath = userRole === 'admin' ? '/dashboard' : '/customer-dashboard';
                    redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}${dashboardPath}?token=${token}`;
                    console.log('Profile complete, redirecting to dashboard:', redirectUrl);
                } else {
                    // User profile is incomplete, redirect to new account setup
                    redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/newaccountsetup?token=${token}`;
                    console.log('Profile incomplete, redirecting to setup:', redirectUrl);
                }

                // Set a cookie with the token for subsequent login sessions
                res.cookie('token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    maxAge: 3600000 // 1 hour
                });

                console.log('Final redirect URL:', redirectUrl);
                res.redirect(redirectUrl);
            });
        }
    );
    
    // Route to get current user info from JWT
    router.get('/me', (req, res) => {
        console.log('Auth /me - Request headers:', req.headers);
        const token = req.headers.authorization?.split(' ')[1];
        console.log('Auth /me - Token extracted:', token ? 'Token present' : 'No token');

        if (!token) {
            console.log('Auth /me - No token provided');
            return res.status(401).json({ message: 'No token provided' });
        }

        try {
            console.log('Auth /me - Verifying token...');
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
            console.log('Auth /me - Token decoded successfully:', decoded);

            // Get user data from database to check if profile is complete
            const userId = decoded.user_id;
            console.log('Auth /me - Fetching user data for ID:', userId);
            const selectQuery = 'SELECT * FROM users WHERE user_id = ?';
            db.query(selectQuery, [userId], (err, rows) => {
                if (err) {
                    console.error('Auth /me - Error fetching user:', err);
                    return res.status(500).json({ message: 'Server error' });
                }

                if (rows.length === 0) {
                    console.log('Auth /me - User not found for ID:', userId);
                    return res.status(404).json({ message: 'User not found' });
                }

                const user = rows[0];

                // Log user data for debugging
                console.log('Auth /me - User data from DB:', {
                    user_id: user.user_id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    contact: user.contact,
                    barangay: user.barangay,
                    street: user.street,
                    blockLot: user.blockLot,
                    landmark: user.landmark
                });

                // Check if profile is complete (has barangay and street)
                const profileComplete = !!(user.barangay && user.street);
                console.log('Auth /me - Profile complete calculation:', {
                    barangay: user.barangay,
                    street: user.street,
                    profileComplete
                });

                // Return user data with profileComplete flag
                res.json({
                    ...decoded,
                    profileComplete,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    contact: user.contact,
                    barangay: user.barangay,
                    street: user.street,
                    blockLot: user.blockLot,
                    landmark: user.landmark
                });
            });
        } catch (error) {
            console.error('Auth /me - Token verification error:', error.message);
            console.error('Auth /me - Token verification error details:', error);
            res.status(401).json({ message: 'Invalid token' });
        }
    });

    // Route to update user profile
    router.put('/users/profile', (req, res) => {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
            const userId = decoded.user_id;

            const { firstName, lastName, contact, email, barangay, street, blockLot, landmark } = req.body;

            // Update user in database
            const updateQuery = `
                UPDATE users
                SET firstName = ?, lastName = ?, contact = ?, email = ?, barangay = ?, street = ?, blockLot = ?, landmark = ?
                WHERE user_id = ?
            `;

            db.query(updateQuery, [firstName, lastName, contact, email, barangay, street, blockLot, landmark, userId], (err, result) => {
                if (err) {
                    console.error('Error updating profile:', err);
                    return res.status(500).json({ success: false, message: 'Server error' });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({ success: false, message: 'User not found' });
                }

                // Get updated user data
                const selectQuery = 'SELECT * FROM users WHERE user_id = ?';
                db.query(selectQuery, [userId], (err, rows) => {
                    if (err) {
                        console.error('Error fetching updated user:', err);
                        return res.status(500).json({ success: false, message: 'Server error' });
                    }

                    const user = rows[0];
                    res.json({ success: true, user });
                });
            });
        } catch (error) {
            console.error('Token verification error:', error);
            res.status(401).json({ success: false, message: 'Invalid token' });
        }
    });

    // Route to change password
    router.post('/change-password', verifyToken, changePassword(db));

    // Route to refresh token
    router.post('/refresh', (req, res) => {
        const { token } = req.body;

        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        try {
            // Verify the current token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', { ignoreExpiration: true });

            // Check if user still exists in database
            const selectQuery = 'SELECT * FROM users WHERE user_id = ?';
            db.query(selectQuery, [decoded.user_id], (err, rows) => {
                if (err) {
                    console.error('Error fetching user for refresh:', err);
                    return res.status(500).json({ message: 'Server error' });
                }

                if (rows.length === 0) {
                    return res.status(404).json({ message: 'User not found' });
                }

                const user = rows[0];

                // Generate new token
                const newToken = jwt.sign(
                    {
                        user_id: user.user_id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        role: user.role || 'user'
                    },
                    process.env.JWT_SECRET || 'your_jwt_secret',
                    { expiresIn: '1h' }
                );

                res.json({
                    token: newToken,
                    user: {
                        user_id: user.user_id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        role: user.role || 'user'
                    }
                });
            });
        } catch (error) {
            console.error('Token refresh error:', error.message);
            res.status(401).json({ message: 'Invalid token' });
        }
    });

    return router;
};
