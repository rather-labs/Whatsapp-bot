/**
 * WhatsApp Bot Backend Server
 * 
 */

import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';

// Import middleware
import { limiter } from './middleware/security';
import { authenticateToken } from './middleware/auth';

// Import routes
import healthRoutes from './routes/health';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import rampRoutes from './routes/ramps';
import transferRoutes from './routes/transfers';
import contactRoutes from './routes/contacts';

// Import configurations
import { networkConfig } from './config/blockchain';

dotenv.config();

const app = express();
const PORT = process.env.BACKEND_PORT || 3002;

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration for development and production
const allowedOrigins = [
  `${process.env.FRONTEND_URL}/`,
  `${process.env.WHATSAPP_BOT_URL}/`,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, server-to-server)
    if (!origin) return callback(null, true);
    
    // Check exact matches for string origins
    if (allowedOrigins.some(allowed => 
      typeof allowed === 'string' && (origin === allowed || origin.startsWith(allowed))
    )) {
      return callback(null, true);
    }
    
    // Development mode - allow localhost with any port
    if (process.env.NODE_ENV !== 'production' && 
        (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      return callback(null, true);
    }
    
    console.log('CORS blocked origin:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin'],
  optionsSuccessStatus: 200
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
app.use('/api/', limiter);

// Public routes (no authentication required)
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);

// Protected routes (require JWT authentication and origin validation)
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/ramps', authenticateToken, rampRoutes);
app.use('/api/transfers', authenticateToken, transferRoutes);
app.use('/api/contacts', authenticateToken, contactRoutes);

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server only if this file is run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    console.log('🔐 Authentication required for protected routes');
    console.log(`🌐 Network: ${networkConfig?.name || 'unknown'}`);
    console.log("💾 Database: Supabase");
    console.log('🔄 CORS allowed origins:', allowedOrigins);
    console.log('📍 Environment:', process.env.NODE_ENV || 'development');
  });
}

export default app; 