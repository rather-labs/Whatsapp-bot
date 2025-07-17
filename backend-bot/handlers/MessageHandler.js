const SessionManager = require('../services/SessionManager');

class MessageHandler {
  constructor(connectionManager, backendService) {
    this.connectionManager = connectionManager;
    this.backendService = backendService;
    this.sessionManager = new SessionManager(backendService);
  }

  // Main message processing function
  async handleMessage(message) {
    const text = message.body.toLowerCase().trim();
    const contact = await message.getContact();
    const userId = message.from;
    const whatsappNumber = userId.replace('@c.us', '');
        
    // Check if user is awaiting PIN input
    if (this.sessionManager.isAwaitingPin(whatsappNumber)) {
      // Handle PIN input
      const pinResult = await this.sessionManager.handlePinInput(whatsappNumber, text);
      return pinResult.message;
    }

    // Check if message is a vCard
    if (message.type === 'vcard') {
      return this.handleVCardMessage(message.body);
    }
    
    // Handle different commands
    return await this.processCommand(text, message, contact, userId, whatsappNumber);
  }

  // Process different commands
  async processCommand(text, message, contact, userId, whatsappNumber) {
    // Basic greetings
    if (text === 'hello' || text === 'hi' || text === 'hey') {
      return this.getGreetingMessage();
    }

    // Help command
    if (text === '/help') {
      return this.getHelpMessage();
    }
    
    // Status command
    if (text === '/status') {
      return this.getStatusMessage();
    }
    
    // Info command
    if (text === '/info') {
      return this.getInfoMessage();
    }
    
    // User commands
    if (text === '/register') {
      return await this.handleRegisterUser(whatsappNumber, contact);
    }    
    
    // Session commands
    if (text === '/session') {
      return await this.handleSessionStatus(whatsappNumber, contact);
    }

    const checkSession = async () => {
      console.log('checkSession');
      // Check session status and handle expiration
      const sessionResult = await this.sessionManager.checkAndHandleSession(whatsappNumber, contact);
      console.log('sessionResult', sessionResult);
      if (sessionResult.requiresPin || !sessionResult.registered) {
        return sessionResult.message;
      }

      // Update user activity
      await this.sessionManager.updateActivity(whatsappNumber);
    
      return null
    }

    
    if (text === '/balance') {
      return await checkSession() || await this.handleBalance(userId);
    }
    
    if (text.startsWith('/pay')) {
      return await checkSession() || await this.handlePayment(text, userId);
    }
    
    if (text.startsWith('/buy')) {
      return await checkSession() || await this.handleBuy(text, userId);
    }
    
    if (text.startsWith('/sell')) {
      return await checkSession() || await this.handleSell(text, userId);
    }
    
    if (text.startsWith('/deposit')) {
      return await checkSession() || await this.handleDeposit(text, userId);
    }
    
    if (text.startsWith('/withdraw')) {
      return await checkSession() || await this.handleWithdraw(text, userId);
    }
    
    // Profile commands
    if (text.startsWith('/riskprofile')) {
      return await checkSession() || await this.getRiskProfileMessage(text, userId);
    }
    
    if (text.startsWith('/authprofile')) {
      return await checkSession() || await this.getAuthProfileMessage(text, userId);
    }
        
    // Admin commands
    if (text === '/disconnect') {
      return await checkSession() || await this.handleDisconnect(message, whatsappNumber);
    }
    
    // Default response for unrecognized messages
    if (text.length > 0) {
      return this.getDefaultResponse(message.body);
    }
    
    return null;
  }

  // Command handlers
  getGreetingMessage() {
    return `Hello! 👋 I'm your WhatsApp bot with smart wallet capabilities. How can I help you today?
    
Available commands:
• /help - Show this help message
• /status - Check bot status
• /info - Get information about this bot
• /session - Check your session status
• /register - Register a new user account
• /balance - Check wallet and vault balances
• /pay <amount> <recipient> - Pay USDC to another user
• /buy <amount> - Buy USDC tokens and send to your wallet
• /sell <amount> - Sell USDC tokens
• /deposit <amount> - Deposit USDC from your wallet to vault to generate yield
• /withdraw <amount> - Withdraw USDC from vault to your wallet
• /riskprofile <profile> - Change user risk profile
• /authprofile <profile> - Change user auth profile
• /disconnect - Disconnect the bot (authorized users only)

I can also parse contact information when you share contacts! 📇
I will store them so you can pay them later! 💸

Or just say hello! 😊`;
  }

