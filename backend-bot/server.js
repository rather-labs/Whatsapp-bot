const express = require('express');
const cors = require('cors');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const http = require('node:http');
const socketIo = require('socket.io');
const axios = require('axios');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Blockchain server configuration
const BLOCKCHAIN_SERVER_URL = process.env.BLOCKCHAIN_SERVER_URL || 'http://localhost:3002';

// Get allowed number from .env
const ALLOWED_BOT_NUMBER = process.env.ALLOWED_BOT_NUMBER;
const ADMIN_NUMBER = process.env.ADMIN_NUMBER;

// WhatsApp client
const client = new Client({
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

// Store bot state
const botState = {
  isReady: false,
  qrCode: null,
  status: 'disconnected'
};

// Simple wallet simulation (in production, this would connect to a real blockchain)
const walletStore = new Map();

// Initialize wallet for a user
function initializeWallet(userId) {
  if (!walletStore.has(userId)) {
    walletStore.set(userId, {
      balance: 1000, // Starting balance
      transactions: [],
      createdAt: new Date().toISOString()
    });
  }
  return walletStore.get(userId);
}

// Blockchain server API functions
async function registerUser(whatsappNumber, username = null) {
  try {
    const response = await axios.post(`${BLOCKCHAIN_SERVER_URL}/api/users/register`, {
      whatsapp_number: whatsappNumber,
      username: username,
      password: `temp_${Date.now()}` // Temporary password
    });
    return response.data;
  } catch (error) {
    console.error('Error registering user:', error.response?.data || error.message);
    return null;
  }
}

async function getUserProfile(whatsappNumber) {
  try {
    // First login to get token
    const loginResponse = await axios.post(`${BLOCKCHAIN_SERVER_URL}/api/users/login`, {
      whatsapp_number: whatsappNumber,
      password: `temp_${Date.now()}` // This won't work, need proper auth
    });
    
    if (loginResponse.data.token) {
      const profileResponse = await axios.get(`${BLOCKCHAIN_SERVER_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${loginResponse.data.token}` }
      });
      return profileResponse.data;
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error.response?.data || error.message);
    return null;
  }
}

async function getWalletBalance(whatsappNumber) {
  try {
    // This would require proper authentication
    // For now, return local wallet data
    return null;
  } catch (error) {
    console.error('Error getting wallet balance:', error.response?.data || error.message);
    return null;
  }
}

