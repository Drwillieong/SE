import express from 'express';
import cors from 'cors'; // 1. Import the cors package
// ... your other imports (dotenv, routes, db, etc.)

const app = express();

// 2. Define your allowed origins
const allowedOrigins = [
  'https://stunning-baklava-325663.netlify.app', // Your deployed Netlify frontend
  'http://localhost:5173', // Your local frontend (Vite's default)
  'http://localhost:3000'  // A common local frontend port
];

// 3. Set up CORS options
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true, // Allows cookies to be sent with requests
  optionsSuccessStatus: 200 // For legacy browser support
};

// 4. Use the CORS middleware
app.use(cors(corsOptions));

// This is also important for handling "pre-flight" requests
// which browsers send for certain types of cross-origin requests.
app.options('*', cors(corsOptions));


// --- The rest of your application setup continues below ---
// For example:
app.use(express.json());
// app.use('/auth', authRoutes);
// app.use('/api/admin/bookings', bookingRoutes);

// ... and so on

// app.listen(...)