  getHelpMessage() {
    return `🤖 *Bot Commands*

*Basic Commands:*
• hello/hi/hey - Greet the bot
• /help - Show this help message
• /status - Check bot status
• /info - Get information about this bot

*User Commands:*
• /register - Register a new user account
• /session - Check your session status. It will expire after 5 minutes
• /balance - Check wallet balance
• /pay <amount> <recipient> - Pay USDC to another user
• /buy <amount> - Buy USDC tokens and send to your wallet
• /sell <amount> - Sell USDC tokens from your wallet
• /deposit <amount> - Deposit USDC from your wallet to vault to generate yield
• /withdraw <amount> - Withdraw USDC from vault to your wallet
• /riskprofile <profile> - Change user risk profile
    + Low - Conservative investments with low yields
    + Moderate - Balanced approach 
    + High - Aggressive investments with high yields
• /authprofile <profile> - Check user auth profile
    + Low - The user is not required to sign autorization for any actions
    + Medium - The user can deposit or withdraw assets to their wallet without signing authorization
    + High - The user is required to sign autorization for all actions

*Admin Commands:*
• /disconnect - Disconnect the bot (admin or bot number only)

*Contact Features:*
• Share contacts - I can parse contact information automatically for easier payments

*Examples:*
• /pay 100 1234567890
• /buy 50
• /sell 25
• /deposit 200

Need help? Just type /help anytime!`;
  }
  // *****************************************************
  getStatusMessage() {
    const botState = this.connectionManager.getBotState();
    return `📊 *Bot Status*

🟢 Status: ${botState.status}
✅ Ready: ${botState.isReady ? 'Yes' : 'No'}
📱 Connected: ${botState.isReady ? 'Yes' : 'No'}
💰 User Account Active: Yes
🔗 Backend Server: ${this.backendService.getServerUrl()}

The bot is currently ${botState.isReady ? 'online and ready to help!' : 'connecting...'}`;
  }

  // *****************************************************
  getInfoMessage() {
    return `ℹ️ *Bot Information*

🤖 *WhatsApp Bot with Smart Wallet*
Version: 2.0.0
Framework: whatsapp-web.js
Features: 
• Real-time messaging
• Command system
• Status monitoring
• User account integration ✅
• Contact management ✅
• USDC payments ✅
• Vault deposits ✅
• Backend integration ✅

This bot is built with Node.js and Express, designed to provide a seamless WhatsApp experience with backend wallet capabilities.`;
  }

  // *****************************************************
  async handleRegisterUser(whatsappNumber, contact) {
    // Try to register user with backend server
    const user = await this.backendService.getUserData(whatsappNumber);

    if (user) {
      return `Your account is already registered!

💰 On Vault: ${user.vaultBalance} USDC
💰 On Wallet: ${user.walletBalance} USDC
📅 Created on: ${user.createdAt.split('T')[0]}`;
    }
    
    return `To register your account, tap in the link below

${process.env.FRONTEND_URL}/register?whatsappNumber=${whatsappNumber}&username=${contact.pushname}
`;
}

  // *****************************************************
  async handleBalance(whatsappNumber) {
    const user = await this.backendService.getUserData(whatsappNumber);
    if (user.error) { return user.error;}
    return `💰 *User Balance*

💎 On Vault: ${user.vaultBalance} USDC
💎 On Wallet: ${user.walletBalance} USDC

Use /pay, /buy, /sell, /deposit, or /withdraw to manage your USDC!`;
  }

  // *****************************************************
  async handlePayment(text, whatsappNumber) {
    const parts = text.split(' ');
    if  (parts.length !== 3 || Number.isNaN(Number(parts[1]))) {
      return `❌ *Invalid Payment Command*

Usage: /pay <amount> <recipient>
Examples: 
/pay 10 1234567890
/pay 10 Bob
/pay 10 x0123...lk12

Please provide both amount and recipient number, contact name or wallet address.`;
    }
    const recipient = parts.slice(2).join(' ');
    return await this.backendService.sendPayment(whatsappNumber, recipient, parts[1]);
  }

  // *****************************************************
  async handleBuy(text, userId) {
    const parts = text.split(' ');
    if  (parts.length !== 2 || Number.isNaN(Number(parts[1]))) {
      return `❌ *Invalid Buy Command*

Usage: /buy <amount>
Example: /buy 100 

Please provide the amount of USDCyou want to buy.`;
    }
    return await this.backendService.buyAssets(userId, parts[1]);
  }

