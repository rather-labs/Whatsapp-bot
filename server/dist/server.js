"use strict";
/**
 * WhatsApp Bot Backend Server - Modular Version
 *
 * This is the entry point for the modular server.
 * The main application logic is organized in the src/ directory.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Import the modular app
const app_1 = __importDefault(require("./app"));
// Start the server
const PORT = process.env.BACKEND_PORT || 3002;
app_1.default.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});
//# sourceMappingURL=server.js.map