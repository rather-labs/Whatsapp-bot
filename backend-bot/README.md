# WhatsApp Bot with Smart Wallet

A WhatsApp bot built with Node.js and whatsapp-web.js that includes wallet functionality for token management and contact handling. Built with a clean, modular architecture for maintainability and scalability.

**Note: This backend bot is for development purposes and will be replaced by WhatsApp Business API services for production deployment.**

## Features

### 🤖 Core Bot Features
- WhatsApp Web integration using `whatsapp-web.js`
- Command-based interaction system
- Real-time QR code authentication and status monitoring
- Contact management and vCard parsing
- Session management with PIN authentication
- JWT-secured server communication
- Modular architecture with separation of concerns

### 💰 User Commands
- `/register` - Register a new user account with blockchain integration
- `/balance` - Check your current USDC balance (vault + wallet)
- `/pay <amount> <recipient>` - Send USDC to another user or external wallet
- `/deposit <amount>` - Deposit USDC to vault for yield generation
- `/withdraw <amount>` - Withdraw USDC from vault

### 📱 Contact Features
- Automatically parse contact information from shared vCards
- Contact name resolution for transfers
- Integration with contact database for wallet addresses

### 🔧 Technical Features
- Express.js REST API with Socket.IO
- **Simplified session management** (delegates to server)
- Real-time status updates and QR code display
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
   BACKEND_SERVER_URL=http://localhost:3002
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
- `/session` - Check your current session status

#### User Commands
- `/register` - Register your account (redirects to frontend)
- `/balance` - Check your USDC balance (vault + wallet)
- `/pay 100 1234567890` - Send 100 USDC to user 1234567890
- `/pay 50 John` - Send 50 USDC to contact named "John"
- `/deposit 200` - Deposit 200 USDC to vault
- `/withdraw 100` - Withdraw 100 USDC from vault

#### Profile Commands
- `/riskprofile` - View/change risk profile settings
- `/authprofile` - View authentication profile

#### Ramp Commands (Currently Limited)
- `/buy` - On-ramp services (redirects to frontend - PoC limited)
- `/sell` - Off-ramp services (redirects to frontend - PoC limited)

#### Contact Features
- Share contacts - Automatically parse contact information
- Contact names can be used as transfer recipients

#### Admin Commands
- `/disconnect` - Disconnect the bot (admin only)

### API Endpoints

- `GET /api/status` - Get bot connection status
- `GET /api/health` - Health check endpoint
- `GET /api/users` - Get all active users
- `POST /api/send-message` - Send message programmatically
- `POST /api/disconnect` - Disconnect bot (requires authorization)
- `POST /api/regenerate-qr` - Regenerate QR code
- `POST /api/clear-session` - Clear WhatsApp session

## Architecture

### Modular Design
The bot is built with a clean, modular architecture:

#### Services Layer (`/services/`)
- **ConnectionManager.js** - WhatsApp client connection/disconnection logic
- **BackendService.js** - Backend API integration and user operations
- **SessionManager.js** - PIN prompting and session validation (delegates to server)

#### Handlers Layer (`/handlers/`)
- **MessageHandler.js** - Message processing and command handling

#### Routes Layer (`/routes/`)
- **ApiRoutes.js** - API endpoints and routes

### User System
The bot includes a user system that:
- Registers users on blockchain via server API
- **Delegates session management to server**
- Tracks balances through blockchain queries
- Supports peer-to-peer transfers with contact resolution
- Includes vault functionality for yield generation
- Handles authorization levels for different operations

### Contact Management
- Parses shared vCard contacts automatically
- Stores contact information via server API
- Resolves contact names to WhatsApp numbers or wallet addresses
- Provides contact-based transfer functionality

### Message Handling
- Processes incoming WhatsApp messages
- Validates command syntax and parameters
- Provides helpful error messages
- Supports natural language greetings

## Session Management

The bot has been refactored to use **centralized session management**:

### Architecture
- **Server-Centric**: All session logic is handled by the server component
- **Simplified Bot**: Backend-bot only handles PIN prompting locally
- **Enhanced Security**: PIN validation and storage happens on the server

### How It Works
1. **Session Validation**: Bot queries server for session status before commands
2. **PIN Prompting**: Only prompts for PIN when session expires (5-minute timeout)
3. **Server Validation**: PIN is validated by server using encrypted storage
4. **Activity Updates**: Server tracks all user activity automatically

### Benefits
- **Better Security**: PIN validation centralized on server with encryption
- **Reduced Complexity**: Less local state to manage in the bot
- **Improved Scalability**: Server can handle multiple bot instances
- **Memory Efficiency**: Reduced memory usage in bot

## Current Implementation Status

### Fully Implemented Features
- ✅ User registration with blockchain integration
- ✅ Balance checking (vault + wallet)
- ✅ USDC transfers between users
- ✅ Vault deposits and withdrawals
- ✅ Contact management and resolution
- ✅ Session management with PIN authentication
- ✅ Authorization profiles and requirements

### Limited/PoC Features
- ⚠️ On-ramp services (redirects to frontend with limitations)
- ⚠️ Off-ramp services (redirects to frontend with limitations)
- ⚠️ External wallet transfers (requires contact wallet setup)

### Development Features
- 🔧 Real-time QR code display
- 🔧 WebSocket status updates
- 🔧 Admin commands for bot management

## Development

### Project Structure
```
backend-bot/
├── services/
│   ├── ConnectionManager.js    # WhatsApp client management
│   ├── BackendService.js       # Server API integration
│   └── SessionManager.js       # PIN prompting (delegates to server)
├── handlers/
│   └── MessageHandler.js       # Message processing and commands
├── routes/
│   └── ApiRoutes.js           # REST API endpoints
├── utils/
│   ├── contact.js             # vCard parsing utilities
│   └── utils.js               # General utilities
├── server.js                  # Main server file
├── package.json               # Dependencies
├── start.sh                   # Startup script
└── public/                    # Static files for QR display
```

### Key Dependencies
- `whatsapp-web.js` - WhatsApp Web API client
- `express` - Web server framework
- `socket.io` - Real-time communication for status updates
- `qrcode` - QR code generation for authentication
- `puppeteer` - Browser automation (required by whatsapp-web.js)
- `axios` - HTTP client for backend integration

### Development Benefits
- **Separation of Concerns**: Each component has a single responsibility
- **Dependency Injection**: Services are injected where needed
- **Testability**: Each module can be tested independently
- **Maintainability**: Easy to modify or extend individual components
- **Scalability**: Simple to add new features and commands
- **Centralized Session Management**: Session logic delegated to server for better security

## Security Notes

⚠️ **Important**: This is a development/demo bot. For production use:
- Migrate to WhatsApp Business API
- Implement proper authentication and authorization
- Add rate limiting and input validation
- Use secure storage for sensitive data
- Implement proper error handling and logging
- Add comprehensive monitoring
- Secure backend integration with proper API keys

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions, please check the GitHub repository or create an issue. 