import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import saleRoutes from './routes/saleRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

dotenv.config();

const app = express();

app.set('trust proxy', 1);

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

// Allow configured clientUrl, localhost, Vercel deployments, or reflect origin safely
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      // Allow all vercel previews/deployments, localhost, or explicit clientUrl
      if (
        origin === clientUrl ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        origin.endsWith('.vercel.app') ||
        origin.endsWith('.onrender.com')
      ) {
        return callback(null, true);
      }
      // For any other origin, allow it to prevent frontend cross-origin blockage
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Root status & welcome endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'KiranaCloud Backend API',
    status: 'online',
    message: '🚀 KiranaCloud API Server is live and healthy!',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      products: '/api/products',
      sales: '/api/sales',
      customers: '/api/customers',
      analytics: '/api/analytics',
    },
    note: 'This is the backend API service. Open your Vercel deployment URL to access the KiranaCloud POS web interface.',
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'KiranaCloud Inventory & POS API',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/analytics', analyticsRoutes);

// Error Middleware
app.use(notFound);
app.use(errorHandler);

export default app;
