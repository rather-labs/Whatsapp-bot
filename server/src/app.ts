/**
 * WhatsApp Bot Backend Server
 * 
 * TIMESTAMP POLICY: All timestamps are stored in UTC/ISO 8601 format
 * - Database columns use TEXT type with UTC datetime defaults
 * - All timestamp operations use new Date().toISOString()
 * - This ensures consistent timezone handling across all environments
 */

import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';

// Import middleware
import { limiter } from './middleware/security';
import { authenticateAndValidateOrigin } from './middleware/auth';

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
app.use(cors({
  origin: [process.env.FRONTEND_URL, process.env.WHATSAPP_BOT_URL],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
app.use('/api/', limiter);

// Public routes (no authentication required)
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);

// Protected routes (require JWT authentication and origin validation)
app.use('/api/users', authenticateAndValidateOrigin, userRoutes);
app.use('/api/ramps', authenticateAndValidateOrigin, rampRoutes);
app.use('/api/transfers', authenticateAndValidateOrigin, transferRoutes);
app.use('/api/contacts', authenticateAndValidateOrigin, contactRoutes);

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
    console.log("💾 Database: SQLite");
  });
}

export default app; 