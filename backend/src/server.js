import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import passport from 'passport';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import authRoutes from '../routes/auth.js';
import adminRoutes from '../routes/admin.js';
import bookingRoutes from '../routes/bookings.js';
import orderRoutes from '../routes/orders.js';
import analyticsRoutes from '../routes/analytics.js';
import { initializeGoogleStrategy } from '../config/googleOAuth.js';
import db from "../config/db.js";

// Load environment variables from .env file
dotenv.config();

console.log('Loaded env vars:', {
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL
});

const app = express();

const allowedOrigins = ['http://localhost:5173'];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

const corsOptions = {
  origin: process.env.NODE_ENV === 'production' ? allowedOrigins : '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' })); // Increase JSON payload limit
app.use(express.urlencoded({ limit: '10mb', extended: true })); // Increase URL-encoded payload limit
app.use(cookieParser());

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Set to true in production with HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Test database connection
db.connect();
initializeGoogleStrategy(db);

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access token required' });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    req.user = decoded;
    next();
  } catch (error) {
    // Don't log expired token errors as they are expected when users have old tokens
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    } else {
      console.log('Invalid token:', error.message);
      return res.status(401).json({ message: 'Invalid token' });
    }
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
bookingRouter.use((req, res, next) => {
  req.db = db;
  next();
});
bookingRouter.use(bookingRoutes(db));
app.use('/api/bookings', bookingRouter);

// Use order routes with JWT authentication
const orderRouter = express.Router();
orderRouter.use(verifyToken);
orderRouter.use((req, res, next) => {
  req.db = db;
  next();
});
orderRouter.use(orderRoutes(db));
app.use('/api/orders', orderRouter);

// Use analytics routes with JWT authentication
const analyticsRouter = express.Router();
analyticsRouter.use(verifyToken);
analyticsRouter.use((req, res, next) => {
  req.db = db;
  next();
});
analyticsRouter.use(analyticsRoutes(db));
app.use('/api/analytics', analyticsRouter);

app.get('/', (req, res) => {
    res.send('Server is running!');
});

app.listen(8800, () => {
    console.log("Connected to backend!");
});
   