class MessageHandler {
  constructor(connectionManager, walletService, blockchainService) {
    this.connectionManager = connectionManager;
    this.walletService = walletService;
    this.blockchainService = blockchainService;
  }

  // Main message processing function
  async handleMessage(message) {
    const text = message.body.toLowerCase().trim();
    const contact = await message.getContact();
    const userId = message.from;
    const whatsappNumber = userId.replace('@c.us', '');
    
    // Initialize wallet for user
    this.walletService.initializeWallet(userId);
    
    console.log('message', message);

    // Check if message is a vCard
    if (message.type === 'vcard') {
      return this.handleVCardMessage(message.body);
    }
    
    // Handle different commands
    const response = await this.processCommand(text, message, contact, userId, whatsappNumber);
    return response;
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
    
    // Wallet commands
    if (text === '/create') {
      return await this.handleCreateWallet(whatsappNumber, contact, userId);
    }
    
    if (text === '/balance') {
      return this.handleBalance(userId);
    }
    
    if (text.startsWith('/pay')) {
      return await this.handlePayment(text, userId, whatsappNumber);
    }
    
    if (text.startsWith('/buy')) {
      return this.handleBuy(text, userId);
    }
    
    if (text.startsWith('/sell')) {
      return this.handleSell(text, userId);
    }
    
    if (text.startsWith('/deposit')) {
      return this.handleDeposit(text, userId);
    }
    
    if (text.startsWith('/withdraw')) {
      return this.handleWithdraw(text, userId);
    }
    
    // Profile commands
    if (text === '/riskprofile') {
      return this.getRiskProfileMessage();
    }
    
    if (text === '/authprofile') {
      return this.getAuthProfileMessage();
    }
    
    // Admin commands
    if (text === '/disconnect') {
      return await this.handleDisconnect(message, whatsappNumber);
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
- /disconnect - Disconnect the bot (authorized users only)

I can also parse vCard contact information when you share contacts! 📇`;
  }

  getHelpMessage() {
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

*Admin Commands:*
• /disconnect - Disconnect the bot (admin or bot number only)

*Contact Features:*
• Share contacts - I can parse vCard information automatically

*Examples:*
• /pay 100 1234567890
• /buy 50
• /sell 25
• /deposit 200

Need help? Just type /help anytime!`;
  }

  getStatusMessage() {
    const botState = this.connectionManager.getBotState();
    return `📊 *Bot Status*

🟢 Status: ${botState.status}
✅ Ready: ${botState.isReady ? 'Yes' : 'No'}
📱 Connected: ${botState.isReady ? 'Yes' : 'No'}
💰 Wallet Active: Yes
🔗 Blockchain Server: ${this.blockchainService.getServerUrl()}

The bot is currently ${botState.isReady ? 'online and ready to help!' : 'connecting...'}`;
  }

  getInfoMessage() {
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

  async handleCreateWallet(whatsappNumber, contact, userId) {
    // Try to register user with blockchain server
    const registration = await this.blockchainService.registerUser(whatsappNumber, contact.pushname);
    const wallet = this.walletService.getWallet(userId);
    
    return `✅ *Wallet Created Successfully!*

💰 Initial Balance: 1,000 USDC
📅 Created: ${wallet.createdAt}
🆔 Wallet ID: ${userId.slice(0, 8)}...
🔗 Blockchain: ${registration ? 'Connected' : 'Local Only'}

Your wallet is now ready for transactions!
Use /balance to check your balance or /help for more commands.`;
  }

  handleBalance(userId) {
    const wallet = this.walletService.getWallet(userId);
    return `💰 *Wallet Balance*

💎 Current Balance: ${wallet.balance} USDC
📊 Total Transactions: ${wallet.transactions.length}
📅 Last Activity: ${wallet.transactions.length > 0 ? wallet.transactions[wallet.transactions.length - 1].timestamp : 'No transactions yet'}

Use /pay, /buy, /sell, /deposit, or /withdraw to manage your USDC!`;
  }

  async handlePayment(text, userId, whatsappNumber) {
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
    
    if (!this.walletService.hasSufficientBalance(userId, amount)) {
      const balance = this.walletService.getBalance(userId);
      return `❌ *Insufficient Balance*

Your balance: ${balance} USDC
Payment amount: ${amount} USDC

You don't have enough USDC for this payment.`;
    }
    
    try {
      // Transfer funds
      this.walletService.transferFunds(userId, recipient, amount);
      const newBalance = this.walletService.getBalance(userId);
      
      return `✅ *Payment Successful!*

💸 Sent: ${amount} USDC
👤 To: ${recipient}
💰 New Balance: ${newBalance} USDC
📅 Time: ${new Date().toLocaleString()}

The payment has been completed successfully!`;
    } catch (error) {
      return `❌ *Payment Failed*

Error: ${error.message}`;
    }
  }

  handleBuy(text, userId) {
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
    
    try {
      this.walletService.addFunds(userId, amount, 'buy');
      const newBalance = this.walletService.getBalance(userId);
      
      return `✅ *Purchase Successful!*

🛒 Bought: ${amount} USDC
💰 New Balance: ${newBalance} USDC
📅 Time: ${new Date().toLocaleString()}

Your USDC has been added to your wallet!`;
    } catch (error) {
      return `❌ *Purchase Failed*

Error: ${error.message}`;
    }
  }

  handleSell(text, userId) {
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
    
    if (!this.walletService.hasSufficientBalance(userId, amount)) {
      const balance = this.walletService.getBalance(userId);
      return `❌ *Insufficient Balance*

Your balance: ${balance} USDC
Sell amount: ${amount} USDC

You don't have enough USDC to sell.`;
    }
    
    try {
      this.walletService.removeFunds(userId, amount, 'sell');
      const newBalance = this.walletService.getBalance(userId);
      
      return `✅ *Sale Successful!*

💸 Sold: ${amount} USDC
💰 New Balance: ${newBalance} USDC
📅 Time: ${new Date().toLocaleString()}

Your USDC has been sold successfully!`;
    } catch (error) {
      return `❌ *Sale Failed*

Error: ${error.message}`;
    }
  }

  handleDeposit(text, userId) {
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
    
    if (!this.walletService.hasSufficientBalance(userId, amount)) {
      const balance = this.walletService.getBalance(userId);
      return `❌ *Insufficient Balance*

Your balance: ${balance} USDC
Deposit amount: ${amount} USDC

You don't have enough USDC to deposit.`;
    }
    
    try {
      this.walletService.removeFunds(userId, amount, 'vault_deposit');
      const newBalance = this.walletService.getBalance(userId);
      
      return `✅ *Vault Deposit Successful!*

🏦 Deposited: ${amount} USDC
💰 New Balance: ${newBalance} USDC
📈 APY: 5%
📅 Time: ${new Date().toLocaleString()}

Your USDC is now earning yield in the vault!`;
    } catch (error) {
      return `❌ *Deposit Failed*

Error: ${error.message}`;
    }
  }

  handleWithdraw(text, userId) {
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
    
    try {
      this.walletService.addFunds(userId, amount, 'vault_withdraw');
      const newBalance = this.walletService.getBalance(userId);
      
      return `✅ *Vault Withdrawal Successful!*

🏦 Withdrawn: ${amount} USDC
💰 New Balance: ${newBalance} USDC
📅 Time: ${new Date().toLocaleString()}

Your USDC has been withdrawn from the vault!`;
    } catch (error) {
      return `❌ *Withdrawal Failed*

Error: ${error.message}`;
    }
  }

  getRiskProfileMessage() {
    return `🎯 *Risk Profile Management*

Your current risk profile: Moderate

Available profiles:
• Low - Conservative investments
• Moderate - Balanced approach
• High - Aggressive investments

To change your risk profile, contact support or use the web interface.

This affects your vault investment strategy and yield generation.`;
  }

  getAuthProfileMessage() {
    return `🔐 *Authentication Profile*

Your current auth level: Basic

Available levels:
• Basic - Standard security
• Enhanced - 2FA enabled
• Premium - Advanced security features

To upgrade your auth profile, contact support or use the web interface.

This affects your transaction limits and security features.`;
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
Time: ${new Date().toLocaleString()}`;
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

I can also parse contact information when you share contacts! 📇

Or just say hello! 😊`;
  }
}

module.exports = MessageHandler; 