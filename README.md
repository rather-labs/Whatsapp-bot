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

### Wallet Commands
- `/create` - Create a new wallet
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
- `/contacts` - View your WhatsApp contacts

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

#### Authentication
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - User login
- `GET /api/users/profile` - Get user profile

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

- **users** - User accounts and profiles
- **wallets** - Wallet addresses and balances
- **transactions** - Transaction history
- **vault_deposits** - Vault deposit records

## 🔒 Security Features

### Server
- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting
- Helmet security headers
- Encrypted private key storage
- Input validation

### WhatsApp Bot
- Secure WhatsApp Web integration
- Message validation
- Error handling
- Contact management

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
│   ├── package.json      # Bot dependencies
│   └── README.md         # Bot documentation
├── server/               # Server
│   ├── server.js         # Main server
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

## 🔮 Future Enhancements

- [ ] Multi-token support (ETH, MATIC, etc.)
- [ ] Advanced vault strategies
- [ ] Mobile app integration
- [ ] Web dashboard for wallet management
- [ ] DeFi protocol integrations
- [ ] Cross-chain transactions
- [ ] Advanced security features (2FA, hardware wallets)
- [ ] Analytics and reporting
