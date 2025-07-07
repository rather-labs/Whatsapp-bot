# WhatsApp Bot with Smart Wallet & Blockchain Integration

A comprehensive WhatsApp bot system with blockchain integration, featuring user management, USDC payments, vault deposits, and EVM blockchain transactions.

## 🏗️ Architecture

The system consists of two main components:

1. **WhatsApp Bot Server** (`backend-bot/`) - Handles WhatsApp messaging and user interactions - To be replaced by Whatsapp Business API for production deployment.
2. **Server** (`server/`) - Manages user data, wallets, and blockchain integration

```
┌─────────────────┐    HTTP API    ┌──────────────────┐
│   WhatsApp Bot  │◄──────────────►│ Server│
│   (Port 3001)   │                │   (Port 3002)    │
└─────────────────┘                └──────────────────┘
         │                                   │
         │                                   │
    WhatsApp Web                    ┌────────┴────────┐
         │                          │                 │
    User Messages                   │   SQLite DB     │
                                    │  EVM Blockchain │
                                    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- A smartphone with WhatsApp installed

### 1. Start the Server

```bash
cd server

# Install dependencies
npm install

# Set up environment
cp env.example .env
# Edit .env with your configuration

# Start the server
npm start
```

### 2. Start the WhatsApp Bot

```bash
cd backend-bot

# Install dependencies
npm install

# Start the bot
npm start
```

### 3. Connect WhatsApp

1. Open your browser and go to `http://localhost:3001`
2. Scan the QR code with your WhatsApp mobile app
3. Wait for the "Connected & Ready" status

## 📱 Bot Commands

### Basic Commands
- `hello` / `hi` / `hey` - Greet the bot
- `/help` - Show all available commands
- `/status` - Check bot connection status
- `/info` - Get bot information
- `/session` - Check your session status

### User Registration & Authentication
- `/register` - Register a new user account (requires PIN)
- **Session Management**: Automatic PIN prompting when session expires (5-minute inactivity)

### Wallet Commands
- `/balance` - Check your USDC balance
- `/pay <amount> <recipient>` - Send USDC to another user
- `/buy <amount>` - Buy USDC tokens
- `/sell <amount>` - Sell USDC tokens

### Vault Commands
- `/deposit <amount>` - Deposit USDC to vault for yield
- `/withdraw <amount>` - Withdraw USDC from vault

### Profile Commands
- `/riskprofile` - View/change risk profile
- `/authprofile` - Check authentication level

### Contact Commands
- Share contacts - Bot automatically parses vCard information

## 🔧 Configuration

### Server Environment Variables

Create a `.env` file in the `server/` directory:

```env
# Server Configuration
BACKEND_PORT=3002
JWT_SECRET=your-super-secret-jwt-key

# Blockchain Network
NETWORK=sepolia
BASE_SEPOLIA_RPC=https://base-sepolia.infura.io/v3/YOUR_PROJECT_ID
BASE_MAINNET_RPC=https://base-rpc.com

# USDC Contract
USDC_CONTRACT_ADDRESS=0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238

# WhatsApp Bot Integration
WHATSAPP_BOT_URL=http://localhost:3001
```

### WhatsApp Bot Environment Variables

Create a `.env` file in the `backend-bot/` directory:

```env
PORT=3001
BACKEND_SERVER_URL=http://localhost:3002
```

### Frontend Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3002
```

## 🌐 API Endpoints

### Server (Port 3002)

#### Authentication & Session Management
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - User login
- `GET /api/users/profile` - Get user profile
- `POST /api/users/session/validate` - Comprehensive session validation with PIN handling
- `GET /api/users/session/status/:whatsapp_number` - Get detailed session status
- `POST /api/users/session/update` - Update user activity (legacy)

#### Wallet Operations
- `GET /api/wallet/balance` - Get wallet balance
- `POST /api/wallet/pay` - Send USDC payment
- `POST /api/wallet/buy` - Buy USDC
- `POST /api/wallet/sell` - Sell USDC

#### Vault Operations
- `POST /api/vault/deposit` - Deposit to vault
- `POST /api/vault/withdraw` - Withdraw from vault
- `GET /api/vault/deposits` - Get vault deposits

#### System
- `GET /api/health` - Health check
- `GET /api/transactions` - Transaction history

### WhatsApp Bot (Port 3001)

#### Bot Control
- `GET /api/status` - Bot status
- `GET /api/health` - Health check
- `POST /api/send-message` - Send message programmatically
- `GET /api/wallets` - Local wallet data

## 💾 Database Schema

The server uses SQLite with the following tables:

- **users** - User accounts and profiles (includes `last_activity` for session management)
- **wallets** - Wallet addresses and balances
- **transactions** - Transaction history
- **vault_deposits** - Vault deposit records

## 🔒 Security Features

### Server
- JWT-based authentication
- Session management with 5-minute inactivity timeout
- PIN-based authentication for session restoration
- Password hashing with bcrypt
- Rate limiting
- Helmet security headers
- Encrypted private key storage
- Input validation

### WhatsApp Bot
- Secure WhatsApp Web integration
- Simplified session management (delegates to server)
- PIN prompting only when session expires
- Message validation
- Error handling
- Contact management

## 🔐 Session Management

The system features **centralized session management** with intelligent PIN handling that enhances security while improving user experience:

### Architecture
- **Server-Centric**: All session logic is centralized in the server component
- **Backend-Bot Simplified**: Only handles PIN prompting locally, delegates all session logic to server
- **Database-Driven**: Session state stored securely in database with `last_activity` tracking

### How It Works
1. **Centralized Session Tracking**: Server manages all session state and activity
2. **5-Minute Inactivity Timeout**: Sessions expire after 5 minutes of no activity
3. **Smart PIN Prompting**: Users are only prompted for PIN when session expires
4. **Seamless Restoration**: Correct PIN immediately restores the session via server validation

### User Experience
- **No Constant PIN Entry**: Users don't need to enter PIN for every command
- **Automatic Activity Updates**: Any message or command resets the session timer
- **Clear Session Status**: Use `/session` command to check current session status
- **Graceful Expiration**: Clear messaging when session expires

### Security Benefits
- **Reduced PIN Exposure**: PIN is only entered when necessary
- **Centralized Security**: All PIN validation happens on the server
- **Automatic Logout**: Sessions expire automatically for security
- **Activity Tracking**: Database stores last activity timestamps
- **Token Management**: Automatic token refresh and cleanup

### Technical Implementation
- **Server Endpoints**: `/api/users/session/validate` and `/api/users/session/status/:whatsapp_number`
- **BackendService**: Simplified to only query server for session status
- **SessionManager**: Streamlined to handle only PIN prompting locally
- **Database Integration**: `last_activity` column tracks user activity
- **Automatic Integration**: All commands automatically update session activity

## 🏦 Vault System

The vault system allows users to:
- Deposit USDC for yield generation
- Earn 5% APY on deposits
- Withdraw funds at any time
- Track deposit history

## 🌐 Blockchain Integration

### Supported Networks
- **Base Sepolia Testnet** (default for development)
- **Base Mainnet** (production)

### Features
- USDC token transfers
- On-chain transaction execution
- Gas estimation and management
- Multi-network support
- Transaction history tracking

## 📊 Monitoring

### Health Checks
- Server: `http://localhost:3002/api/health`
- WhatsApp bot: `http://localhost:3001/api/health`