async function sendPayment(whatsappNumber, amount, recipient) {
  try {
    // This would require proper authentication
    // For now, use local wallet simulation
    return null;
  } catch (error) {
    console.error('Error sending payment:', error.response?.data || error.message);
    return null;
  }
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected');
  
  // Send current bot state to new connections
  socket.emit('botState', botState);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// WhatsApp client events
client.on('qr', async (qr) => {
  console.log('QR Code received');
  try {
    const qrCodeDataUrl = await qrcode.toDataURL(qr);
    botState.qrCode = qrCodeDataUrl;
    botState.status = 'qr_ready';
    botState.isReady = false;
    io.emit('botState', botState);
    console.log('QR Code generated and emitted successfully');
  } catch (error) {
    console.error('Error generating QR code:', error);
    botState.status = 'qr_error';
    io.emit('botState', botState);
  }
});



// Restrict authentication to allowed number
client.on('authenticated', async () => {
  try {
    console.log('WhatsApp client is authenticated!');
    botState.status = 'authenticated';
    io.emit('botState', botState);
  } catch (err) {
    console.error('Error during authentication:', err);
  }
});

// Check number authorization when client is ready
client.on('ready', async () => {
  try {
    console.log('WhatsApp client is ready!');
    
    // Get the authenticated user info using the correct method
    const me = client.info; 
    const myNumber = me.wid.user;
    
    // Check if the authenticated number is allowed
    if (ALLOWED_BOT_NUMBER && myNumber !== ALLOWED_BOT_NUMBER) {
      console.log(`Authentication attempt by unauthorized number: ${myNumber}`);
      botState.status = 'auth_failed';
      botState.isReady = false;
      botState.qrCode = null;
      io.emit('botState', botState);
      // Logout unauthorized user
      await client.logout();
      return;
    }
    
    botState.isReady = true;
    botState.qrCode = null;
    botState.status = 'connected';
    io.emit('botState', botState);
  } catch (err) {
    console.error('Error during ready check:', err);
    botState.isReady = true;
    botState.qrCode = null;
    botState.status = 'connected';
    io.emit('botState', botState);
  }
});

client.on('auth_failure', (msg) => {
  console.log('WhatsApp authentication failed:', msg);
  botState.status = 'auth_failed';
  io.emit('botState', botState);
});

client.on('disconnected', (reason) => {
  console.log('WhatsApp client was disconnected:', reason);
  botState.isReady = false;
  botState.status = 'disconnected';
  botState.qrCode = null;
  io.emit('botState', botState);
  
  // Reinitialize the client to show QR code again
  console.log('Reinitializing client to show QR code...');
  setTimeout(() => {
    console.log('Starting client reinitialization...');
    client.initialize();
  }, 3000); // Wait 3 seconds before reinitializing
});

// Contact handling
client.on('contact_changed', (message, oldId, newId, isGroup) => {
  console.log('Contact changed:', { oldId, newId, isGroup });
  // You can handle contact updates here
});

// Message handling
client.on('message', async (message) => {
  console.log('Message received:', message.body);
  console.log('From:', message.from);
  console.log('Contact:', message.getContact());
  
  // Ignore messages from the bot itself
  if (message.fromMe) return;
  
  try {
    const response = await handleMessage(message);
    if (response) {
      await message.reply(response);
    }
  } catch (error) {
    console.error('Error handling message:', error);
    await message.reply('Sorry, I encountered an error processing your message.');
  }
});

// Message handler function
async function handleMessage(message) {
  const text = message.body.toLowerCase().trim();
  const contact = await message.getContact();
  const userId = message.from;
  const whatsappNumber = userId.replace('@c.us', '');
  
  // Initialize wallet for user
  const wallet = initializeWallet(userId);
  
  // Basic command handling
  if (text === 'hello' || text === 'hi' || text === 'hey') {
    return `Hello! 👋 I'm your WhatsApp bot with smart wallet capabilities. How can I help you today?
    
Available commands:
- /help - Show this help message
- /status - Check bot status
- /info - Get information about this bot
- /create - Create a new wallet
- /balance - Check wallet balance
- /pay <amount> <recipient> - Pay USDC to another user
- /buy <amount> - Buy USDC tokens and deposit on vault to generate yield
- /sell <amount> - Sell USDC tokens
- /deposit <amount> - Deposit USDC to vault to generate yield
- /withdraw <amount> - Withdraw USDC from vault to your wallet
- /riskprofile - Change user risk profile
- /authprofile - Check user auth profile
- /contacts - View your contacts
- /disconnect - Disconnect the bot (authorized users only)`;
  }
  
  if (text === '/help') {
    return `🤖 *Bot Commands*

*Basic Commands:*
• hello/hi/hey - Greet the bot
• /help - Show this help message
• /status - Check bot status
• /info - Get information about this bot

*Wallet Commands:*
• /create - Create a new wallet
• /balance - Check wallet balance
• /pay <amount> <recipient> - Pay USDC to another user
• /buy <amount> - Buy USDC tokens with fiat currency
• /sell <amount> - Sell USDC tokens to fiat currency
• /deposit <amount> - Deposit USDC to vault to generate yield
• /withdraw <amount> - Withdraw USDC from vault to your wallet
• /riskprofile - Change user risk profile
• /authprofile - Check user auth profile

*Contact Commands:*
• /contacts - View your contacts

*Admin Commands:*
• /disconnect - Disconnect the bot (admin or bot number only)

*Examples:*
• /pay 100 1234567890
• /buy 50
• /sell 25
• /deposit 200

Need help? Just type /help anytime!`;
  }
  
  if (text === '/status') {
    return `📊 *Bot Status*

🟢 Status: ${botState.status}
✅ Ready: ${botState.isReady ? 'Yes' : 'No'}
📱 Connected: ${botState.isReady ? 'Yes' : 'No'}
💰 Wallet Active: Yes
🔗 Blockchain Server: ${BLOCKCHAIN_SERVER_URL}

The bot is currently ${botState.isReady ? 'online and ready to help!' : 'connecting...'}`;
  }
  
  if (text === '/info') {
    return `ℹ️ *Bot Information*

🤖 *WhatsApp Bot with Smart Wallet*
Version: 2.0.0
Framework: whatsapp-web.js
Features: 
• Real-time messaging
• Command system
• Status monitoring
• Wallet integration ✅
• Contact management ✅
• USDC payments ✅
• Vault deposits ✅
• Blockchain integration ✅

This bot is built with Node.js and Express, designed to provide a seamless WhatsApp experience with blockchain wallet capabilities.`;
  }
  
  // Wallet commands
  if (text === '/create') {
    // Try to register user with blockchain server
    const registration = await registerUser(whatsappNumber, contact.pushname);
    
    return `✅ *Wallet Created Successfully!*

💰 Initial Balance: 1,000 USDC
📅 Created: ${wallet.createdAt}
🆔 Wallet ID: ${userId.slice(0, 8)}...
🔗 Blockchain: ${registration ? 'Connected' : 'Local Only'}

Your wallet is now ready for transactions!
Use /balance to check your balance or /help for more commands.`;
  }
  
  if (text === '/balance') {
    return `💰 *Wallet Balance*

💎 Current Balance: ${wallet.balance} USDC
📊 Total Transactions: ${wallet.transactions.length}
📅 Last Activity: ${wallet.transactions.length > 0 ? wallet.transactions[wallet.transactions.length - 1].timestamp : 'No transactions yet'}

Use /pay, /buy, /sell, /deposit, or /withdraw to manage your USDC!`;
  }
  
  if (text.startsWith('/pay')) {
    const parts = text.split(' ');
    if (parts.length < 3) {
      return `❌ *Invalid Payment Command*

Usage: /pay <amount> <recipient>
Example: /pay 100 1234567890

Please provide both amount and recipient number.`;
    }
    
    const amount = Number.parseInt(parts[1], 10);
    const recipient = parts[2];
    
    if (Number.isNaN(amount) || amount <= 0) {
      return `❌ *Invalid Amount*

Please provide a valid positive number for the payment amount.`;
    }
    
    if (amount > wallet.balance) {
      return `❌ *Insufficient Balance*

Your balance: ${wallet.balance} USDC
Payment amount: ${amount} USDC

You don't have enough USDC for this payment.`;
    }
    
    // Simulate payment
    wallet.balance -= amount;
    wallet.transactions.push({
      type: 'payment',
      amount: -amount,
      recipient: recipient,
      timestamp: new Date().toISOString()
    });
    
    // Initialize recipient wallet if it doesn't exist
    const recipientWallet = initializeWallet(recipient);
    recipientWallet.balance += amount;
    recipientWallet.transactions.push({
      type: 'received',
      amount: amount,
      sender: userId,
      timestamp: new Date().toISOString()
    });
    
    return `✅ *Payment Successful!*

💸 Sent: ${amount} USDC
👤 To: ${recipient}
💰 New Balance: ${wallet.balance} USDC
📅 Time: ${new Date().toLocaleString()}

The payment has been completed successfully!`;
  }
  
  if (text.startsWith('/buy')) {
    const parts = text.split(' ');
    if (parts.length < 2) {
      return `❌ *Invalid Buy Command*

Usage: /buy <amount>
Example: /buy 100

Please provide the amount you want to buy.`;
    }
    
    const amount = Number.parseInt(parts[1], 10);
    
    if (Number.isNaN(amount) || amount <= 0) {
      return `❌ *Invalid Amount*

Please provide a valid positive number for the purchase amount.`;
    }
    
    // Simulate purchase
    wallet.balance += amount;
    wallet.transactions.push({
      type: 'buy',
      amount: amount,
      timestamp: new Date().toISOString()
    });
    
    return `✅ *Purchase Successful!*

🛒 Bought: ${amount} USDC
💰 New Balance: ${wallet.balance} USDC
📅 Time: ${new Date().toLocaleString()}

Your USDC has been added to your wallet!`;
  }
  
  if (text.startsWith('/sell')) {
    const parts = text.split(' ');
    if (parts.length < 2) {
      return `❌ *Invalid Sell Command*

Usage: /sell <amount>
Example: /sell 100

Please provide the amount you want to sell.`;
    }
    
    const amount = Number.parseInt(parts[1], 10);
    
    if (Number.isNaN(amount) || amount <= 0) {
      return `❌ *Invalid Amount*

Please provide a valid positive number for the sell amount.`;
    }
    
    if (amount > wallet.balance) {
      return `❌ *Insufficient Balance*

Your balance: ${wallet.balance} USDC
Sell amount: ${amount} USDC

You don't have enough USDC to sell.`;
    }
    
    // Simulate sale
    wallet.balance -= amount;
    wallet.transactions.push({
      type: 'sell',
      amount: -amount,
      timestamp: new Date().toISOString()
    });
    
    return `✅ *Sale Successful!*

💸 Sold: ${amount} USDC
💰 New Balance: ${wallet.balance} USDC
📅 Time: ${new Date().toLocaleString()}

Your USDC has been sold successfully!`;
  }
  
  if (text.startsWith('/deposit')) {
    const parts = text.split(' ');
    if (parts.length < 2) {
      return `❌ *Invalid Deposit Command*

Usage: /deposit <amount>
Example: /deposit 100

Please provide the amount you want to deposit to the vault.`;
    }
    
    const amount = Number.parseInt(parts[1], 10);
    
    if (Number.isNaN(amount) || amount <= 0) {
      return `❌ *Invalid Amount*

Please provide a valid positive number for the deposit amount.`;
    }
    
    if (amount > wallet.balance) {
      return `❌ *Insufficient Balance*

Your balance: ${wallet.balance} USDC
Deposit amount: ${amount} USDC

You don't have enough USDC to deposit.`;
    }
    
    // Simulate vault deposit
    wallet.balance -= amount;
    wallet.transactions.push({
      type: 'vault_deposit',
      amount: -amount,
      timestamp: new Date().toISOString()
    });
    
    return `✅ *Vault Deposit Successful!*

🏦 Deposited: ${amount} USDC
💰 New Balance: ${wallet.balance} USDC
📈 APY: 5%
📅 Time: ${new Date().toLocaleString()}

Your USDC is now earning yield in the vault!`;
  }
  
  if (text.startsWith('/withdraw')) {
    const parts = text.split(' ');
    if (parts.length < 2) {
      return `❌ *Invalid Withdraw Command*

Usage: /withdraw <amount>
Example: /withdraw 100

Please provide the amount you want to withdraw from the vault.`;
    }
    
    const amount = Number.parseInt(parts[1], 10);
    
    if (Number.isNaN(amount) || amount <= 0) {
      return `❌ *Invalid Amount*

Please provide a valid positive number for the withdraw amount.`;
    }
    
    // Simulate vault withdrawal
    wallet.balance += amount;
    wallet.transactions.push({
      type: 'vault_withdraw',
      amount: amount,
      timestamp: new Date().toISOString()
    });
    
    return `✅ *Vault Withdrawal Successful!*

🏦 Withdrawn: ${amount} USDC
💰 New Balance: ${wallet.balance} USDC
📅 Time: ${new Date().toLocaleString()}

Your USDC has been withdrawn from the vault!`;
  }
  
  if (text === '/riskprofile') {
    return `🎯 *Risk Profile Management*

Your current risk profile: Moderate

Available profiles:
• Low - Conservative investments
• Moderate - Balanced approach
• High - Aggressive investments

To change your risk profile, contact support or use the web interface.

This affects your vault investment strategy and yield generation.`;
  }
  
  if (text === '/authprofile') {
    return `🔐 *Authentication Profile*

Your current auth level: Basic

Available levels:
• Basic - Standard security
• Enhanced - 2FA enabled
• Premium - Advanced security features

To upgrade your auth profile, contact support or use the web interface.

This affects your transaction limits and security features.`;
  }
  
  if (text === '/contacts') {
    try {
      const contacts = await client.getContacts();
      const contactList = contacts
        .filter(contact => contact.isUser && contact.number !== 'status@broadcast')
        .slice(0, 10) // Limit to first 10 contacts
        .map(contact => `• ${contact.pushname || contact.number}: ${contact.number}`)
        .join('\n');
      
      return `📱 *Your Contacts* (showing first 10)

${contactList}

Total contacts: ${contacts.filter(c => c.isUser).length}
Use /pay <amount> <number> to send USDC to any contact!`;
    } catch (error) {
      console.error('Error getting contacts:', error);
      return `❌ *Error Loading Contacts*

Unable to load your contacts at the moment. Please try again later.`;
    }
  }
  
  if (text === '/disconnect') {
    try {
      // Get the current bot number using the correct method
      const botInfo = client.info;
      const botNumber = botInfo.wid.user;
      
      // Check if user is authorized to disconnect (admin number or bot number itself)
      const isAdmin = ADMIN_NUMBER && whatsappNumber === ADMIN_NUMBER;
      const isBotNumber = whatsappNumber === botNumber;
      
      if (!isAdmin && !isBotNumber) {
        return `❌ *Unauthorized Action*

You are not authorized to disconnect this bot.
Only the admin number or the bot number itself can perform this action.

Your number: ${whatsappNumber}
Bot number: ${botNumber}
Admin number: ${ADMIN_NUMBER || 'Not set'}`;
      }
      
      botState.isReady = false;
      botState.status = 'disconnected';
      io.emit('botState', botState);
      
      const response = `🔌 *Bot Disconnected Successfully!*

The WhatsApp bot has been disconnected.
To reconnect, restart the server or scan the QR code again.

Status: Disconnected
Time: ${new Date().toLocaleString()}`;
      
      // Reply first, then disconnect
      await message.reply(response);
      
      // Disconnect the WhatsApp client
      await client.logout();
      
      // Reinitialize the client to show QR code again
      setTimeout(() => {
        console.log('Reinitializing client after disconnect...');
        client.initialize();
      }, 3000); // Wait 3 seconds before reinitializing
      
      return response;
    } catch (error) {
      console.error('Error disconnecting bot:', error);
      return `❌ *Disconnect Error*

Failed to disconnect the bot. Please try again or contact support.

Error: ${error.message}`;
    }
  }
  
  // Default response for unrecognized messages
  if (text.length > 0) {
    return `I received your message: "${message.body}"

I'm a smart wallet bot! Try these commands:
• /help - See all available commands
• /create - Create your wallet
• /balance - Check your balance
• /pay <amount> <recipient> - Send USDC
• /buy <amount> - Buy USDC
• /sell <amount> - Sell USDC
• /deposit <amount> - Deposit to vault
• /withdraw <amount> - Withdraw from vault
• /disconnect - Disconnect bot (admin or bot number only)

Or just say hello! 😊`;
  }
  
  return null;
}

// API Routes
app.get('/api/status', (req, res) => {
  res.json(botState);
});

app.get('/api/wallets', (req, res) => {
  const wallets = {};
  walletStore.forEach((wallet, userId) => {
    wallets[userId] = {
      balance: wallet.balance,
      transactionCount: wallet.transactions.length,
      createdAt: wallet.createdAt
    };
  });
  res.json(wallets);
});

app.post('/api/send-message', async (req, res) => {
  try {
    const { number, message } = req.body;
    
    if (!number || !message) {
      return res.status(400).json({ error: 'Number and message are required' });
    }
    
    if (!botState.isReady) {
      return res.status(400).json({ error: 'Bot is not ready' });
    }
    
    const chatId = number.includes('@c.us') ? number : `${number}@c.us`;
    await client.sendMessage(chatId, message);
    
    res.json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    botStatus: botState.status,
    botReady: botState.isReady,
    activeWallets: walletStore.size,
    blockchainServer: BLOCKCHAIN_SERVER_URL
  });
});

