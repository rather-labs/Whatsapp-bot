/**
 * WhatsApp Bot Backend Server
 * 
 * TIMESTAMP POLICY: All timestamps are stored in UTC/ISO 8601 format
 * - Database columns use TEXT type with UTC datetime defaults
 * - All timestamp operations use new Date().toISOString()
 * - This ensures consistent timezone handling across all environments
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

// Import middleware
const { limiter } = require('./middleware/security');

// Import routes
const healthRoutes = require('./routes/health');
const userRoutes = require('./routes/users');
const walletRoutes = require('./routes/wallet');
const vaultRoutes = require('./routes/vault');
const transactionRoutes = require('./routes/transactions');
const contactRoutes = require('./routes/contacts');

// Import configurations
const { networkConfig } = require('./config/blockchain');

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
app.use('/api/vault', vaultRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/contacts', contactRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server only if this file is run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🌐 Network: ${networkConfig.name}`);
    console.log("💾 Database: SQLite");
  });
}

module.exports = app; 