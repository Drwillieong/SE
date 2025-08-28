import express from 'express';
import jwt from 'jsonwebtoken';
import { signup, login, verifyEmail, resendVerification } from '../controllers/authController.js';
import passport from 'passport';

const router = express.Router();

// This function will be called from server.js to pass the db connection
export default (db) => {
    router.post('/signup', signup(db));
    router.post('/login', login(db));
    router.get('/verify-email', verifyEmail(db));
    router.post('/resend-verification', resendVerification(db));
    
    // Google OAuth routes
    router.get('/auth/google', (req, res, next) => {
        passport.authenticate('google', {
            scope: ['profile', 'email'],
            state: req.query.redirect || '/'
        })(req, res, next);
    });
    
    router.get('/auth/google/callback',
        passport.authenticate('google', { 
            failureRedirect: 'http://localhost:5173/login?error=auth_failed',
            session: false 
        }),
        (req, res) => {
            // Generate JWT token
            const token = jwt.sign(
                { 
                    id: req.user.id,
                    email: req.user.email,
                    firstName: req.user.firstName,
                    lastName: req.user.lastName,
                    role: req.user.role || 'user'
                },
                process.env.JWT_SECRET || 'your_jwt_secret',
                { expiresIn: '1h' }
            );
            
            // Redirect to frontend with token
            const redirectUrl = `http://localhost:5173/auth/success?token=${token}&userId=${req.user.id}`;
            res.redirect(redirectUrl);
        }
    );
    
    // Route to get current user info from JWT
    router.get('/auth/me', (req, res) => {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }
        
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
            res.json(decoded);
        } catch (error) {
            res.status(401).json({ message: 'Invalid token' });
        }
    });
    
    return router;
};