app.post('/api/disconnect', async (req, res) => {
  try {
    const { authorization } = req.headers;
    
    // Get the current bot number using the correct method
    const botInfo = await client.info;
    const botNumber = botInfo.wid.user;
    
    // Check if authorization header matches admin number or bot number
    const isAdmin = ADMIN_NUMBER && authorization === ADMIN_NUMBER;
    const isBotNumber = authorization === botNumber;
    
    if (!isAdmin && !isBotNumber) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Only admin numbers or the bot number itself can disconnect the bot',
        botNumber: botNumber,
        adminNumber: ADMIN_NUMBER || 'Not set'
      });
    }
    
    // Disconnect the WhatsApp client
    await client.logout();
    botState.isReady = false;
    botState.status = 'disconnected';
    botState.qrCode = null;
    io.emit('botState', botState);
    
    // Reinitialize the client to show QR code again
    setTimeout(() => {
      console.log('Reinitializing client after API disconnect...');
      client.initialize();
    }, 3000); // Wait 3 seconds before reinitializing
    
    res.json({ 
      success: true, 
      message: 'Bot disconnected successfully',
      timestamp: new Date().toISOString(),
      status: 'disconnected'
    });
  } catch (error) {
    console.error('Error disconnecting bot via API:', error);
    res.status(500).json({ 
      error: 'Failed to disconnect bot',
      message: error.message 
    });
  }
});

