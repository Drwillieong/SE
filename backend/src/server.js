import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import passport from 'passport';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from '../routes/auth.js';
import adminOrderRoutes from '../routes/adminOrderRoutes.js';
import adminBookingRoutes from '../routes/adminBookingRoutes.js';
import adminHistoryRoutes from '../routes/adminHistoryRoutes.js';
import adminAnalyticsRoutes from '../routes/adminAnalyticsRoutes.js';
import customerRoutes from '../routes/customerRoutes.js';
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

const allowedOrigins = [
  'http://localhost:5173',          // Your local development frontend
  'https://sanapasapo.netlify.app'  // Your deployed Netlify frontend
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
// Enable pre-flight requests for all routes
app.options('*', cors(corsOptions));

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
const adminOrderRouter = express.Router();
adminOrderRouter.use(verifyToken);
adminOrderRouter.use((req, res, next) => {
  req.db = db;
  next();
});
adminOrderRouter.use('/orders', adminOrderRoutes(db));
app.use('/api/admin', adminOrderRouter);

// Admin booking routes
const adminBookingRouter = express.Router();
adminBookingRouter.use(verifyToken);
adminBookingRouter.use((req, res, next) => {
  req.db = db;
  next();
});
adminBookingRouter.use('/bookings', adminBookingRoutes(db));
app.use('/api/admin', adminBookingRouter);

// Admin history routes
const adminHistoryRouter = express.Router();
adminHistoryRouter.use(verifyToken);
adminHistoryRouter.use((req, res, next) => {
  req.db = db;
  next();
});
adminHistoryRouter.use('/history', adminHistoryRoutes(db));
app.use('/api/admin', adminHistoryRouter);

// Admin analytics routes
const adminAnalyticsRouter = express.Router();
adminAnalyticsRouter.use(verifyToken);
adminAnalyticsRouter.use((req, res, next) => {
  req.db = db;
  next();
});
adminAnalyticsRouter.use('/analytics', adminAnalyticsRoutes(db));
app.use('/api/admin', adminAnalyticsRouter);

// Customer routes
const customerRouter = express.Router();
customerRouter.use(verifyToken);
customerRouter.use((req, res, next) => {
  req.db = db;
  next();
});
customerRouter.use(customerRoutes(db));
app.use('/api/customer', customerRouter);

// Use booking routes with JWT authentication
const bookingRouter = express.Router();
bookingRouter.use(verifyToken);
bookingRouter.use((req, res, next) => {
  req.db = db;
  next();
});
bookingRouter.use(adminBookingRoutes(db));
app.use('/api/bookings', bookingRouter);

// Use order routes with JWT authentication
const orderRouter = express.Router();
orderRouter.use(verifyToken);
orderRouter.use((req, res, next) => {
  req.db = db;
  next();
});
orderRouter.use(adminOrderRoutes(db));
app.use('/api/orders', orderRouter);

// Analytics routes are already mounted under /api/admin/analytics

app.get('/', (req, res) => {
    res.send('Server is running!');
});

const PORT = process.env.PORT || 8800;

// Create HTTP server
const server = createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket.IO middleware for authentication
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    socket.user = decoded;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.user.user_id);

  // Join user-specific room
  socket.join(`user_${socket.user.user_id}`);

  // Handle booking count updates
  socket.on('update-booking-counts', (data) => {
    // Broadcast to all connected clients
    io.emit('booking-counts-updated', data);
  });

  // Handle order updates
  socket.on('order-updated', (data) => {
    // Broadcast to all connected clients
    io.emit('order-updated', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.user.user_id);
  });
});

// Make io available globally for routes
global.io = io;

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
   