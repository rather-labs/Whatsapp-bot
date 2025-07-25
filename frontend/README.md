# WhatsApp Bot with Smart Wallet & Blockchain Integration

A comprehensive WhatsApp bot system with blockchain integration, featuring user management, USDC payments, vault deposits, and EVM blockchain transactions.

**Note: This is a Proof of Concept implementation. Some features like on-ramp and off-ramp services are currently disabled.**

## 🏗️ Architecture

The system consists of three main components:

1. **Backend Bot** (`backend-bot/`) - WhatsApp Web client that handles message processing and user interactions. For development, to be replaced by WhatsApp services.
2. **Server** (`server/`) - REST API backend for user management, blockchain operations, and database management
3. **Frontend** (`frontend/`) - Next.js web application providing a user interface for user registration and authorized operations, according to user preferences

```
┌─────────────────┐    HTTP API    ┌──────────────────┐
│   WhatsApp Bot  │◄──────────────►│ Server           │
│   (Port 3001)   │                │   (Port 3002)    │
└─────────────────┘                └──────────────────┘
         │                                   │
         │                                   │
    WhatsApp Web                    ┌────────┴────────┐
         │                          │                 │
    User Messages                   │   Supabase DB   │
                                    │  EVM Blockchain │
                                    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- A smartphone with WhatsApp installed
- Supabase database configured

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

### 3. Start the Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the frontend
npm run dev
```

### 4. Connect WhatsApp

1. Open your browser and go to `http://localhost:3001`
2. Scan the QR code with your WhatsApp mobile app (for QR code WhatsApp login)
3. Wait for the "Connected & Ready" status

## 📱 Bot Commands

### Basic Commands
- `hello` / `hi` / `hey` - Greet the bot
- `/help` - Show all available commands
- `/status` - Check bot connection status
- `/info` - Get bot information
- `/session` - Check your session status

### User Registration & Authentication
- `/register` - Register a new user account (requires PIN via frontend)
- **Session Management**: Automatic PIN prompting when session expires (5-minute inactivity)

### Wallet Commands
- `/balance` - Check your USDC balance (vault + wallet)
- `/pay <amount> <recipient>` - Send USDC to another user or external wallet
- `/deposit <amount>` - Deposit USDC to vault for yield
- `/withdraw <amount>` - Withdraw USDC from vault

### Profile Commands
- `/riskprofile` - View/change risk profile
- `/authprofile` - Check authentication level

### Ramp Commands
- `/buy` - On-ramp services (currently disabled - PoC)
- `/sell` - Off-ramp services (currently disabled - PoC)

### Contact Commands
- Share contacts - Bot automatically parses vCard information

## 🌐 Frontend Features

The frontend provides web-based interfaces for:

### User Registration
- `/register` - Complete user registration with PIN setup
- Blockchain integration for on-chain user registration

### Authorized Operations
- `/actions/transfer` - Authorize USDC transfers
- `/actions/deposit` - Authorize vault deposits
- `/actions/withdraw` - Authorize vault withdrawals
- `/actions/changeAuth` - Modify authentication profile
- `/actions/changeRisk` - Modify risk profile
- `/actions/changeAuthThres` - Set authorization thresholds

### Ramp Services (Currently Disabled)
- `/actions/onramp` - On-ramp interface (shows "unavailable" message)
- `/actions/offramp` - Off-ramp interface (shows "unavailable" message)

## 🔧 Configuration

### Server Environment Variables

Create a `.env` file in the `server/` directory:

```env
# Server Configuration
BACKEND_PORT=3002
JWT_SECRET=your-super-secret

# Blockchain Network
NETWORK=baseSepolia
BASE_SEPOLIA_RPC=https://sepolia.base.org
BASE_MAINNET_RPC=https://mainnet.base.org

# Smart Contracts
USDC_CONTRACT_ADDRESS=0x...
VAULT_CONTRACT_ADDRESS=0x...

# Database
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Frontend Integration
FRONTEND_URL=http://localhost:3000
```

### WhatsApp Bot Environment Variables

Create a `.env` file in the `backend-bot/` directory:

```env
PORT=3001
BACKEND_SERVER_URL=http://localhost:3002
```

### Frontend Environment Variables

Create a `.env.local` file in the `frontend/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:3002
```

## 🌐 API Endpoints

### Server (Port 3002)

#### User Management
- `GET /api/users/check/:whatsapp_number` - Check blockchain registration
- `GET /api/users/data/:whatsapp_number` - Get user data and balances
- `POST /api/users/register` - Register new user with blockchain integration

