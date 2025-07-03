# WhatsApp Bot with Smart Wallet

A WhatsApp bot built with Node.js and whatsapp-web.js that includes wallet functionality for token management and contact handling. Built with a clean, modular architecture for maintainability and scalability.

## Features

### 🤖 Core Bot Features
- Real-time WhatsApp messaging
- Command-based interaction system
- Status monitoring and health checks
- WebSocket support for real-time updates
- Contact management and reading
- Modular architecture with separation of concerns

### 💰 Wallet Commands
- `/create` - Create a new wallet with 1,000 initial USDC
- `/balance` - Check your current wallet balance and transaction history
- `/pay <amount> <recipient>` - Send USDC to another user
- `/buy <amount>` - Purchase USDC tokens (simulated)
- `/sell <amount>` - Sell USDC tokens (simulated)
- `/deposit <amount>` - Deposit USDC to vault for yield generation
- `/withdraw <amount>` - Withdraw USDC from vault

### 📱 Contact Features
- Automatically parse contact information from shared contacts
- Contact change detection and logging
- Contact information extraction (name, phone type, WhatsApp ID)

### 🔧 Technical Features
- Express.js REST API
- Socket.IO for real-time communication
- QR code authentication
- Persistent session management
- Graceful shutdown handling
- Modular service architecture

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file:
   ```env
   PORT=3001
   BLOCKCHAIN_SERVER_URL=http://localhost:3002
   ALLOWED_BOT_NUMBER=your_bot_number
   ADMIN_NUMBER=your_admin_number
   ```
4. Start the bot:
   ```bash
   npm start
   ```

## Usage

### Starting the Bot
```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start

# Using the startup script
./start.sh
```

### Bot Commands

#### Basic Commands
- `hello` / `hi` / `hey` - Greet the bot
- `/help` - Show all available commands
- `/status` - Check bot connection status
- `/info` - Get bot information

#### Wallet Commands
- `/create` - Initialize your wallet
- `/balance` - Check your USDC balance
- `/pay 100 1234567890` - Send 100 USDC to user 1234567890
- `/buy 50` - Purchase 50 USDC
- `/sell 25` - Sell 25 USDC
- `/deposit 200` - Deposit 200 USDC to vault
- `/withdraw 100` - Withdraw 100 USDC from vault

#### Profile Commands
- `/riskprofile` - View risk profile settings
- `/authprofile` - View authentication profile

#### Contact Features
- Share contacts - Automatically parse contact information

#### Admin Commands
- `/disconnect` - Disconnect the bot (admin only)

### API Endpoints

- `GET /api/status` - Get bot status
- `GET /api/health` - Health check with wallet info
- `GET /api/wallets` - Get all active wallets
- `POST /api/send-message` - Send message programmatically
- `POST /api/disconnect` - Disconnect bot (requires authorization)
- `POST /api/regenerate-qr` - Regenerate QR code
- `POST /api/clear-session` - Clear session and force re-authentication

## Architecture

### Modular Design
The bot is built with a clean, modular architecture:

#### Services Layer (`/services/`)
- **ConnectionManager.js** - WhatsApp client connection/disconnection logic
- **WalletService.js** - Wallet operations
- **BlockchainService.js** - Blockchain integration

#### Handlers Layer (`/handlers/`)
- **MessageHandler.js** - Message processing and command handling

#### Routes Layer (`/routes/`)
- **ApiRoutes.js** - API endpoints and routes

### Wallet System
The bot includes a simulated wallet system that:
- Automatically creates wallets for new users
- Tracks balances and transaction history
- Supports peer-to-peer transfers
- Simulates buy/sell operations
- Includes vault functionality for yield generation

### Contact Management
- Reads and displays user contacts
- Handles contact change events
- Provides contact information for transfers

### Message Handling
- Processes incoming WhatsApp messages
- Validates command syntax
- Provides helpful error messages
- Supports natural language responses

## Development

### Project Structure
```
backend-bot/
├── services/
│   ├── ConnectionManager.js    # WhatsApp client management
│   ├── WalletService.js        # Wallet operations
│   └── BlockchainService.js    # Blockchain integration
├── handlers/
│   └── MessageHandler.js       # Message processing
├── routes/
│   └── ApiRoutes.js           # API endpoints
├── server.js                  # Main server file
├── package.json               # Dependencies
├── start.sh                   # Startup script
└── public/                    # Static files
```

### Key Dependencies
- `whatsapp-web.js` - WhatsApp Web API client
- `express` - Web server framework
- `socket.io` - Real-time communication
- `qrcode` - QR code generation
- `puppeteer` - Browser automation
- `axios` - HTTP client for blockchain integration

### Development Benefits
- **Separation of Concerns**: Each component has a single responsibility
- **Dependency Injection**: Services are injected where needed
- **Testability**: Each module can be tested independently
- **Maintainability**: Easy to modify or extend individual components
- **Scalability**: Simple to add new features

## Security Notes

⚠️ **Important**: This is a development/demo bot. For production use:
- Implement proper authentication and authorization
- Add rate limiting and input validation
- Use secure storage for wallet data
- Implement proper error handling
- Add logging and monitoring
- Secure blockchain integration

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions, please check the GitHub repository or create an issue. 