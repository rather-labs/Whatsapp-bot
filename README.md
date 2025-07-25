# WhatsApp Bot Smart Wallet

A comprehensive WhatsApp bot system with integrated smart wallet functionality, built with a modular architecture for secure and user-friendly blockchain interactions.

## 🏗️ Architecture Overview

This project consists of three main components:

- **Backend Bot** - WhatsApp Web client that handles message processing and user interactions. For developement, to be replaced by whatsapp services.
- **Server** - REST API backend for user management, blockchain operations, and database management
- **Frontend** - Next.js web application providing a user interface for user registration and authorized operations, according to user preferences

## ✨ Features

### WhatsApp Bot Features
- 📱 WhatsApp Web integration using `whatsapp-web.js`
- 💬 Interactive message handling and command processing
- 🤖 Automated session management

### Smart Wallet Features
- 💰 **Deposit & Withdraw** - Secure fund management
- 💸 **Transfer** - Send funds to other users
- 🔄 **On-ramp/Off-ramp** - Convert between fiat and crypto
- 🛡️ **Risk Management** - Configurable risk profiles
- 🔐 **Authentication** - Multi-factor authentication profiles and thresholds
- 📈 **Transaction History** - Complete audit trail
- 💳 **USDC Integration** - Stablecoin operations on Base network

### Blockchain Integration
- ⛓️ **Base Network Support** - Sepolia testnet and mainnet
- 🏦 **Smart Contracts** - Vault integration
- 🔗 **Web3 Operations** - Ethereum-compatible transactions
- 🛡️ **Relayer Pattern** - Gasless transactions for users
- 📱 **OnChainKit Integration** - Coinbase's blockchain toolkit

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- WhatsApp account for bot authentication

### Installation

1. **Clone and navigate to the project**
   ```bash
   cd WhatsappBotBase/whatsapp-base-bot-smart-wallet
   ```

2. **Install dependencies for all components**
   ```bash
   # Backend Bot
   cd backend-bot && npm install && cd ..
   
   # Server
   cd server && npm install && cd ..
   
   # Frontend
   cd frontend && npm install && cd ..
   ```

3. **Configure environment variables**

   Create `.env` files in each component directory:

   **Backend Bot (backend-bot/.env)**
   ```bash
   PORT=3001
   BACKEND_API_URL=http://localhost:3002
   ```

   **Server (server/.env)**
   ```bash
   BACKEND_PORT=3002
   JWT_SECRET=your-super-secret
   NETWORK=baseSepolia
   BASE_SEPOLIA_RPC=https://sepolia.base.org
   BASE_MAINNET_RPC=https://mainnet.base.org
   USDC_CONTRACT_ADDRESS=0x...
   VAULT_CONTRACT_ADDRESS=0x... # Your deployed vault contract
   PRIVATE_KEY=0x... # Relayer wallet private key
   ```

   **Frontend (frontend/.env.local)**
   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:3002
   ```

4. **Start all services**

   In separate terminals:

   ```bash
   # Terminal 1 - Server
   cd server && npm run dev
   
   # Terminal 2 - Backend Bot
   cd backend-bot && npm run dev
   
   # Terminal 3 - Frontend
   cd frontend && npm run dev
   ```

5. **Access the applications**
   - Frontend: http://localhost:3000
   - Backend Bot: http://localhost:3001 (for QR code whathsapp login)
   - Server API: http://localhost:3002

## 📁 Project Structure

```
whatsapp-base-bot-smart-wallet/
├── backend-bot/                 # WhatsApp Web client
│   ├── services/               # Connection and backend services
│   ├── handlers/               # Message processing
│   ├── routes/                 # API endpoints
│   ├── public/                 # Static files (QR code display)
│   └── server.js              # Main bot server
├── server/                     # Backend API
│   ├── src/
│   │   ├── config/            # Database and blockchain config
│   │   ├── middleware/        # Authentication and security
│   │   ├── routes/            # API route handlers
│   │   ├── services/          # Business logic
│   │   └── utils/             # Utility functions
│   └── server.ts              # Main API server
├── frontend/                   # Next.js web application
│   ├── app/
│   │   ├── actions/           # Wallet operation pages
│   │   ├── components/        # React components
│   │   ├── context/           # React context providers
│   │   └── utils/             # Frontend utilities
│   └── next.config.ts         # Next.js configuration
└── README.md                  # This file
```

## 🔧 Configuration

### WhatsApp Bot Setup

1. **QR Code Authentication**
   - Start the backend bot
   - Navigate to http://localhost:3001
   - Scan QR code with WhatsApp mobile app
   - Bot will be ready when authentication completes

2. **Message Commands**
   - Users can interact via WhatsApp messages
   - Commands are processed by MessageHandler
   - Responses include wallet operations and status updates

## 🛠️ API Endpoints

### Authentication
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - User login
- `GET /api/users/check/:whatsapp_number` - Check user status

### Wallet Operations
- `GET /api/wallet/balance/:userId` - Get wallet balance
- `POST /api/vault/deposit` - Deposit funds
- `POST /api/vault/withdraw` - Withdraw funds
- `GET /api/vault/deposits/:userId` - Get deposit history

### Transfers & Transactions
- `POST /api/transfers/send` - Send transfer
- `GET /api/transactions/history/:userId` - Transaction history
- `GET /api/health` - System health check


## 🔒 Security Features

- **PIN Encryption** - Secure user PIN storage
- **CORS Configuration** - Cross-origin security

## 🌐 Deployment

### Environment-Specific Configurations

**Development**
- Use Base Sepolia testnet
- Enable debug logging

**Production**
- Use Base mainnet
- Production-grade PostgreSQL
- Enhanced security middleware
- Error monitoring

### Deployment Scripts
```bash
# Frontend deployment
cd frontend && npm run vercel:deploy

# Server deployment
cd server && npm run vercel:deploy
```

## 📚 Documentation

- [Backend Bot Architecture](backend-bot/ARCHITECTURE.md)
- [Server Architecture](server/ARCHITECTURE.md)
- [Blockchain Setup Guide](server/BLOCKCHAIN_SETUP.md)
- [Chain Configuration](server/CHAIN_CONFIGURATION.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the documentation in each component's directory
- Review the architecture guides
- Open an issue on the repository

## 🔮 Roadmap

- [ ] Migration to Whatsapp Business API
- [ ] Add security features to server and frontend
- [ ] Multi-language support
- [ ] Integration with more blockchain networks
- [ ] Advanced trading features 