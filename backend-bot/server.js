const express = require('express');
const cors = require('cors');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const http = require('node:http');
const socketIo = require('socket.io');
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
    io.emit('botState', botState);
  } catch (error) {
    console.error('Error generating QR code:', error);
  }
});

client.on('ready', () => {
  console.log('WhatsApp client is ready!');
  botState.isReady = true;
  botState.qrCode = null;
  botState.status = 'connected';
  io.emit('botState', botState);
});

client.on('authenticated', () => {
  console.log('WhatsApp client is authenticated!');
  botState.status = 'authenticated';
  io.emit('botState', botState);
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
  io.emit('botState', botState);
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
  
  // Initialize wallet for user
  const wallet = initializeWallet(userId);
  
  // Basic command handling
  if (text === 'hello' || text === 'hi' || text === 'hey') {
    return `Hello! 👋 I'm your WhatsApp bot with wallet capabilities. How can I help you today?
    
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
- /contacts - View your contacts`;
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

*Examples:*
• /transfer 100 1234567890
• /buy 50
• /sell 25

Need help? Just type /help anytime!`;
  }
  
  if (text === '/status') {
    return `📊 *Bot Status*

🟢 Status: ${botState.status}
✅ Ready: ${botState.isReady ? 'Yes' : 'No'}
📱 Connected: ${botState.isReady ? 'Yes' : 'No'}
💰 Wallet Active: Yes

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
• Token transfers ✅

This bot is built with Node.js and Express, designed to provide a seamless WhatsApp experience with blockchain wallet capabilities.`;
  }
  
  // Wallet commands
  if (text === '/create') {
    return `✅ *Wallet Created Successfully!*

💰 Initial Balance: 1,000 tokens
📅 Created: ${wallet.createdAt}
🆔 Wallet ID: ${userId.slice(0, 8)}...

Your wallet is now ready for transactions!
Use /balance to check your balance or /help for more commands.`;
  }
  
  if (text === '/balance') {
    return `💰 *Wallet Balance*

💎 Current Balance: ${wallet.balance} tokens
📊 Total Transactions: ${wallet.transactions.length}
📅 Last Activity: ${wallet.transactions.length > 0 ? wallet.transactions[wallet.transactions.length - 1].timestamp : 'No transactions yet'}

Use /transfer, /buy, or /sell to manage your tokens!`;
  }
  
  if (text.startsWith('/transfer')) {
    const parts = text.split(' ');
    if (parts.length < 3) {
      return `❌ *Invalid Transfer Command*

Usage: /transfer <amount> <recipient>
Example: /transfer 100 1234567890

Please provide both amount and recipient number.`;
    }
    
    const amount = Number.parseInt(parts[1], 10);
    const recipient = parts[2];
    
    if (Number.isNaN(amount) || amount <= 0) {
      return `❌ *Invalid Amount*

Please provide a valid positive number for the transfer amount.`;
    }
    
    if (amount > wallet.balance) {
      return `❌ *Insufficient Balance*

Your balance: ${wallet.balance} tokens
Transfer amount: ${amount} tokens

You don't have enough tokens for this transfer.`;
    }
    
    // Simulate transfer
    wallet.balance -= amount;
    wallet.transactions.push({
      type: 'transfer',
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
    
    return `✅ *Transfer Successful!*

💸 Sent: ${amount} tokens
👤 To: ${recipient}
💰 New Balance: ${wallet.balance} tokens
📅 Time: ${new Date().toLocaleString()}

The transfer has been completed successfully!`;
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

🛒 Bought: ${amount} tokens
💰 New Balance: ${wallet.balance} tokens
📅 Time: ${new Date().toLocaleString()}

Your tokens have been added to your wallet!`;
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

Your balance: ${wallet.balance} tokens
Sell amount: ${amount} tokens

You don't have enough tokens to sell.`;
    }
    
    // Simulate sale
    wallet.balance -= amount;
    wallet.transactions.push({
      type: 'sell',
      amount: -amount,
      timestamp: new Date().toISOString()
    });
    
    return `✅ *Sale Successful!*

💸 Sold: ${amount} tokens
💰 New Balance: ${wallet.balance} tokens
📅 Time: ${new Date().toLocaleString()}

Your tokens have been sold successfully!`;
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
Use /transfer <amount> <number> to send tokens to any contact!`;
    } catch (error) {
      console.error('Error getting contacts:', error);
      return `❌ *Error Loading Contacts*

Unable to load your contacts at the moment. Please try again later.`;
    }
  }
  
  // Default response for unrecognized messages
  if (text.length > 0) {
    return `I received your message: "${message.body}"

I'm a wallet-enabled bot! Try these commands:
• /help - See all available commands
• /create - Create your wallet
• /balance - Check your balance
• /transfer <amount> <recipient> - Send tokens
• /buy <amount> - Buy tokens
• /sell <amount> - Sell tokens

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
    activeWallets: walletStore.size
  });
});

// Start the server
const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 WhatsApp Bot Server running on port ${PORT}`);
  console.log(`📱 WebSocket server ready for real-time updates`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📊 Status endpoint: http://localhost:${PORT}/api/status`);
  console.log(`💰 Wallet endpoint: http://localhost:${PORT}/api/wallets`);
});

// Initialize WhatsApp client
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