  // *****************************************************
  async handleSell(text, userId) {
    const parts = text.split(' ');
    if (parts.length !== 2 || Number.isNaN(Number(parts[1])))  {
      return `❌ *Invalid Sell Command*

Usage: /sell <amount>
Example: /sell 100

Please provide the amount you want to sell.`;
    }
    return await this.backendService.sellAssets(userId, parts[1]);
  }

  // *****************************************************
  async handleDeposit(text, userId) {
    const parts = text.split(' ');
    if (parts.length !== 2 || Number.isNaN(Number(parts[1]))) {
      return `❌ *Invalid Deposit Command*

Usage: /deposit <amount>
Example: /deposit 100

Please provide the amount you want to deposit to the vault.`;
    }
    return await this.backendService.deposit(userId, parts[1]);
  }

  // *****************************************************
  async handleWithdraw(text, userId) {
    const parts = text.split(' ');
    if (parts.length !== 2 || Number.isNaN(Number(parts[1]))) {
      return `❌ *Invalid Withdraw Command*

Usage: /withdraw <amount>
Example: /withdraw 100

Please provide the amount you want to withdraw from the vault.`;
    }   
    return await this.backendService.withdraw(userId, parts[1]);
  }

  async getRiskProfileMessage(text, userId) {
    const parts = text.split(' ');
    if (parts.length > 2
      || parts.length === 2 && !['low', 'moderate', 'high'].includes(parts[1].toLowerCase())) {
      return `❌ *Invalid Risk Profile Command*

Usage: /riskprofile <profile>
• Low - Conservative investments
• Moderate - Balanced approach
• High - Aggressive investments
• empty - Returns current risk profile

Please provide the risk profile you want to set.`;
    }
    let profile = '';
    if (parts.length === 2) {
      profile = parts[1];
    }
    return await this.backendService.riskProfile(userId, profile);
  }

  async getAuthProfileMessage(text, userId) {
    const parts = text.split(' ');
    if (parts.length > 2
      || parts.length === 2 && !['low', 'medium', 'high'].includes(parts[1].toLowerCase())) {
      return `❌ *Invalid Authorization Profile Command*

Usage: /authprofile <profile>
• Low - The user is not required to sign autorization for any actions
• Medium - The user can deposit or withdraw assets to their wallet without signing authorization
• High - The user is required to sign autorization for all actions
• empty - Returns current authorization profile

Examples: 
/authprofile Low
/authprofile Medium
/authprofile High
/authprofile 

Please provide the authorization profile you want to set.`;
    }
    let profile = '';
    if (parts.length === 2) {
      profile = parts[1];
    }
    return await this.backendService.authProfile(userId, profile);
  }

  // Parse vCard message and extract fields
  handleVCardMessage(messageBody) {
    try {
      const vCardData = this.parseVCard(messageBody);
      
      // Check if we extracted any meaningful data
      const hasData = vCardData.fn || vCardData.n || vCardData.waid || vCardData.phone;
      
      if (!hasData) {
        return `❌ *Invalid contact information Format*

I couldn't parse the contact information. Please make sure it's a valid contact information format with contact details.`;
      }

      return `📇 *Contact Information Parsed*

👤 *Name:* ${vCardData.fn || 'Not provided'}
📝 *Full Name:* ${vCardData.n || 'Not provided'}
📞 *Phone Number:* ${vCardData.phone || 'Not provided'}

✅ Contact information successfully extracted!
You can use this information for payments or other operations.`;
    } catch (error) {
      console.error('Error parsing vCard:', error);
      return `❌ *vCard Parsing Error*

I encountered an error while parsing the contact information.
Please try sharing the contact again.`;
    }
  }

  // Parse vCard content and extract specific fields
  parseVCard(vCardContent) {
    const lines = vCardContent.split('\n');
    const vCardData = {};

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip empty lines and vCard boundaries
      if (!trimmedLine || trimmedLine === 'begin:vcard' || trimmedLine === 'end:vcard' || trimmedLine.startsWith('version:')) {
        continue;
      }

      // Parse FN (Formatted Name)
      if (trimmedLine.toLowerCase().startsWith('fn:')) {
        vCardData.fn = trimmedLine.substring(3);
      }
      
      // Parse N (Name)
      if (trimmedLine.toLowerCase().startsWith('n:')) {
        vCardData.n = trimmedLine.substring(2);
      }
      
      // Parse TEL with type and waid
      if (trimmedLine.toLowerCase().startsWith('tel;')) {
        // Extract type
        const typeMatch = trimmedLine.match(/type=([^;]+)/);
        if (typeMatch) {
          vCardData.type = typeMatch[1];
        }
        
        // Extract waid
        const waidMatch = trimmedLine.match(/waid=([^:]+)/);
        if (waidMatch) {
          vCardData.waid = waidMatch[1];
        }
        
        // Extract phone number (after the last colon)
        const phoneMatch = trimmedLine.match(/:([^:]+)$/);
        if (phoneMatch) {
          vCardData.phone = phoneMatch[1];
        }
      }
    }
    console.log('vCardData', vCardData);

