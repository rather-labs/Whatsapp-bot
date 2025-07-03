const express = require('express');
const router = express.Router();

class ApiRoutes {
  constructor(connectionManager, walletService, blockchainService) {
    this.connectionManager = connectionManager;
    this.walletService = walletService;
    this.blockchainService = blockchainService;
    
    this.setupRoutes();
  }

  setupRoutes() {
    // Status endpoint
    router.get('/status', (req, res) => {
      res.json(this.connectionManager.getBotState());
    });

    // Wallets endpoint
    router.get('/wallets', (req, res) => {
      res.json(this.walletService.getAllWallets());
    });

    // Send message endpoint
    router.post('/send-message', async (req, res) => {
      try {
        const { number, message } = req.body;
        
        if (!number || !message) {
          return res.status(400).json({ error: 'Number and message are required' });
        }
        
        const botState = this.connectionManager.getBotState();
        if (!botState.isReady) {
          return res.status(400).json({ error: 'Bot is not ready' });
        }
        
        const client = this.connectionManager.getClient();
        const chatId = number.includes('@c.us') ? number : `${number}@c.us`;
        await client.sendMessage(chatId, message);
        
        res.json({ success: true, message: 'Message sent successfully' });
      } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message' });
      }
    });

    // Health check endpoint
    router.get('/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        botStatus: this.connectionManager.getBotState().status,
        botReady: this.connectionManager.getBotState().isReady,
        activeWallets: this.walletService.getWalletCount(),
        blockchainServer: this.blockchainService.getServerUrl()
      });
    });

    // Disconnect endpoint
    router.post('/disconnect', async (req, res) => {
      try {
        const { authorization } = req.headers;
        
        // Get the current bot number
        const client = this.connectionManager.getClient();
        const botInfo = client.info;
        const botNumber = botInfo?.wid?.user;
        
        // Check if authorization header matches admin number or bot number
        const isAdmin = process.env.ADMIN_NUMBER && authorization === process.env.ADMIN_NUMBER;
        const isBotNumber = authorization === botNumber;
        
        if (!isAdmin && !isBotNumber) {
          return res.status(401).json({ 
            error: 'Unauthorized',
            message: 'Only admin numbers or the bot number itself can disconnect the bot',
            botNumber: botNumber,
            adminNumber: process.env.ADMIN_NUMBER || 'Not set'
          });
        }
        
        const result = await this.connectionManager.disconnect();
        
        if (result.success) {
          res.json({ 
            success: true, 
            message: 'Bot disconnected successfully',
            timestamp: new Date().toISOString(),
            status: 'disconnected'
          });
        } else {
          res.status(500).json({ 
            error: 'Failed to disconnect bot',
            message: result.error 
          });
        }
      } catch (error) {
        console.error('Error disconnecting bot via API:', error);
        res.status(500).json({ 
          error: 'Failed to disconnect bot',
          message: error.message 
        });
      }
    });

    // Regenerate QR endpoint
    router.post('/regenerate-qr', async (req, res) => {
      try {
        const result = await this.connectionManager.regenerateQR();
        
        if (result.success) {
          res.json({ 
            success: true, 
            message: 'QR code regeneration initiated',
            timestamp: new Date().toISOString(),
            status: 'initializing'
          });
        } else {
          res.status(500).json({ 
            error: 'Failed to regenerate QR code',
            message: result.error 
          });
        }
      } catch (error) {
        console.error('Error regenerating QR code:', error);
        res.status(500).json({ 
          error: 'Failed to regenerate QR code',
          message: error.message 
        });
      }
    });

    // Clear session endpoint
    router.post('/clear-session', async (req, res) => {
      try {
        const result = await this.connectionManager.clearSession();
        
        if (result.success) {
          res.json({ 
            success: true, 
            message: 'Session cleared and QR code regeneration initiated',
            timestamp: new Date().toISOString(),
            status: 'initializing'
          });
        } else {
          res.status(500).json({ 
            error: 'Failed to clear session',
            message: result.error 
          });
        }
      } catch (error) {
        console.error('Error clearing session:', error);
        res.status(500).json({ 
          error: 'Failed to clear session',
          message: error.message 
        });
      }
    });
  }

  getRouter() {
    return router;
  }
}

module.exports = ApiRoutes; 