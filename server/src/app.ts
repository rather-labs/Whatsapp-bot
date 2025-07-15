/**
 * WhatsApp Bot Backend Server
 * 
 * TIMESTAMP POLICY: All timestamps are stored in UTC/ISO 8601 format
 * - Database columns use TEXT type with UTC datetime defaults
 * - All timestamp operations use new Date().toISOString()
 * - This ensures consistent timezone handling across all environments
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';

// Import middleware
import { limiter } from './middleware/security';

// Import routes
import healthRoutes from './routes/health';
import userRoutes from './routes/users';
import walletRoutes from './routes/wallet';
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
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate limiting
app.use('/api/', limiter);

// API Routes
app.use('/api', healthRoutes);
app.use('/api/users', userRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/ramps', rampRoutes);

app.use('/api/transfers', transferRoutes);

app.use('/api/contacts', contactRoutes);

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
    console.log(`🌐 Network: ${networkConfig?.name || 'unknown'}`);
    console.log("💾 Database: SQLite");
  });
}

export default app; 