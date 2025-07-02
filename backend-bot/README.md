# WhatsApp Bot with Smart Wallet

A WhatsApp bot built with Node.js and whatsapp-web.js that includes wallet functionality for token management and contact handling.

## Features

### 🤖 Core Bot Features
- Real-time WhatsApp messaging
- Command-based interaction system
- Status monitoring and health checks
- WebSocket support for real-time updates
- Contact management and reading

### 💰 Wallet Commands
- `/create` - Create a new wallet with 1,000 initial tokens
- `/balance` - Check your current wallet balance and transaction history
- `/transfer <amount> <recipient>` - Send tokens to another user
- `/buy <amount>` - Purchase tokens (simulated)
- `/sell <amount>` - Sell tokens (simulated)

### 📱 Contact Features
- `/contacts` - View your WhatsApp contacts
- Contact change detection and logging
- Contact information retrieval

### 🔧 Technical Features
- Express.js REST API
- Socket.IO for real-time communication
- QR code authentication
- Persistent session management
- Graceful shutdown handling

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file (optional):
   ```
   PORT=3001
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
```

### Bot Commands

#### Basic Commands
- `hello` / `hi` / `hey` - Greet the bot
- `/help` - Show all available commands
- `/status` - Check bot connection status
- `/info` - Get bot information

#### Wallet Commands
- `/create` - Initialize your wallet
- `/balance` - Check your token balance
- `/transfer 100 1234567890` - Send 100 tokens to user 1234567890
- `/buy 50` - Purchase 50 tokens
- `/sell 25` - Sell 25 tokens

#### Contact Commands
- `/contacts` - View your WhatsApp contacts

### API Endpoints

- `GET /api/status` - Get bot status
- `GET /api/health` - Health check with wallet info
- `GET /api/wallets` - Get all active wallets
- `POST /api/send-message` - Send message programmatically

## Architecture

### Wallet System
The bot includes a simulated wallet system that:
- Automatically creates wallets for new users
- Tracks balances and transaction history
- Supports peer-to-peer transfers
- Simulates buy/sell operations

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
├── server.js          # Main bot server
├── package.json       # Dependencies
├── start.sh          # Startup script
└── public/           # Static files
```

### Key Dependencies
- `whatsapp-web.js` - WhatsApp Web API client
- `express` - Web server framework
- `socket.io` - Real-time communication
- `qrcode` - QR code generation
- `puppeteer` - Browser automation

## Security Notes

⚠️ **Important**: This is a development/demo bot. For production use:
- Implement proper authentication and authorization
- Add rate limiting and input validation
- Use secure storage for wallet data
- Implement proper error handling
- Add logging and monitoring

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions, please check the GitHub repository or create an issue. 