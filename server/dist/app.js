"use strict";
/**
 * WhatsApp Bot Backend Server
 *
 * TIMESTAMP POLICY: All timestamps are stored in UTC/ISO 8601 format
 * - Database columns use TEXT type with UTC datetime defaults
 * - All timestamp operations use new Date().toISOString()
 * - This ensures consistent timezone handling across all environments
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const dotenv_1 = __importDefault(require("dotenv"));
// Import middleware
const security_1 = require("./middleware/security");
// Import routes
const health_1 = __importDefault(require("./routes/health"));
const users_1 = __importDefault(require("./routes/users"));
const wallet_1 = __importDefault(require("./routes/wallet"));
const vault_1 = __importDefault(require("./routes/vault"));
const transactions_1 = __importDefault(require("./routes/transactions"));
const contacts_1 = __importDefault(require("./routes/contacts"));
// Import configurations
const blockchain_1 = require("./config/blockchain");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.BACKEND_PORT || 3002;
// Security middleware
app.use((0, helmet_1.default)());
app.use((0, compression_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
// Rate limiting
app.use('/api/', security_1.limiter);
// API Routes
app.use('/api', health_1.default);
app.use('/api/users', users_1.default);
app.use('/api/wallet', wallet_1.default);
app.use('/api/vault', vault_1.default);
app.use('/api/transactions', transactions_1.default);
app.use('/api/contacts', contacts_1.default);
// Error handling middleware
app.use((err, _req, res, _next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});
// 404 handler
app.use((_req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});
// Start server only if this file is run directly
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
        console.log(`🌐 Network: ${blockchain_1.networkConfig?.name || 'unknown'}`);
        console.log("💾 Database: SQLite");
    });
}
exports.default = app;
//# sourceMappingURL=app.js.map