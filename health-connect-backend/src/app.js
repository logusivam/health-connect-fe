import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import v1Routes from './routes/v1/index.js';

const app = express();

// 1. Define your allowed frontend origins
const allowedOrigins = [
  'http://localhost:5173', 
  'https://yourdomain.com',
  'https://www.yourdomain.com' // Good practice to include the www variant
];

// 2. Configure CORS options securely
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like Postman or mobile apps) 
    // OR allow if the origin matches our allowed list
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS'));
    }
  },
  // 3. Restrict allowed HTTP methods
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  
  // 4. Specify which headers the frontend is allowed to send
  // 'Authorization' is required for your JWT Bearer tokens
  allowedHeaders: ['Content-Type', 'Authorization'],
  
  // 5. Allow cookies/tokens to be sent across origins
  credentials: true,
  
  // Provide status 200 for legacy browsers (some choke on 204)
  optionsSuccessStatus: 200 
};

// Apply the CORS middleware with our secure options
app.use(cors(corsOptions));

// Parses incoming JSON requests (increased limit for base64 image uploads)
app.use(express.json({ limit: '10mb' })); 
app.use(cookieParser());

// Mount V1 API Routes
app.use('/api/v1', v1Routes);

export default app;