    return vCardData;
  }

  async handleDisconnect(message, whatsappNumber) {
    try {
      // Check if user is authorized to disconnect
      if (!this.connectionManager.isAuthorized(whatsappNumber)) {
        const client = this.connectionManager.getClient();
        const botInfo = client.info;
        const botNumber = botInfo?.wid?.user;
        const adminNumber = process.env.ADMIN_NUMBER;
        
        return `❌ *Unauthorized Action*

You are not authorized to disconnect this bot.
Only the admin number or the bot number itself can perform this action.

Your number: ${whatsappNumber}
Bot number: ${botNumber}
Admin number: ${adminNumber || 'Not set'}`;
      }
      
      const result = await this.connectionManager.disconnect();
      
      if (result.success) {
        return `🔌 *Bot Disconnected Successfully!*

The WhatsApp bot has been disconnected.
To reconnect, restart the server or scan the QR code again.

Status: Disconnected
Time: ${this.formatTimestamp(new Date().toISOString())}`;
      }
      
      return `❌ *Disconnect Error*

Failed to disconnect the bot. Please try again or contact support.

Error: ${result.error}`;
    } catch (error) {
      console.error('Error disconnecting bot:', error);
      return `❌ *Disconnect Error*

Failed to disconnect the bot. Please try again or contact support.

Error: ${error.message}`;
    }
  }

  getDefaultResponse(messageBody) {
    return `I received your message: "${messageBody}"

But I don't understand what you mean 🙃 

Try these commands:
• /help - Show this help message
• /status - Check bot status
• /info - Get information about this bot
• /session - Check your session status
• /register - Register a new user account
• /balance - Check wallet and vault balances
• /pay <amount> <recipient> - Pay USDC to another user
• /buy <amount> - Buy USDC tokens and send to your wallet
• /sell <amount> - Sell USDC tokens
• /deposit <amount> - Deposit USDC to vault to generate yield
• /withdraw <amount> - Withdraw USDC from vault to your wallet
• /riskprofile <profile> - Change user risk profile
• /authprofile <profile> - Change user auth profile
• /disconnect - Disconnect the bot (authorized users only)

I can also parse contact information when you share contacts! 📇
I will store them so you can pay them later! 💸

Or just say hello! 😊`;
  }

  // Utility function to format UTC timestamps in user's locale
  formatTimestamp(utcTimestamp, options = {}) {
    if (!utcTimestamp) return 'Never';
    
    try {
      const date = new Date(utcTimestamp);
      const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
      };
      
      return date.toLocaleString(undefined, { ...defaultOptions, ...options });
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return 'Invalid Date';
    }
  }

  // Handle session status command
  async handleSessionStatus(whatsappNumber, contact) {
    try {
      const sessionInfo = await this.sessionManager.getSessionInfo(whatsappNumber);
    
      if (!sessionInfo) {
        return "📊 *Session Status*\n\n❌ No active session\n\nYou need to register first with /register";
      }

      if (!sessionInfo.exists) {
        return "📊 *Session Status*\n\n❌ User not registered\n\nYou need to register first with /register";
      }

      const status = sessionInfo.expired ? '🔴 Expired' : '🟢 Active';
      const lastActivity = sessionInfo.lastActivityFormatted || this.formatTimestamp(sessionInfo.lastActivity);
      const expirationTime = sessionInfo.expirationTimeFormatted || this.formatTimestamp(sessionInfo.expirationTime);
      
      if (sessionInfo.expired) {
        const timestamp = new Date();
        this.sessionManager.pendingPinResponses.set(whatsappNumber, { 
          timestamp: timestamp 
        });
        return "📊 *Session Status*\n\n❌ Your *session has expired*. Please enter your PIN to continue.";
      }
      return `📊 *Session Status*

Status: ${status}
Last Activity: ${lastActivity}
Expires At: ${expirationTime}
`;
    } catch (error) {
      console.error('Error getting session status:', error);
      return "📊 *Session Status*\n\n❌ Error retrieving session status\n\nPlease try again or contact support.";
    }
  }
}

module.exports = MessageHandler; 