app.post('/api/regenerate-qr', async (req, res) => {
  try {
    console.log('Manually regenerating QR code...');
    
    // Reset bot state
    botState.isReady = false;
    botState.status = 'initializing';
    botState.qrCode = null;
    io.emit('botState', botState);
    
    // Destroy current client and reinitialize
    await client.destroy();
    
    // Wait a moment then reinitialize
    setTimeout(() => {
      client.initialize();
    }, 1000);
    
    res.json({ 
      success: true, 
      message: 'QR code regeneration initiated',
      timestamp: new Date().toISOString(),
      status: 'initializing'
    });
  } catch (error) {
    console.error('Error regenerating QR code:', error);
    res.status(500).json({ 
      error: 'Failed to regenerate QR code',
      message: error.message 
    });
  }
});

app.post('/api/clear-session', async (req, res) => {
  try {
    console.log('Clearing session to force QR code generation...');
    
    // Reset bot state
    botState.isReady = false;
    botState.status = 'initializing';
    botState.qrCode = null;
    io.emit('botState', botState);
    
    // Destroy current client
    await client.destroy();
    
    // Clear the session directory
    const fs = require('node:fs');
    const path = require('node:path');
    const sessionDir = path.join(__dirname, '.wwebjs_auth');
    
    if (fs.existsSync(sessionDir)) {
      fs.rmSync(sessionDir, { recursive: true, force: true });
      console.log('Session directory cleared');
    }
    
    // Wait a moment then reinitialize
    setTimeout(() => {
      client.initialize();
    }, 2000);
    
    res.json({ 
      success: true, 
      message: 'Session cleared and QR code regeneration initiated',
      timestamp: new Date().toISOString(),
      status: 'initializing'
    });
  } catch (error) {
    console.error('Error clearing session:', error);
    res.status(500).json({ 
      error: 'Failed to clear session',
      message: error.message 
    });
  }
});

// Start the server
const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 WhatsApp Bot Server running on port ${PORT}`);
  console.log('📱 WebSocket server ready for real-time updates');
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📊 Status endpoint: http://localhost:${PORT}/api/status`);
  console.log(`💰 Wallet endpoint: http://localhost:${PORT}/api/wallets`);
  console.log(`🔗 Blockchain server: ${BLOCKCHAIN_SERVER_URL}`);
});

// Initialize WhatsApp client
console.log('Initializing WhatsApp client...');
botState.status = 'initializing';
botState.isReady = false;
botState.qrCode = null;
io.emit('botState', botState);

client.initialize();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await client.destroy();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
}); 