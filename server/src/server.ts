/**
 * WhatsApp Bot Backend Server - Modular Version
 * 
 * This is the entry point for the modular server.
 * The main application logic is organized in the src/ directory.
 */

// Import the modular app
import app from './app';

// Start the server
const PORT = process.env.BACKEND_PORT;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
}); 