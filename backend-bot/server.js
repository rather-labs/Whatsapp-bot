const express = require('express');
const cors = require('cors');
const http = require('node:http');
const socketIo = require('socket.io');
require('dotenv').config();

// Import services and handlers
const ConnectionManager = require('./services/ConnectionManager');
const WalletService = require('./services/WalletService');
const BlockchainService = require('./services/BlockchainService');
const MessageHandler = require('./handlers/MessageHandler');
const ApiRoutes = require('./routes/ApiRoutes');

class WhatsAppBotServer {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketIo(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    
    // Initialize bot state
    this.botState = {
      isReady: false,
      qrCode: null,
      status: 'disconnected'
    };
    
    // Initialize services
    this.connectionManager = new ConnectionManager(this.io, this.botState);
    this.walletService = new WalletService();
    this.blockchainService = new BlockchainService();
    this.messageHandler = new MessageHandler(this.connectionManager, this.walletService, this.blockchainService);
    this.apiRoutes = new ApiRoutes(this.connectionManager, this.walletService, this.blockchainService);
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocketHandlers();
    this.setupMessageHandling();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static('public'));
  }

  setupRoutes() {
    // API routes
    this.app.use('/api', this.apiRoutes.getRouter());
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log('Client connected');
      
      // Send current bot state to new connections
      socket.emit('botState', this.botState);
      
      socket.on('disconnect', () => {
        console.log('Client disconnected');
      });
    });
  }

  setupMessageHandling() {
    const client = this.connectionManager.getClient();
    
    // Message handling
    client.on('message', async (message) => {
      console.log('Message received:', message.body);
      console.log('From:', message.from);
      console.log('Contact:', message.getContact());
      
      // Ignore messages from the bot itself
      if (message.fromMe) return;
      
      try {
        const response = await this.messageHandler.handleMessage(message);
        if (response) {
          await message.reply(response);
        }
      } catch (error) {
        console.error('Error handling message:', error);
        await message.reply('Sorry, I encountered an error processing your message.');
      }
    });
  }

  async start() {
    const PORT = process.env.PORT || 3001;
    
    this.server.listen(PORT, () => {
      console.log(`🚀 WhatsApp Bot Server running on port ${PORT}`);
      console.log('📱 WebSocket server ready for real-time updates');
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📊 Status endpoint: http://localhost:${PORT}/api/status`);
      console.log(`💰 Wallet endpoint: http://localhost:${PORT}/api/wallets`);
      console.log(`🔗 Blockchain server: ${this.blockchainService.getServerUrl()}`);
    });

    // Initialize WhatsApp client
    await this.connectionManager.initialize();
  }

  async stop() {
    console.log('\n🛑 Shutting down server...');
    await this.connectionManager.destroy();
    this.server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  }
}

// Create and start the server
const server = new WhatsAppBotServer();

// Graceful shutdown
process.on('SIGINT', async () => {
  await server.stop();
});

// Start the server
server.start().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
}); 