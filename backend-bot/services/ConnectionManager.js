const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');

class ConnectionManager {
  constructor(io, botState) {
    this.io = io;
    this.botState = botState;
    this.client = null;
    this.ALLOWED_BOT_NUMBER = process.env.ALLOWED_BOT_NUMBER;
    this.ADMIN_NUMBER = process.env.ADMIN_NUMBER;
    
    this.initializeClient();
  }

  initializeClient() {
    this.client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      }
    });

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    // QR Code handling
    this.client.on('qr', async (qr) => {
      console.log('QR Code received');
      try {
        const qrCodeDataUrl = await qrcode.toDataURL(qr);
        this.botState.qrCode = qrCodeDataUrl;
        this.botState.status = 'qr_ready';
        this.botState.isReady = false;
        this.io.emit('botState', this.botState);
        console.log('QR Code generated and emitted successfully');
      } catch (error) {
        console.error('Error generating QR code:', error);
        this.botState.status = 'qr_error';
        this.io.emit('botState', this.botState);
      }
    });

    // Authentication handling
    this.client.on('authenticated', async () => {
      try {
        console.log('WhatsApp client is authenticated!');
        this.botState.status = 'authenticated';
        this.io.emit('botState', this.botState);
      } catch (err) {
        console.error('Error during authentication:', err);
      }
    });

    // Ready state handling
    this.client.on('ready', async () => {
      try {
        console.log('WhatsApp client is ready!');
        
        // Get the authenticated user info
        const me = this.client.info; 
        const myNumber = me.wid.user;
        
        // Check if the authenticated number is allowed
        if (this.ALLOWED_BOT_NUMBER && myNumber !== this.ALLOWED_BOT_NUMBER) {
          console.log(`Authentication attempt by unauthorized number: ${myNumber}`);
          this.botState.status = 'auth_failed';
          this.botState.isReady = false;
          this.botState.qrCode = null;
          this.io.emit('botState', this.botState);
          // Logout unauthorized user
          await this.client.logout();
          return;
        }
        
        this.botState.isReady = true;
        this.botState.qrCode = null;
        this.botState.status = 'connected';
        this.io.emit('botState', this.botState);
      } catch (err) {
        console.error('Error during ready check:', err);
        this.botState.isReady = true;
        this.botState.qrCode = null;
        this.botState.status = 'connected';
        this.io.emit('botState', this.botState);
      }
    });

    // Authentication failure handling
    this.client.on('auth_failure', (msg) => {
      console.log('WhatsApp authentication failed:', msg);
      this.botState.status = 'auth_failed';
      this.io.emit('botState', this.botState);
    });

    // Disconnection handling
    this.client.on('disconnected', (reason) => {
      console.log('WhatsApp client was disconnected:', reason);
      this.botState.isReady = false;
      this.botState.status = 'disconnected';
      this.botState.qrCode = null;
      this.io.emit('botState', this.botState);
      
      // Reinitialize the client to show QR code again
      console.log('Reinitializing client to show QR code...');
      setTimeout(() => {
        console.log('Starting client reinitialization...');
        this.client.initialize();
      }, 3000);
    });

    // Contact handling
    this.client.on('contact_changed', (message, oldId, newId, isGroup) => {
      console.log('Contact changed:', { oldId, newId, isGroup });
    });
  }

  async initialize() {
    console.log('Initializing WhatsApp client...');
    this.botState.status = 'initializing';
    this.botState.isReady = false;
    this.botState.qrCode = null;
    this.io.emit('botState', this.botState);
    
    this.client.initialize();
  }

  async disconnect() {
    try {
      console.log('Disconnecting WhatsApp client...');
      await this.client.logout();
      this.botState.isReady = false;
      this.botState.status = 'disconnected';
      this.botState.qrCode = null;
      this.io.emit('botState', this.botState);
      
      // Reinitialize the client to show QR code again
      setTimeout(() => {
        console.log('Reinitializing client after disconnect...');
        this.client.initialize();
      }, 3000);
      
      return { success: true, message: 'Bot disconnected successfully' };
    } catch (error) {
      console.error('Error disconnecting client:', error);
      return { success: false, error: error.message };
    }
  }

  async regenerateQR() {
    try {
      console.log('Manually regenerating QR code...');
      
      // Reset bot state
      this.botState.isReady = false;
      this.botState.status = 'initializing';
      this.botState.qrCode = null;
      this.io.emit('botState', this.botState);
      
      // Destroy current client and reinitialize
      await this.client.destroy();
      
      // Wait a moment then reinitialize
      setTimeout(() => {
        this.client.initialize();
      }, 1000);
      
      return { success: true, message: 'QR code regeneration initiated' };
    } catch (error) {
      console.error('Error regenerating QR code:', error);
      return { success: false, error: error.message };
    }
  }

  async clearSession() {
    try {
      console.log('Clearing session to force QR code generation...');
      
      // Reset bot state
      this.botState.isReady = false;
      this.botState.status = 'initializing';
      this.botState.qrCode = null;
      this.io.emit('botState', this.botState);
      
      // Destroy current client
      await this.client.destroy();
      
      // Clear the session directory
      const fs = require('node:fs');
      const path = require('node:path');
      const sessionDir = path.join(__dirname, '..', '.wwebjs_auth');
      
      if (fs.existsSync(sessionDir)) {
        fs.rmSync(sessionDir, { recursive: true, force: true });
        console.log('Session directory cleared');
      }
      
      // Wait a moment then reinitialize
      setTimeout(() => {
        this.client.initialize();
      }, 2000);
      
      return { success: true, message: 'Session cleared and QR code regeneration initiated' };
    } catch (error) {
      console.error('Error clearing session:', error);
      return { success: false, error: error.message };
    }
  }

  async destroy() {
    if (this.client) {
      await this.client.destroy();
    }
  }

  getClient() {
    return this.client;
  }

  getBotState() {
    return this.botState;
  }

  isAuthorized(whatsappNumber) {
    const botInfo = this.client.info;
    const botNumber = botInfo?.wid?.user;
    
    const isAdmin = this.ADMIN_NUMBER && whatsappNumber === this.ADMIN_NUMBER;
    const isBotNumber = whatsappNumber === botNumber;
    
    return isAdmin || isBotNumber;
  }
}

module.exports = ConnectionManager; 