#### Session Management
- `POST /api/users/session/validate` - Comprehensive session validation with PIN handling
- `GET /api/users/session/status/:whatsapp_number` - Get detailed session status

#### Transfer Operations
- `POST /api/transfers/pay` - Send USDC payment
- `POST /api/transfers/deposit` - Deposit to vault
- `POST /api/transfers/withdraw` - Withdraw from vault

#### Ramp Operations
- `POST /api/ramps/onramp` - Generate on-ramp URLs (PoC - limited functionality)
- `POST /api/ramps/offramp` - Generate off-ramp URLs (PoC - limited functionality)

#### System
- `GET /api/health` - Health check
- Contact management endpoints

### WhatsApp Bot (Port 3001)

#### Bot Control
- `GET /api/status` - Bot status
- `GET /api/health` - Health check
- `POST /api/send-message` - Send message programmatically

## 🔒 Security Features

### Server
- Session management with 5-minute inactivity timeout
- PIN-based authentication for session restoration
- Encrypted PIN storage in Supabase
- Authorization profiles for transaction approval

### WhatsApp Bot
- Secure WhatsApp Web integration
- Simplified session management (delegates to server)
- PIN prompting only when session expires
- Message validation and contact management

## 🔐 Session Management

The system features **centralized session management** with intelligent PIN handling:

### Architecture
- **Server-Centric**: All session logic is centralized in the server component
- **Backend-Bot Simplified**: Only handles PIN prompting locally, delegates all session logic to server
- **Database-Driven**: Session state stored securely in Supabase with `last_activity` tracking

### Authorization Levels
- **High**: Requires frontend authorization for all transactions
- **Medium**: Requires frontend authorization for most transactions
- **Low**: Minimal authorization requirements

## 🏦 Vault System

The vault system allows users to:
- Deposit USDC for yield generation via smart contracts
- Withdraw funds at any time
- Track balances through on-chain queries
- Manage authorization levels for operations

## 🌐 Blockchain Integration

### Supported Networks
- **Base Sepolia** (recommended for testing)
- **Base Mainnet** (for production deployment)

### Features
- Smart contract-based user registration
- USDC vault deposits and withdrawals
- On-chain asset management
- Gasless transactions via relayer pattern

## 📊 Monitoring

### Health Checks
- Server: `http://localhost:3002/api/health`
- WhatsApp bot: `http://localhost:3001/api/health`
- Frontend: `http://localhost:3000`

## 🚀 Production Deployment

### Security Checklist
1. Use strong JWT secrets
2. Secure Supabase configuration
3. Implement proper encryption for private keys
4. Use HTTPS in production
5. Implement proper logging and monitoring
6. Regular security audits

### Environment Setup
1. Configure production Supabase instance
2. Deploy smart contracts to mainnet
3. Set up proper relayer configuration
4. Configure production RPC endpoints

## 🛠️ Development

### Project Structure
```
whatsapp-base-bot-smart-wallet/
├── backend-bot/           # WhatsApp bot server
│   ├── server.js         # Main bot server
│   ├── handlers/
│   │   └── MessageHandler.js  # Message processing
│   ├── services/
│   │   ├── BackendService.js  # Backend API integration
│   │   └── SessionManager.js  # PIN prompting
│   └── package.json      # Bot dependencies
├── server/               # Backend API server
│   ├── src/
│   │   ├── config/       # Database and blockchain config
│   │   ├── routes/       # API route handlers
│   │   ├── services/     # Business logic
│   │   └── utils/        # Utility functions
│   └── package.json      # Server dependencies
├── frontend/             # Next.js web application
│   ├── app/
│   │   ├── actions/      # Authorization pages
│   │   ├── components/   # React components
│   │   └── register/     # Registration page
│   └── next.config.ts    # Next.js configuration
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

# Terminal 3 - Frontend
cd frontend
npm run dev
```

## ⚠️ Current Limitations

### Proof of Concept Status
- **On-ramp services**: Currently disabled and show warning messages
- **Off-ramp services**: Currently disabled and show warning messages
- **Limited testing**: Primarily configured for Base Sepolia testnet

### Known Issues
- On-ramp integration requires external service setup
- Off-ramp integration requires compliance and KYC setup
- Some advanced features may require additional configuration

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

## 🔮 Future Enhancements

- [ ] Migration to WhatsApp Business API
- [ ] Complete on-ramp/off-ramp integration
- [ ] Add security features to server and frontend
- [ ] Multi-language support
- [ ] Integration with more blockchain networks
- [ ] Advanced trading features