### Web Dashboard
- WhatsApp bot dashboard: `http://localhost:3001`
- Real-time status monitoring
- QR code display for authentication

## 🚀 Production Deployment

### Security Checklist
1. Use strong JWT secrets
2. Implement proper encryption for private keys
3. Add rate limiting and DDoS protection
4. Use HTTPS in production
5. Implement proper logging and monitoring
6. Regular security audits

### Environment Setup
1. Configure production backend RPC endpoints
2. Set up proper database backups
3. Implement monitoring and alerting
4. Use environment-specific configurations

## 🛠️ Development

### Project Structure
```
whatsapp-base-bot-smart-wallet/
├── backend-bot/           # WhatsApp bot server
│   ├── server.js         # Main bot server
│   ├── handlers/
│   │   └── MessageHandler.js  # Message processing with simplified session handling
│   ├── services/
│   │   ├── BackendService.js  # Backend API integration (simplified session management)
│   │   └── SessionManager.js  # PIN prompting only (delegates session logic to server)
│   ├── package.json      # Bot dependencies
│   └── README.md         # Bot documentation
├── server/               # Server (centralized session management)
│   ├── server.js         # Main server with enhanced session endpoints
│   ├── package.json      # Server dependencies
│   ├── env.example       # Environment template
│   └── README.md         # Server documentation
├── app/                  # Frontend (if applicable)
└── README.md            # This file
```

### Running in Development
```bash
# Terminal 1 - Server
cd server
npm run dev

# Terminal 2 - WhatsApp Bot
cd backend-bot
npm run dev
```

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 🆘 Support

For issues and questions:
1. Check the troubleshooting sections in individual README files
2. Review server logs for error messages
3. Ensure all dependencies are properly installed
4. Verify environment configuration
5. Create an issue on GitHub

### Session Management Troubleshooting

**Session not expiring:**
- Check if `last_activity` column exists in database
- Verify server is running and accessible
- Check network connectivity between bot and server

**PIN not working:**
- Ensure PIN format is 4-6 digits
- Verify user is registered in the system
- Check server logs for authentication errors

**Activity not updating:**
- Verify API endpoints are accessible
- Check server logs for session update errors
- Ensure bot has proper permissions

**Session status unclear:**
- Use `/session` command to check current status
- Check server logs for session operations
- Verify database connection is working

## 🔄 Recent Updates

### Session Management Refactoring (Latest)
- ✅ **Centralized Session Management**: All session logic moved to server component
- ✅ **Simplified Backend-Bot**: Removed local session state, only handles PIN prompting
- ✅ **Enhanced Server APIs**: New `/api/users/session/validate` and `/api/users/session/status/:whatsapp_number` endpoints
- ✅ **Improved Security**: PIN validation centralized on server
- ✅ **Better Scalability**: Server can handle multiple bot instances
- ✅ **Reduced Memory Usage**: Less local state to maintain in backend-bot

### Security Improvements
- ✅ **Reduced PIN Exposure**: PIN only entered when necessary
- ✅ **Automatic Session Cleanup**: Expired sessions are properly handled
- ✅ **Activity Tracking**: Database stores user activity timestamps
- ✅ **Graceful Error Handling**: Clear messaging for session issues

## 🔮 Future Enhancements

- [ ] Multi-token support (ETH, MATIC, etc.)
- [ ] Advanced vault strategies
- [ ] Mobile app integration
- [ ] Web dashboard for wallet management
- [ ] DeFi protocol integrations
- [ ] Cross-chain transactions
- [ ] Advanced security features (2FA, hardware wallets)
- [ ] Analytics and reporting
- [ ] Configurable session timeouts per user
- [ ] Session history and analytics
