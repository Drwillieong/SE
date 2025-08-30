import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import jwt from 'jsonwebtoken';

// Google OAuth configuration
const googleConfig = {
  clientID: process.env.GOOGLE_CLIENT_ID || 'your-google-client-id',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'your-google-client-secret',
  callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:8800/auth/google/callback'
};

// Initialize Google Strategy
export const initializeGoogleStrategy = (db) => {
  passport.use(new GoogleStrategy(googleConfig, 
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('Google profile received:', profile);
        
        // Check if user already exists with this Google ID
        const checkUserSql = "SELECT * FROM users WHERE googleId = ? OR email = ?";
        db.query(checkUserSql, [profile.id, profile.emails[0].value], (err, results) => {
          if (err) {
            console.error('Database error checking user:', err);
            return done(err);
          }
          
          if (results.length > 0) {
            // User exists, update Google ID if not set
            const user = results[0];
            if (!user.googleId) {
              const updateSql = "UPDATE users SET googleId = ? WHERE id = ?";
              db.query(updateSql, [profile.id, user.id], (updateErr) => {
                if (updateErr) {
                  console.error('Error updating Google ID:', updateErr);
                  return done(updateErr);
                }
                return done(null, user);
              });
            } else {
              return done(null, user);
            }
          } else {
            // Create new user with Google OAuth
            const newUser = {
              firstName: profile.name.givenName,
              lastName: profile.name.familyName,
              email: profile.emails[0].value,
              googleId: profile.id,
              isVerified: true, // Google emails are verified
              authProvider: 'google'
            };
            
            const insertSql = "INSERT INTO users (firstName, lastName, email, googleId, isVerified, authProvider) VALUES (?, ?, ?, ?, ?, ?)";
            db.query(insertSql, [
              newUser.firstName,
              newUser.lastName,
              newUser.email,
              newUser.googleId,
              newUser.isVerified,
              newUser.authProvider
            ], (insertErr, result) => {
              if (insertErr) {
                console.error('Error creating Google user:', insertErr);
                return done(insertErr);
              }
              
              newUser.id = result.insertId;
              return done(null, newUser);
            });
          }
        });
      } catch (error) {
        console.error('Error in Google strategy:', error);
        return done(error);
      }
    }
  ));

  // Serialize user for session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser((id, done) => {
    const sql = "SELECT * FROM users WHERE id = ?";
    db.query(sql, [id], (err, results) => {
      if (err) return done(err);
      done(null, results[0]);
    });
  });
};

// Generate JWT token for Google authenticated user
export const generateGoogleAuthToken = (user) => {
  const tokenPayload = {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role || 'user',
    authProvider: user.authProvider || 'google'
  };
  
  return jwt.sign(tokenPayload, process.env.JWT_SECRET || 'your_jwt_secret', { 
    expiresIn: '1h' 
  });
};

export default googleConfig;
